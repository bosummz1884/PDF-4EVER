import React, { useState, useCallback, ChangeEvent, DragEvent } from "react";
import { ocrService } from "../../services/OCRService";
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
import { usePDFEditor } from "@/features/pdf-editor/PDFEditorContext";
import { OCRResult } from "@/types/pdf-types";
import { Upload, Copy, Zap } from "lucide-react";

export const OCRToolComponent: React.FC = () => {
  // GET DISPATCH FROM THE CONTEXT
  const { state, dispatch } = usePDFEditor();
  const { canvasRef, currentPage } = state;

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [extractedText, setExtractedText] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("eng");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // UPDATE THIS FUNCTION
  const handleOcrResult = useCallback(
    (text: string, results: OCRResult[]) => {
      setExtractedText(text); // Keep for the local UI text area
      // This is the new line that sends the data to our central state
      dispatch({
        type: "SET_OCR_RESULTS",
        payload: { page: currentPage, results },
      });
    },
    [dispatch, currentPage],
  );

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setPreviewUrl(null);
    setExtractedText("");

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
        throw new Error(
          "Unsupported file type. Please upload an image or PDF.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

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
    const blob = await (await fetch(imageData)).blob();
    const file = new File([blob], "canvas.png", { type: "image/png" });
    await processFile(file);
  }, [canvasRef, selectedLanguage, processFile]);

  return (
    <div className="p-4 space-y-4" data-oid="3e7e1sw">
      <h3 className="text-sm font-medium" data-oid="kp069vk">
        Text Recognition (OCR)
      </h3>
      <Card data-oid="ceom0_0">
        <CardContent className="pt-6" data-oid="kjsq4.7">
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:bg-gray-50"
            onClick={() => document.getElementById("ocr-file-input")?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            data-oid="4zn.wz-"
          >
            <Upload
              className="mx-auto h-8 w-8 text-gray-400"
              data-oid="qfyb6lk"
            />

            <p className="mt-2 text-sm text-gray-600" data-oid="2meo0cf">
              Drag & drop or click to upload
            </p>
            <p className="text-xs text-gray-500" data-oid="pg9u5gi">
              Image or PDF file
            </p>
            <input
              id="ocr-file-input"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              data-oid=":wede.z"
            />
          </div>
        </CardContent>
      </Card>

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Preview"
          className="max-h-40 mx-auto rounded border"
          data-oid="zr8_fwy"
        />
      )}

      <div className="flex items-center gap-2" data-oid="4tpr4jl">
        <Button
          onClick={performCanvasOCR}
          disabled={isProcessing || !canvasRef?.current}
          className="flex-1"
          data-oid="1:vu-bz"
        >
          <Zap className="h-4 w-4 mr-2" data-oid="f372m76" /> Scan Current View
        </Button>
        <Select
          value={selectedLanguage}
          onValueChange={setSelectedLanguage}
          disabled={isProcessing}
          data-oid="ve8r7l:"
        >
          <SelectTrigger className="w-[120px]" data-oid="lx5jagw">
            <SelectValue data-oid="e8tpx:d" />
          </SelectTrigger>
          <SelectContent data-oid="oyjxvdp">
            <SelectItem value="eng" data-oid="1::g24q">
              English
            </SelectItem>
            <SelectItem value="spa" data-oid="z9aakdk">
              Spanish
            </SelectItem>
            <SelectItem value="deu" data-oid="gqgje2-">
              German
            </SelectItem>
            <SelectItem value="fra" data-oid="duhiyuj">
              French
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isProcessing && (
        <Progress value={progress} className="w-full" data-oid="6gt0ew6" />
      )}
      {error && (
        <p className="text-sm text-red-600" data-oid="u1y4ow9">
          {error}
        </p>
      )}

      {extractedText && (
        <Card data-oid="958j4k0">
          <CardHeader data-oid="xbsdm0i">
            <CardTitle
              className="text-base flex justify-between items-center"
              data-oid="e9feovu"
            >
              Extracted Text
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(extractedText)}
                data-oid="uqcqb._"
              >
                <Copy className="h-3 w-3 mr-2" data-oid="5yelrv6" />
                Copy
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="g7-oycj">
            <Textarea
              value={extractedText}
              readOnly
              className="min-h-32 font-mono text-xs"
              data-oid="5ru9gah"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
