// src/components/tool-panels/OCRToolComponent.tsx

import React, { useState, useCallback, useMemo, ChangeEvent, DragEvent } from "react";
import { ocrService, OCR_LANGUAGES } from "../../services/OCRService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePDFEditor } from "@/features/pdf-editor/PDFEditorContext";
import { OCRResult, TextElement } from "@/types/pdf-types";
import { Upload, Copy, Zap, Eye, PlusSquare, Edit2, Check, X, Search } from "lucide-react";
import { OCRTextEditor } from "@/features/components/OCRTextEditor";
import { OCRAreaSelector } from "@/features/components/OCRAreaSelector";
import { BoundingBox } from "@/types/pdf-types";

export const OCRToolComponent: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { state, dispatch } = usePDFEditor();
  const { canvasRef, currentPage, scale } = state;

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [extractedText, setExtractedText] = useState<string>("");
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("eng");
  const [languageSearch, setLanguageSearch] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAreaSelecting, setIsAreaSelecting] = useState(false);
  const [selectedArea, setSelectedArea] = useState<BoundingBox | null>(null);

  // Handle area selection
  const handleAreaSelected = useCallback((area: BoundingBox) => {
    setSelectedArea(area);
    setIsAreaSelecting(false);
    performCanvasOCR(area);
  }, [performCanvasOCR]);

  const handleCancelAreaSelection = useCallback(() => {
    setIsAreaSelecting(false);
    setSelectedArea(null);
  }, []);

  const handleFullPageOCR = useCallback(() => {
    setSelectedArea(null);
    performCanvasOCR();
  }, [performCanvasOCR]);

  const handleAreaOCR = useCallback(() => {
    setIsAreaSelecting(true);
  }, []);

  // Group languages by script/region with search functionality
  const languageGroups = useMemo(() => {
    const groups: Record<string, {name: string, languages: Array<{code: string, name: string}>}> = {
      western: { name: "Western European", languages: [] },
      asian: { name: "Asian Languages", languages: [] },
      cyrillic: { name: "Cyrillic Script", languages: [] },
      middleEastern: { name: "Middle Eastern", languages: [] },
      indian: { name: "Indian Subcontinent", languages: [] },
      other: { name: "Other Languages", languages: [] }
    };

    // Filter languages based on search
    const filteredLangs = OCR_LANGUAGES.filter(lang => 
      lang.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
      lang.code.toLowerCase().includes(languageSearch.toLowerCase())
    );

    // Categorize languages
    filteredLangs.forEach(lang => {
      if (['eng', 'spa', 'fra', 'deu', 'por', 'ita', 'nld', 'swe', 'nor', 'dan', 'fin', 'pol', 'ron', 'cat', 'eus', 'glg', 'hrv', 'slv', 'ces', 'slk', 'hun', 'ell'].includes(lang.code)) {
        groups.western.languages.push(lang);
      } else if (['chi_sim', 'chi_tra', 'jpn', 'kor', 'tha', 'vie', 'ind', 'msa', 'fil', 'mya'].includes(lang.code)) {
        groups.asian.languages.push(lang);
      } else if (['rus', 'ukr', 'bul', 'srp'].includes(lang.code)) {
        groups.cyrillic.languages.push(lang);
      } else if (['ara', 'fas', 'heb', 'tur'].includes(lang.code)) {
        groups.middleEastern.languages.push(lang);
      } else if (['hin', 'ben', 'tam', 'tel', 'kan', 'mal', 'guj', 'pan'].includes(lang.code)) {
        groups.indian.languages.push(lang);
      } else if (['lat', 'swe_old', 'frm', 'enm'].includes(lang.code)) {
        groups.historical.languages.push(lang);
      } else {
        groups.other.languages.push(lang);
      }
    });

    // Remove empty groups and sort languages within each group
    return Object.entries(groups)
      .filter(([_, group]) => group.languages.length > 0)
      .map(([key, group]) => ({
        id: key,
        name: group.name,
        languages: [...group.languages].sort((a, b) => a.name.localeCompare(b.name))
      }));
  }, [languageSearch]);

  const handleOcrResult = useCallback(
    (text: string, results: OCRResult[]) => {
      setExtractedText(text);
      setOcrResults(results);
      setEditingResultId(null);
      // Dispatch results to the central state, associated with the current page
      dispatch({
        type: "SET_OCR_RESULTS",
        payload: { page: currentPage, results },
      });
    },
    [dispatch, currentPage],
  );

  const handleUpdateOCRText = useCallback((result: OCRResult, newText: string) => {
    setOcrResults(prevResults => {
      const updatedResults = ocrService.updateOCRText(prevResults, result.id, newText);
      
      // Update the extracted text
      const updatedText = updatedResults.map(r => r.text).join(' ');
      setExtractedText(updatedText);
      
      // Update the global state
      dispatch({
        type: "SET_OCR_RESULTS",
        payload: { page: currentPage, results: updatedResults },
      });
      
      return updatedResults;
    });
    setEditingResultId(null);
  }, [currentPage, dispatch]);

  const handleEditResult = useCallback((resultId: string) => {
    setEditingResultId(resultId);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingResultId(null);
  }, []);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setPreviewUrl(null);
    setExtractedText("");
    setOcrResults([]);

    try {
      if (file.type === "application/pdf") {
        const {
          ocrText,
          ocrResults,
          previewUrl: pdfPreview,
        } = await ocrService.performPDFOCR(file, selectedLanguage, setProgress);
        handleOcrResult(ocrText, ocrResults);
        if (pdfPreview) setPreviewUrl(pdfPreview);
      } else if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        const { ocrText, ocrResults } = await ocrService.performOCR(
          file,
          selectedLanguage,
          1,
          1,
          setProgress,
        );
        handleOcrResult(ocrText, ocrResults);
      } else {
        throw new Error("Unsupported file type. Please upload an image or PDF.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsProcessing(false);
    }
  }, [handleOcrResult, selectedLanguage]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isProcessing) return;
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const performCanvasOCR = useCallback(async (area?: BoundingBox) => {
    if (!canvasRef?.current) return;
    
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setExtractedText("");
    setOcrResults([]);
    
    try {
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL("image/png");
      
      // We can treat the canvas data as an image file for processing
      const response = await fetch(imageData);
      const blob = await response.blob();
      const file = new File([blob], "canvas.png", { type: "image/png" });
      
      const result = await ocrService.performOCR(
        file,
        selectedLanguage,
        currentPage,
        state.totalPages,
        (progress) => setProgress(progress),
        {
          area: area || undefined,
          detectTables: true
        }
      );
      
      if (result) {
        handleOcrResult(result.ocrText, result.ocrResults);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during OCR');
    } finally {
      setIsProcessing(false);
    }
  }, [canvasRef, currentPage, selectedLanguage, state.totalPages, handleOcrResult]);

  const addTextToPage = (result: OCRResult) => {
    const toolSettings = state.toolSettings.text;
    const newTextElement: TextElement = {
      id: `text-${Date.now()}`,
      page: currentPage,
      text: result.text,
      x: result.boundingBox.x0 / scale, // Descale coordinates
      y: result.boundingBox.y0 / scale,
      width: (result.boundingBox.x1 - result.boundingBox.x0) / scale,
      height: (result.boundingBox.y1 - result.boundingBox.y0) / scale,
      fontFamily: toolSettings.fontFamily || 'Helvetica',
      fontSize: toolSettings.fontSize || 12, // Default size
      color: toolSettings.color || '#000000',
      bold: toolSettings.bold || false,
      italic: toolSettings.italic || false,
      underline: toolSettings.underline || false,
      textAlign: 'left',
      lineHeight: 1.2,
      rotation: 0,
    };
    dispatch({ type: 'ADD_TEXT_ELEMENT', payload: { page: currentPage, element: newTextElement } });
    dispatch({ type: 'SAVE_TO_HISTORY' });
  };

  const highlightOnCanvas = (result: OCRResult) => {
    if (canvasRef?.current) {
      ocrService.highlightTextOnCanvas(result, canvasRef);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Language Selection */}
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={isProcessing}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[400px] overflow-y-auto">
            <div className="sticky top-0 bg-background z-10 p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search languages..."
                  className="pl-8 h-9"
                  value={languageSearch}
                  onChange={(e) => setLanguageSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <ScrollArea className="h-[300px] w-full">
              {languageGroups.length > 0 ? (
                languageGroups.map((group) => (
                  <div key={group.id} className="space-y-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {group.name}
                    </div>
                    {group.languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code} className="pl-6">
                        {lang.name}
                      </SelectItem>
                    ))}
                    {group.id !== languageGroups[languageGroups.length - 1].id && (
                      <Separator className="my-1" />
                    )}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No languages found
                </div>
              )}
            </ScrollArea>
          </SelectContent>
        </Select>
        
        {/* Scan Button */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
            onClick={handleFullPageOCR}
            disabled={isProcessing}
            variant={!selectedArea ? 'default' : 'outline'}
            className="w-full"
          >
            <Zap className="w-4 h-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Full Page'}
          </Button>
          <Button
            onClick={handleAreaOCR}
            disabled={isProcessing || isAreaSelecting}
            variant={selectedArea ? 'default' : 'outline'}
            className="w-full"
          >
            <PlusSquare className="w-4 h-4 mr-2" />
            {isAreaSelecting ? 'Select Area...' : 'Select Area'}
          </Button>
        </div>
        
        {/* Upload Button */}
        <Button 
          onClick={() => document.getElementById("ocr-file-input")?.click()}
          disabled={isProcessing}
          size="sm"
          variant="outline"
        >
          <Upload className="h-3 w-3 mr-1" /> 
          Upload
        </Button>
        
        <input
          id="ocr-file-input"
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,application/pdf"
        />
        
        {/* Progress */}
        {isProcessing && (
          <div className="flex items-center gap-2">
            <Progress value={progress} className="w-16 h-2" />
            <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
          </div>
        )}
        
        {/* Results Count */}
        {ocrResults.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {ocrResults.length} regions found
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-black/20"
            onClick={() => document.getElementById("ocr-file-input")?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Drag & drop or click to upload</p>
            <p className="text-xs text-gray-500">Image or PDF file</p>
            <input
              id="ocr-file-input"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,application/pdf"
            />
          </div>
        </CardContent>
      </Card>

      {/* Area Selection Overlay */}
      {isAreaSelecting && canvasRef?.current && (
        <OCRAreaSelector
          canvasRef={canvasRef}
          scale={scale}
          onAreaSelected={handleAreaSelected}
          onCancel={handleCancelAreaSelection}
        />
      )}

      {previewUrl && <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded border" />}

      <div className="flex items-center gap-2 mb-4">
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={isProcessing}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[400px] overflow-y-auto">
            <div className="sticky top-0 bg-background z-10 p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search languages..."
                  className="pl-8 h-9"
                  value={languageSearch}
                  onChange={(e) => setLanguageSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <ScrollArea className="h-[300px] w-full">
              {languageGroups.length > 0 ? (
                languageGroups.map((group) => (
                  <div key={group.id} className="space-y-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {group.name}
                    </div>
                    {group.languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code} className="pl-6">
                        {lang.name}
                      </SelectItem>
                    ))}
                    {group.id !== languageGroups[languageGroups.length - 1].id && (
                      <Separator className="my-1" />
                    )}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No languages found
                </div>
              )}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>

      {isProcessing && <Progress value={progress} className="w-full" />}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Extracted Text Section */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium">Extracted Text</h4>
          {ocrResults.length > 0 && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigator.clipboard.writeText(extractedText)}
                className="h-7 text-xs"
              >
                <Copy className="h-3 w-3 mr-1" /> Copy All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setEditingResultId(ocrResults[0]?.id || null)}
                className="h-7 text-xs"
              >
                <Edit2 className="h-3 w-3 mr-1" /> Edit Text
              </Button>
            </div>
          )}
        </div>
        
        <Card>
          <CardContent className="p-4 min-h-48 max-h-96 overflow-auto">
            {ocrResults.length > 0 ? (
              <div className="space-y-2">
                {ocrResults.map((result) => (
                  <div key={result.id} className="relative group">
                    {editingResultId === result.id ? (
                      <OCRTextEditor
                        result={result}
                        onSave={handleUpdateOCRText}
                        onCancel={handleCancelEdit}
                        scale={scale}
                      />
                    ) : (
                      <div 
                        className="p-2 rounded hover:bg-yellow-50/50 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                        onClick={() => setEditingResultId(result.id)}
                      >
                        <div className="text-sm text-gray-800 break-words">
                          {result.text}
                        </div>
                        <div className="mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              highlightOnCanvas(result);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" /> Highlight
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              addTextToPage(result);
                            }}
                          >
                            <PlusSquare className="h-3 w-3 mr-1" /> Add to Page
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                {isProcessing ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                    <p>Processing OCR...</p>
                  </div>
                ) : (
                  <p className="text-center">
                    No text extracted yet. <br />
                    Click 'Scan Current View' to extract text from the document.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};