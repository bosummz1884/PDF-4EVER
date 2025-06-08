import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  Download, 
  Merge, 
  Split, 
  FileText,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Scissors,
  Package,
  RefreshCw,
  Eye,
  Check,
  X,
  Archive
} from "lucide-react";
import { PDFDocument, degrees } from 'pdf-lib';

interface PDFFile {
  id: string;
  name: string;
  file: File;
  document?: PDFDocument;
  pageCount: number;
  size: number;
  thumbnail?: string;
  isProcessing?: boolean;
}

interface SplitRange {
  start: number;
  end: number;
  name: string;
}

interface PDFDocumentManagerProps {
  onDocumentProcessed?: (result: Uint8Array, filename: string) => void;
}

export function PDFDocumentManager({ onDocumentProcessed }: PDFDocumentManagerProps) {
  const [documents, setDocuments] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [splitRanges, setSplitRanges] = useState<SplitRange[]>([]);
  const [compressionLevel, setCompressionLevel] = useState(50);
  const [activeTab, setActiveTab] = useState("merge");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList) => {
    setIsProcessing(true);
    setProgress(0);

    const newDocuments: PDFFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'application/pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          
          const pdfFile: PDFFile = {
            id: Date.now().toString() + i,
            name: file.name,
            file,
            document: pdfDoc,
            pageCount: pdfDoc.getPageCount(),
            size: file.size,
            isProcessing: false
          };
          
          newDocuments.push(pdfFile);
          setProgress(((i + 1) / files.length) * 100);
        } catch (error) {
          console.error(`Error loading PDF ${file.name}:`, error);
        }
      }
    }
    
    setDocuments(prev => [...prev, ...newDocuments]);
    setIsProcessing(false);
    setProgress(0);
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const moveDocument = (id: string, direction: 'up' | 'down') => {
    setDocuments(prev => {
      const index = prev.findIndex(doc => doc.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newDocs = [...prev];
      [newDocs[index], newDocs[newIndex]] = [newDocs[newIndex], newDocs[index]];
      return newDocs;
    });
  };

  const mergePDFs = async () => {
    if (documents.length < 2) return;
    
    try {
      setIsProcessing(true);
      setProgress(0);
      
      const mergedPdf = await PDFDocument.create();
      let processedPages = 0;
      let totalPages = documents.reduce((sum, doc) => sum + doc.pageCount, 0);
      
      for (const doc of documents) {
        if (doc.document) {
          const pages = await mergedPdf.copyPages(doc.document, doc.document.getPageIndices());
          pages.forEach(page => mergedPdf.addPage(page));
          
          processedPages += doc.pageCount;
          setProgress((processedPages / totalPages) * 100);
        }
      }
      
      const pdfBytes = await mergedPdf.save();
      const filename = `merged_document_${Date.now()}.pdf`;
      
      downloadPDF(pdfBytes, filename);
      onDocumentProcessed?.(pdfBytes, filename);
      
    } catch (error) {
      console.error('Error merging PDFs:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const splitPDF = async (document: PDFFile) => {
    if (!document.document || splitRanges.length === 0) return;
    
    try {
      setIsProcessing(true);
      setProgress(0);
      
      for (let i = 0; i < splitRanges.length; i++) {
        const range = splitRanges[i];
        const splitPdf = await PDFDocument.create();
        
        // Validate range
        const startPage = Math.max(1, Math.min(range.start, document.pageCount));
        const endPage = Math.max(startPage, Math.min(range.end, document.pageCount));
        
        // Copy pages in range
        const pageIndices = Array.from(
          { length: endPage - startPage + 1 }, 
          (_, index) => startPage - 1 + index
        );
        
        const pages = await splitPdf.copyPages(document.document, pageIndices);
        pages.forEach(page => splitPdf.addPage(page));
        
        const pdfBytes = await splitPdf.save();
        const filename = `${range.name || `split_${i + 1}`}_${Date.now()}.pdf`;
        
        downloadPDF(pdfBytes, filename);
        onDocumentProcessed?.(pdfBytes, filename);
        
        setProgress(((i + 1) / splitRanges.length) * 100);
      }
      
    } catch (error) {
      console.error('Error splitting PDF:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const compressPDF = async (document: PDFFile) => {
    if (!document.document) return;
    
    try {
      setIsProcessing(true);
      setProgress(25);
      
      // Create a new PDF with compression
      const compressedPdf = await PDFDocument.create();
      setProgress(50);
      
      // Copy all pages
      const pages = await compressedPdf.copyPages(document.document, document.document.getPageIndices());
      pages.forEach(page => compressedPdf.addPage(page));
      setProgress(75);
      
      // Save with compression settings
      const pdfBytes = await compressedPdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: Math.floor(compressionLevel / 10) + 1
      });
      
      const filename = `compressed_${document.name}`;
      const compressionRatio = ((document.size - pdfBytes.length) / document.size * 100).toFixed(1);
      
      console.log(`Compression: ${formatFileSize(document.size)} → ${formatFileSize(pdfBytes.length)} (${compressionRatio}% reduction)`);
      
      downloadPDF(pdfBytes, filename);
      onDocumentProcessed?.(pdfBytes, filename);
      setProgress(100);
      
    } catch (error) {
      console.error('Error compressing PDF:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const downloadPDF = (pdfBytes: Uint8Array, filename: string) => {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const addSplitRange = () => {
    const newRange: SplitRange = {
      start: 1,
      end: documents[0]?.pageCount || 1,
      name: `Section ${splitRanges.length + 1}`
    };
    setSplitRanges(prev => [...prev, newRange]);
  };

  const updateSplitRange = (index: number, field: keyof SplitRange, value: string | number) => {
    setSplitRanges(prev => prev.map((range, i) => 
      i === index ? { ...range, [field]: value } : range
    ));
  };

  const removeSplitRange = (index: number) => {
    setSplitRanges(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PDF Document Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDrop={(e) => {
              e.preventDefault();
              const files = e.dataTransfer.files;
              if (files.length > 0) handleFileUpload(files);
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
              Drop PDF files here or click to upload
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Support for multiple PDF files
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={(e) => {
              if (e.target.files) handleFileUpload(e.target.files);
            }}
            className="hidden"
          />
          
          {isProcessing && (
            <div className="mt-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600 text-center mt-2">
                Processing documents... {progress.toFixed(0)}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document List */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Loaded Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Badge variant="outline">{doc.pageCount} pages</Badge>
                          <span>{formatFileSize(doc.size)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveDocument(doc.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveDocument(doc.id, 'down')}
                        disabled={index === documents.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeDocument(doc.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Operations */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Document Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="merge" className="flex items-center gap-2">
                  <Merge className="h-4 w-4" />
                  Merge
                </TabsTrigger>
                <TabsTrigger value="split" className="flex items-center gap-2">
                  <Split className="h-4 w-4" />
                  Split
                </TabsTrigger>
                <TabsTrigger value="compress" className="flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Compress
                </TabsTrigger>
              </TabsList>

              <TabsContent value="merge" className="space-y-4">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Merge {documents.length} PDF documents into a single file
                  </p>
                  <Button
                    onClick={mergePDFs}
                    disabled={documents.length < 2 || isProcessing}
                    className="w-full"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    {isProcessing ? 'Merging...' : `Merge ${documents.length} Documents`}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="split" className="space-y-4">
                {documents.length === 1 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Split Ranges</h4>
                      <Button variant="outline" size="sm" onClick={addSplitRange}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add Range
                      </Button>
                    </div>
                    
                    {splitRanges.length === 0 ? (
                      <p className="text-gray-600 text-center py-4">
                        Add split ranges to divide the document
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {splitRanges.map((range, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                            <Input
                              placeholder="Section name"
                              value={range.name}
                              onChange={(e) => updateSplitRange(index, 'name', e.target.value)}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              placeholder="Start"
                              value={range.start}
                              onChange={(e) => updateSplitRange(index, 'start', parseInt(e.target.value) || 1)}
                              className="w-20"
                              min={1}
                              max={documents[0].pageCount}
                            />
                            <span className="text-gray-500">to</span>
                            <Input
                              type="number"
                              placeholder="End"
                              value={range.end}
                              onChange={(e) => updateSplitRange(index, 'end', parseInt(e.target.value) || 1)}
                              className="w-20"
                              min={range.start}
                              max={documents[0].pageCount}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeSplitRange(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {splitRanges.length > 0 && (
                      <Button
                        onClick={() => splitPDF(documents[0])}
                        disabled={isProcessing}
                        className="w-full"
                      >
                        <Scissors className="h-4 w-4 mr-2" />
                        {isProcessing ? 'Splitting...' : `Split into ${splitRanges.length} Files`}
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">
                    Load exactly one PDF document to split it
                  </p>
                )}
              </TabsContent>

              <TabsContent value="compress" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Compression Level: {compressionLevel}%</Label>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={compressionLevel}
                      onChange={(e) => setCompressionLevel(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Lower quality</span>
                      <span>Higher quality</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            Current size: {formatFileSize(doc.size)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => compressPDF(doc)}
                          disabled={isProcessing}
                        >
                          <Archive className="h-3 w-3 mr-1" />
                          Compress
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}