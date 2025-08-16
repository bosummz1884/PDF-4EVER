// src/components/tool-panels/OCRToolComponent.tsx

import React, { useState, useCallback, ChangeEvent, DragEvent } from "react";
import { ocrService, OCR_LANGUAGES } from "../../services/OCRService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
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
import { Upload, Copy, Zap, Eye, PlusSquare } from "lucide-react";

export const OCRToolComponent: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { state, dispatch } = usePDFEditor();
  const { canvasRef, currentPage, scale } = state;

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [extractedText, setExtractedText] = useState<string>("");
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("eng");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleOcrResult = useCallback(
    (text: string, results: OCRResult[]) => {
      setExtractedText(text);
      setOcrResults(results);
      // Dispatch results to the central state, associated with the current page
      dispatch({
        type: "SET_OCR_RESULTS",
        payload: { page: currentPage, results },
      });
    },
    [dispatch, currentPage],
  );

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

  const performCanvasOCR = useCallback(async () => {
    if (!canvasRef?.current) return;
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL("image/png");
    // We can treat the canvas data as an image file for processing
    const blob = await (await fetch(imageData)).blob();
    const file = new File([blob], "canvas.png", { type: "image/png" });
    await processFile(file);
  }, [canvasRef, processFile]);

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
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OCR_LANGUAGES.map(lang => (
              <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Scan Button */}
        <Button 
          onClick={performCanvasOCR} 
          disabled={isProcessing || !canvasRef?.current} 
          size="sm"
          variant="outline"
        >
          <Zap className="h-3 w-3 mr-1" /> 
          Scan
        </Button>
        
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

      {previewUrl && <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded border" />}

      <div className="flex items-center gap-2">
        <Button onClick={performCanvasOCR} disabled={isProcessing || !canvasRef?.current} className="flex-1">
          <Zap className="h-4 w-4 mr-2" /> Scan Current View
        </Button>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={isProcessing}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {OCR_LANGUAGES.map(lang => (
              <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isProcessing && <Progress value={progress} className="w-full" />}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {extractedText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex justify-between items-center">
              Extracted Text
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(extractedText)}>
                <Copy className="h-3 w-3 mr-2" />Copy
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={extractedText} readOnly className="min-h-32 font-mono text-xs" />
          </CardContent>
        </Card>
      )}

      {ocrResults.length > 0 && (
        <Card>
          <CardHeader>
              <CardTitle className="text-base">Detected Text Regions</CardTitle>
          </CardHeader>
          <CardContent>
              <ScrollArea className="h-48">
                  <div className="space-y-2">
                      {ocrResults.map((result) => (
                          <div key={result.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                              <div className="flex-1">
                                  <p className="text-sm font-medium">{result.text}</p>
                                  <p className="text-xs text-muted-foreground">Confidence: {Math.round(result.confidence)}%</p>
                              </div>
                              <div className="flex gap-1">
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => highlightOnCanvas(result)} title="Highlight on page">
                                      <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => addTextToPage(result)} title="Add as text box">
                                      <PlusSquare className="h-4 w-4" />
                                  </Button>
                              </div>
                          </div>
                      ))}
                  </div>
              </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};