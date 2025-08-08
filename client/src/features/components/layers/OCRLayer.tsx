import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Eye, Copy, Download, FileText, Zap } from "lucide-react";
import { createWorker, PSM } from "tesseract.js";
import { OCRWord, OCRProcessorProps } from "../../../types/pdf-types";

export default function OCRProcessor({
  pdfDocument,
  canvasRef,
  currentPage,
  onTextDetected,
  onTextBoxCreate,
}: OCRProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrResults, setOcrResults] = useState<OCRWord[]>([]);
  const [extractedText, setExtractedText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("eng");

  const languages = [
    { code: "eng", name: "English" },
    { code: "spa", name: "Spanish" },
    { code: "fra", name: "French" },
    { code: "deu", name: "German" },
    { code: "chi_sim", name: "Chinese (Simplified)" },
    { code: "jpn", name: "Japanese" },
    { code: "kor", name: "Korean" },
    { code: "rus", name: "Russian" },
    { code: "ara", name: "Arabic" },
    { code: "por", name: "Portuguese" },
  ];

  const extractTextFromPDF = useCallback(async () => {
    if (!pdfDocument) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const page = await pdfDocument.getPage(currentPage);
      const textContent = await page.getTextContent();

      let extractedPageText = "";
      const results: OCRWord[] = [];

      textContent.items.forEach((item: any, index: number) => {
        if (item.str && item.str.trim()) {
          extractedPageText += item.str + " ";

          // Create OCR result for PDF text
          results.push({
            id: `pdf-text-${index}`,
            text: item.str,
            confidence: 100, // PDF text is 100% confident
            boundingBox: {
              x: item.transform[4],
              y: item.transform[5],
              width: item.transform[4] + item.width,
              height: item.transform[5] + item.height,
            },
            page: currentPage,
          });
        }
      });

      setExtractedText(extractedPageText.trim());
      setOcrResults(results);
      onTextDetected?.(results);
      setProgress(100);
    } catch (error) {
      console.error("PDF text extraction error:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [pdfDocument, currentPage, onTextDetected]);

  const performOCR = useCallback(async () => {
    if (!canvasRef.current) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL("image/png");

      const worker = await createWorker(selectedLanguage);

      await worker.setParameters({
        PSM: PSM.SINGLE_BLOCK, // Use the Tesseract enum for best typing
        tessedit_char_whitelist:
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,!?-()[]{}:;\"'",
      });

      // Notice the `as any` cast on options to allow logger property
      const { data } = await worker.recognize(imageData, {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      } as any);

      // Ensure correct typing for words
      const words: OCRWord[] = ((data as any).words as OCRWord[]) || [];
      const results: OCRWord[] = words
        .filter((word: OCRWord) => word.text.trim() && word.confidence > 30)
        .map((word: OCRWord, index: number) => ({
          id: `ocr-${index}`,
          text: word.text,
          confidence: word.confidence,
          boundingBox: word.boundingBox,
          page: currentPage,
        }));

      setExtractedText(data.text);
      setOcrResults(results);
      onTextDetected?.(results);

      await worker.terminate();
    } catch (error) {
      console.error("OCR processing error:", error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [canvasRef, currentPage, selectedLanguage, onTextDetected]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(extractedText);
  }, [extractedText]);

  const downloadText = useCallback(() => {
    const blob = new Blob([extractedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `extracted-text-page-${currentPage}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [extractedText, currentPage]);

  const createTextBoxFromResult = useCallback(
    (result: OCRWord) => {
      if (onTextBoxCreate) {
        onTextBoxCreate(
          result.boundingBox.x,
          result.boundingBox.y,
          result.text,
        );
      }
    },
    [onTextBoxCreate],
  );

  const highlightTextOnCanvas = useCallback(
    (result: OCRWord) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw highlight rectangle
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
      ctx.fillRect(
        result.boundingBox.x,
        result.boundingBox.y,
        result.boundingBox.width - result.boundingBox.width,
        result.boundingBox.height - result.boundingBox.height,
      );
      ctx.restore();
    },
    [canvasRef],
  );

  return (
    <div className="space-y-4" data-oid="668q-6-">
      {/* OCR Controls */}
      <Card data-oid="pjudxu7">
        <CardHeader data-oid="cf-zpj_">
          <CardTitle className="flex items-center gap-2" data-oid="wjbqxam">
            <Eye className="h-5 w-5" data-oid="t3-gm1g" />
            Text Recognition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="rwa.p.x">
          <div className="flex items-center gap-2 flex-wrap" data-oid="wkuht5l">
            <Button
              onClick={extractTextFromPDF}
              disabled={isProcessing || !pdfDocument}
              size="sm"
              data-oid="gxr1vc2"
            >
              <FileText className="h-4 w-4 mr-1" data-oid="zu9iy8m" />
              Extract PDF Text
            </Button>

            <Button
              onClick={performOCR}
              disabled={isProcessing || !canvasRef.current}
              size="sm"
              variant="outline"
              data-oid="rsib6m."
            >
              <Zap className="h-4 w-4 mr-1" data-oid="_e8.0te" />
              OCR Scan
            </Button>

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
              disabled={isProcessing}
              data-oid="ujrsfjx"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code} data-oid="olk4ydp">
                  {lang.name}
                </option>
              ))}
            </select>

            {ocrResults.length > 0 && (
              <Badge variant="secondary" data-oid="ezlyb7k">
                {ocrResults.length} text regions found
              </Badge>
            )}
          </div>

          {isProcessing && (
            <div className="space-y-2" data-oid="4inhe8e">
              <Progress
                value={progress}
                className="w-full"
                data-oid="z8s9itb"
              />

              <p className="text-sm text-gray-500" data-oid="08mh11a">
                {progress > 0 ? `Processing: ${progress}%` : "Initializing..."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Display */}
      {extractedText && (
        <Card data-oid="n21imv6">
          <CardHeader data-oid="8uu9s46">
            <CardTitle
              className="flex items-center justify-between"
              data-oid="z.xvn63"
            >
              <span data-oid="52tz_c1">Extracted Text</span>
              <div className="flex gap-2" data-oid="51phg1x">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyToClipboard}
                  data-oid="rh:va0c"
                >
                  <Copy className="h-4 w-4 mr-1" data-oid="l7mrj:f" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadText}
                  data-oid="u86o0n2"
                >
                  <Download className="h-4 w-4 mr-1" data-oid="erdkk:7" />
                  Download
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="0o8v8.g">
            <Textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              className="min-h-32 font-mono text-sm"
              placeholder="Extracted text will appear here..."
              data-oid="8-j7qcq"
            />
          </CardContent>
        </Card>
      )}

      {/* Detected Text Regions */}
      {ocrResults.length > 0 && (
        <Card data-oid="ujwvlq:">
          <CardHeader data-oid="p:xf_0c">
            <CardTitle data-oid="g4kibp0">Detected Text Regions</CardTitle>
          </CardHeader>
          <CardContent data-oid="2j9fc.i">
            <ScrollArea className="h-48" data-oid="p-mb28:">
              <div className="space-y-2" data-oid="dwp80rc">
                {ocrResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                    data-oid="a83wdmw"
                  >
                    <div className="flex-1" data-oid="1g195bo">
                      <p className="text-sm font-medium" data-oid="3eh5bcc">
                        {result.text}
                      </p>
                      <p className="text-xs text-gray-500" data-oid="824hw.n">
                        Confidence: {Math.round(result.confidence)}%
                      </p>
                    </div>
                    <div className="flex gap-1" data-oid="pxata5.">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => highlightTextOnCanvas(result)}
                        data-oid="kyrw3o_"
                      >
                        Highlight
                      </Button>
                      {onTextBoxCreate && (
                        <Button
                          size="sm"
                          onClick={() => createTextBoxFromResult(result)}
                          data-oid="y__4uho"
                        >
                          Add Box
                        </Button>
                      )}
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
}

export type { OCRWord };
export { OCRProcessor };
