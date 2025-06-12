import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ScanText, 
  Copy, 
  Download, 
  FileText, 
  Search,
  Languages,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { createWorker, Worker } from 'tesseract.js';

interface TextRegion {
  id: string;
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number; 
      x1: number;
      y1: number;
    };
  }>;
}

interface OCRResult {
  text: string;
  confidence: number;
  regions: TextRegion[];
  language: string;
  processingTime: number;
}

interface OCRTextExtractorProps {
  imageData?: string | HTMLCanvasElement;
  onTextExtracted?: (result: OCRResult) => void;
  languages?: string[];
}

export function OCRTextExtractor({ 
  imageData, 
  onTextExtracted,
  languages = ['eng']
}: OCRTextExtractorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(languages);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedText, setHighlightedText] = useState<string[]>([]);
  
  const workerRef = useRef<Worker | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const supportedLanguages = [
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'ita', name: 'Italian' },
    { code: 'por', name: 'Portuguese' },
    { code: 'rus', name: 'Russian' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'chi_sim', name: 'Chinese (Simplified)' },
    { code: 'chi_tra', name: 'Chinese (Traditional)' },
    { code: 'ara', name: 'Arabic' },
    { code: 'hin', name: 'Hindi' },
    { code: 'kor', name: 'Korean' },
    { code: 'tha', name: 'Thai' },
    { code: 'vie', name: 'Vietnamese' }
  ];

  const initializeWorker = async () => {
    if (workerRef.current) {
      await workerRef.current.terminate();
    }

    const worker = await createWorker();
    workerRef.current = worker;

    // Load languages
    const langString = selectedLanguages.join('+');
    await worker.loadLanguage(langString);
    await worker.initialize(langString);

    // Configure OCR parameters for better accuracy
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz !@#$%^&*()_+-=[]{}|;:,.<>?`~"\'',
      tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
      preserve_interword_spaces: '1'
    });

    return worker;
  };

  const extractTextFromImage = async (imageSource: string | HTMLCanvasElement) => {
    try {
      setIsProcessing(true);
      setProgress(0);
      setError(null);
      setOcrResult(null);

      const startTime = Date.now();
      const worker = await initializeWorker();

      // Set up progress tracking
      worker.setParameters({
        tessedit_create_hocr: '1',
        tessedit_create_tsv: '1'
      });

      setProgress(25);

      // Perform OCR
      const { data } = await worker.recognize(imageSource, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(25 + (m.progress * 0.7 * 100));
          }
        }
      });

      setProgress(95);

      // Process results
      const processingTime = Date.now() - startTime;
      
      // Extract regions with bounding boxes
      const regions: TextRegion[] = data.paragraphs?.map((para, index) => ({
        id: `region_${index}`,
        text: para.text.trim(),
        confidence: para.confidence,
        bbox: para.bbox,
        words: para.words?.map(word => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox
        })) || []
      })).filter(region => region.text.length > 0) || [];

      const result: OCRResult = {
        text: data.text.trim(),
        confidence: data.confidence,
        regions,
        language: selectedLanguages.join('+'),
        processingTime
      };

      setOcrResult(result);
      onTextExtracted?.(result);
      setProgress(100);

      // Clean up
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 500);

    } catch (err) {
      console.error('OCR Error:', err);
      setError(err instanceof Error ? err.message : 'OCR processing failed');
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const processCurrentImage = async () => {
    if (!imageData) {
      setError('No image data provided');
      return;
    }

    await extractTextFromImage(imageData);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const downloadText = (text: string, filename: string = 'extracted_text.txt') => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const searchInText = (term: string) => {
    if (!ocrResult || !term.trim()) {
      setHighlightedText([]);
      return;
    }

    const matches = ocrResult.text.match(new RegExp(term, 'gi')) || [];
    setHighlightedText(matches);
  };

  const highlightText = (text: string) => {
    if (!searchTerm || highlightedText.length === 0) {
      return text;
    }

    return text.replace(
      new RegExp(`(${searchTerm})`, 'gi'),
      '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (confidence >= 60) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanText className="h-5 w-5" />
            OCR Text Extraction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Languages</label>
            <div className="flex flex-wrap gap-2">
              {supportedLanguages.slice(0, 6).map(lang => (
                <Badge
                  key={lang.code}
                  variant={selectedLanguages.includes(lang.code) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedLanguages(prev => 
                      prev.includes(lang.code)
                        ? prev.filter(l => l !== lang.code)
                        : [...prev, lang.code]
                    );
                  }}
                >
                  {lang.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Process Button */}
          <Button
            onClick={processCurrentImage}
            disabled={isProcessing || !imageData}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ScanText className="h-4 w-4 mr-2" />
                Extract Text
              </>
            )}
          </Button>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">
                {progress < 25 ? 'Initializing...' :
                 progress < 95 ? 'Recognizing text...' :
                 'Finalizing...'}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {ocrResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Extraction Results</span>
              <div className="flex items-center gap-2">
                {getConfidenceIcon(ocrResult.confidence)}
                <span className={`text-sm ${getConfidenceColor(ocrResult.confidence)}`}>
                  {ocrResult.confidence.toFixed(1)}% confidence
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text">Full Text</TabsTrigger>
                <TabsTrigger value="regions">Text Regions</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4">
                {/* Search */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search in extracted text..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        searchInText(e.target.value);
                      }}
                      className="pl-10 pr-4 py-2 border rounded-md w-full"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(ocrResult.text)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadText(ocrResult.text)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>

                {/* Extracted Text */}
                <ScrollArea className="h-64 w-full border rounded-md p-4">
                  <div 
                    className="text-sm whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightText(ocrResult.text) 
                    }}
                  />
                </ScrollArea>

                {searchTerm && highlightedText.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Found {highlightedText.length} matches for "{searchTerm}"
                  </p>
                )}
              </TabsContent>

              <TabsContent value="regions" className="space-y-4">
                <ScrollArea className="h-64 w-full">
                  <div className="space-y-3">
                    {ocrResult.regions.map((region, index) => (
                      <Card key={region.id} className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500">
                            Region {index + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            {getConfidenceIcon(region.confidence)}
                            <span className={`text-xs ${getConfidenceColor(region.confidence)}`}>
                              {region.confidence.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-sm">{region.text}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          Position: ({region.bbox.x0}, {region.bbox.y0}) to ({region.bbox.x1}, {region.bbox.y1})
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold">{ocrResult.text.split(/\s+/).length}</div>
                      <div className="text-sm text-gray-600">Words</div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-center">
                      <Languages className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold">{ocrResult.text.length}</div>
                      <div className="text-sm text-gray-600">Characters</div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-center">
                      <Zap className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold">{(ocrResult.processingTime / 1000).toFixed(1)}s</div>
                      <div className="text-sm text-gray-600">Processing Time</div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-center">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                      <div className="text-2xl font-bold">{ocrResult.regions.length}</div>
                      <div className="text-sm text-gray-600">Text Regions</div>
                    </div>
                  </Card>
                </div>

                <Card className="p-4">
                  <h4 className="font-medium mb-2">Language Detection</h4>
                  <p className="text-sm text-gray-600">
                    Processed with: {ocrResult.language.split('+').map(lang => 
                      supportedLanguages.find(l => l.code === lang)?.name || lang
                    ).join(', ')}
                  </p>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}