import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Type, Loader2 } from "lucide-react";

const FONT_LIST = [
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Trebuchet MS",
  "Comic Sans MS",
  "Helvetica",
  "Calibri",
  "Roboto"
];

interface FontScannerProps {
  onFontDetected?: (font: string) => void;
}

const FontScanner: React.FC<FontScannerProps> = ({ onFontDetected }) => {
  const [status, setStatus] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const handleFontScan = async () => {
    setIsScanning(true);
    setStatus("Preparing scan...");

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) {
        setIsScanning(false);
        return;
      }

      setStatus("Loading image...");

      const uploadedImage = new Image();
      uploadedImage.src = URL.createObjectURL(file);

      uploadedImage.onload = async () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = uploadedImage.width;
          canvas.height = uploadedImage.height;
          const ctx = canvas.getContext("2d");
          
          if (!ctx) {
            throw new Error("Could not get canvas context");
          }

          ctx.drawImage(uploadedImage, 0, 0);
          const uploadedPixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

          setStatus("Analyzing font patterns...");
          const guess = await guessFont(uploadedPixels, uploadedImage.width, uploadedImage.height);
          
          setStatus(`Detected font: ${guess}`);
          onFontDetected?.(guess);
          
          // Clear status after 3 seconds
          setTimeout(() => setStatus(""), 3000);
        } catch (error) {
          setStatus("Error analyzing font");
          alert('Error scanning font: ' + (error as Error).message);
        } finally {
          setIsScanning(false);
          URL.revokeObjectURL(uploadedImage.src);
        }
      };

      uploadedImage.onerror = () => {
        setStatus("Error loading image");
        setIsScanning(false);
        URL.revokeObjectURL(uploadedImage.src);
      };
    };

    input.click();
  };

  const guessFont = async (targetPixels: Uint8ClampedArray, width: number, height: number): Promise<string> => {
    const text = "Sample Text";
    let bestMatch = "";
    let bestDiff = Infinity;

    for (let i = 0; i < FONT_LIST.length; i++) {
      const font = FONT_LIST[i];
      setStatus(`Comparing with ${font}... (${i + 1}/${FONT_LIST.length})`);
      
      // Add small delay to allow UI update
      await new Promise(resolve => setTimeout(resolve, 50));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) continue;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);
      ctx.font = `30px "${font}"`;
      ctx.fillStyle = "black";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(text, 10, 10);

      const samplePixels = ctx.getImageData(0, 0, width, height).data;
      let diff = 0;

      // Compare only a subset of pixels for performance
      const step = 4;
      for (let j = 0; j < targetPixels.length; j += step * 4) {
        diff += Math.abs(targetPixels[j] - samplePixels[j]); // Red channel
      }

      if (diff < bestDiff) {
        bestDiff = diff;
        bestMatch = font;
      }
    }

    return bestMatch || "Arial";
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleFontScan}
        disabled={isScanning}
        variant="outline"
        className="border-accent text-accent hover:bg-accent/10"
      >
        {isScanning ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Scanning...
          </>
        ) : (
          <>
            <Type className="w-4 h-4 mr-2" />
            Scan Font From Image
          </>
        )}
      </Button>
      {status && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
          {status}
        </div>
      )}
    </div>
  );
};

export default FontScanner;