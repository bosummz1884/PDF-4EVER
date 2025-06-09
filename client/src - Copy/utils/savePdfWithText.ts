// 📄 src/utils/savePdfWithText.ts
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { TextBoxData } from '@/components/DraggableTextBox';

/**
 * Embeds all text boxes into the correct pages of the original PDF,
 * including support for font size, color, position, and wrapping based on width.
 */
export async function savePdfWithText(
  originalPdfData: Uint8Array, 
  textBoxes: TextBoxData[], 
  canvas: HTMLCanvasElement
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalPdfData);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const canvasHeight = canvas.height;

  // Group text boxes by page
  const textBoxesByPage: Record<number, TextBoxData[]> = {};
  textBoxes.forEach(textBox => {
    if (!textBoxesByPage[textBox.page]) {
      textBoxesByPage[textBox.page] = [];
    }
    textBoxesByPage[textBox.page].push(textBox);
  });

  for (const [pageNumStr, pageTextBoxes] of Object.entries(textBoxesByPage)) {
    const pageNum = parseInt(pageNumStr, 10);
    const page = pdfDoc.getPage(pageNum - 1); // zero-indexed

    for (const textBox of pageTextBoxes as TextBoxData[]) {
      const value = textBox.text.trim();
      if (!value) continue;

      const fontSize = textBox.fontSize || 16;
      const fontColor = textBox.color || "#000000";
      const { r, g, b } = hexToRgb(fontColor);
      const x = textBox.x || 0;
      const y = textBox.y || 0;
      const width = textBox.width || 200;

      // Convert coordinates from canvas space to PDF space
      const pdfY = canvasHeight - y - fontSize;

      const wrapLimit = estimateCharLimit(width, fontSize);
      const wrappedLines = wrapText(value, wrapLimit);

      wrappedLines.forEach((line, i) => {
        page.drawText(line, {
          x,
          y: pdfY - i * (fontSize + 4),
          size: fontSize,
          font: helveticaFont,
          color: rgb(r / 255, g / 255, b / 255),
        });
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

function triggerDownload(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const bigint = parseInt(hex.replace("#", ""), 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function estimateCharLimit(pixelWidth: number, fontSize: number): number {
  const avgCharWidth = fontSize * 0.6; // approx width per character
  return Math.floor(pixelWidth / avgCharWidth);
}

function wrapText(text: string, limit: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if ((line + word).length <= limit) {
      line += (line ? " " : "") + word;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines;
}