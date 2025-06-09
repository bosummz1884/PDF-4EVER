import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { pdfjsLib } from "@/lib/pdfWorker";

interface TextPage {
  pageIndex: number;
  text: string;
}

interface TextDetectorProps {
  onTextExtracted?: (textPages: TextPage[]) => void;
}

const TextDetector: React.FC<TextDetectorProps> = ({ onTextExtracted }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const extractText = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";

    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      setIsProcessing(true);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const textPages: TextPage[] = [];

        for (let i = 0; i < pdf.numPages; i++) {
          const page = await pdf.getPage(i + 1);
          const content = await page.getTextContent();
          const text = content.items
            .map((item: any) => item.str)
            .join(" ");
          textPages.push({ pageIndex: i, text });
        }

        onTextExtracted?.(textPages);
      } catch (error) {
        alert('Error extracting text: ' + (error as Error).message);
      } finally {
        setIsProcessing(false);
      }
    };

    input.click();
  };

  return (
    <Button
      onClick={extractText}
      disabled={isProcessing}
      variant="outline"
      className="border-destructive text-destructive hover:bg-destructive/10"
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Extracting...
        </>
      ) : (
        <>
          <FileText className="w-4 h-4 mr-2" />
          Detect Text in PDF
        </>
      )}
    </Button>
  );
};

export default TextDetector;