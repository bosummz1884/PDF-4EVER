import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import Tesseract from "tesseract.js";

interface OcrExtractorProps {
  onTextExtracted?: (text: string) => void;
}

const OcrExtractor: React.FC<OcrExtractorProps> = ({ onTextExtracted }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImageUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      setProgress(0);

      try {
        const result = await Tesseract.recognize(file, "eng", {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          }
        });

        onTextExtracted?.(result.data.text);
      } catch (error) {
        alert('Error extracting text: ' + (error as Error).message);
      } finally {
        setIsProcessing(false);
        setProgress(0);
      }
    };

    input.click();
  };

  return (
    <Button
      onClick={handleImageUpload}
      disabled={isProcessing}
      variant="outline"
      className="border-secondary text-secondary hover:bg-secondary/10"
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          OCR Processing... {progress}%
        </>
      ) : (
        <>
          <Camera className="w-4 h-4 mr-2" />
          Extract Text from Image (OCR)
        </>
      )}
    </Button>
  );
};

export default OcrExtractor;