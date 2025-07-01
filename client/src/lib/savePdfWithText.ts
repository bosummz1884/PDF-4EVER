import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { loadFonts } from "./loadFonts";

// Use your TextObject or TextBoxData type
interface TextObject {
  x: number;
  y: number;
  value: string;
  font?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
  width?: number;
  page?: number;
}

/**
 * Embeds all inline edited text into the original PDF.
 * Supports: multi-page, text wrapping, font/color/size/style per box.
 * Returns the modified PDF as Uint8Array for further handling (download/upload/etc).
 */
export async function savePdfWithText(
  originalPdfData: ArrayBuffer | Uint8Array | File,
  textObjects: TextObject[],
  canvas: HTMLCanvasElement
): Promise<Uint8Array> {
  // Support both File and ArrayBuffer/Uint8Array inputs
  let arrayBuffer: ArrayBuffer;
  if (originalPdfData instanceof File) {
    arrayBuffer = await originalPdfData.arrayBuffer();
  } else if (originalPdfData instanceof Uint8Array) {
    arrayBuffer = originalPdfData;
  } else {
    arrayBuffer = originalPdfData;
  }

  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // Load all fonts using your font loader
  const fontMap = await loadFonts(pdfDoc);

  // Fallback standard fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
  const courierBoldFont = await pdfDoc.embedFont(StandardFonts.CourierBold);

  // Multi-page: group text boxes by page number
  const textObjectsByPage: Record<number, TextObject[]> = {};
  textObjects.forEach((obj) => {
    const pageNum = obj.page ?? 1; // default to page 1 if missing
    if (!textObjectsByPage[pageNum]) textObjectsByPage[pageNum] = [];
    textObjectsByPage[pageNum].push(obj);
  });

  // Font selection logic (same as in robust version)
  function getFontForText(fontName?: string, fontWeight?: string) {
    const isBold = fontWeight === "bold";

    if (!fontName) return fontMap["Arial"] || helveticaFont;

    if (fontMap[fontName]) return fontMap[fontName];

    const lowerFont = fontName.toLowerCase();
    for (const [loadedFontName, embeddedFont] of Object.entries(fontMap)) {
      const lowerLoadedFont = loadedFontName.toLowerCase();
      if (
        lowerLoadedFont.includes(lowerFont) ||
        lowerFont.includes(lowerLoadedFont)
      ) {
        return embeddedFont;
      }
    }

    if (lowerFont.includes("times") || lowerFont.includes("roman")) {
      return (
        fontMap["Times New Roman"] ||
        fontMap["Georgia"] ||
        (isBold ? helveticaBoldFont : timesFont)
      );
    }
    if (lowerFont.includes("arial") || lowerFont.includes("helvetica")) {
      return (
        fontMap["Arial"] ||
        fontMap["Helvetica"] ||
        (isBold ? helveticaBoldFont : helveticaFont)
      );
    }
    if (lowerFont.includes("courier") || lowerFont.includes("mono")) {
      return (
        fontMap["Courier New"] ||
        fontMap["Inconsolata"] ||
        (isBold ? courierBoldFont : courierFont)
      );
    }
    if (lowerFont.includes("sans")) {
      return (
        fontMap["Open Sans"] ||
        fontMap["Source Sans Pro"] ||
        fontMap["Roboto"] ||
        helveticaFont
      );
    }

    return (
      fontMap["Arial"] ||
      fontMap["Roboto"] ||
      fontMap["Open Sans"] ||
      helveticaFont
    );
  }

  // Color parser
  function parseColor(colorStr?: string) {
    if (!colorStr || colorStr === "#000000") return rgb(0, 0, 0);
    const hex = colorStr.replace("#", "");
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return rgb(r, g, b);
    }
    return rgb(0, 0, 0); // Default to black
  }

  // Estimate number of characters per line for given width/fontSize
  function estimateCharLimit(pixelWidth: number, fontSize: number): number {
    const avgCharWidth = fontSize * 0.6;
    return Math.floor(pixelWidth / avgCharWidth);
  }

  // Word wrapping: splits text into lines that fit within the box width
  function wrapText(text: string, limit: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";

    for (const word of words) {
      if ((line + (line ? " " : "") + word).length <= limit) {
        line += (line ? " " : "") + word;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }

    if (line) lines.push(line);
    return lines;
  }

  const pages = pdfDoc.getPages();

  // For each page, render all text objects to their respective page
  for (const [pageNumStr, pageTextObjs] of Object.entries(textObjectsByPage)) {
    const pageNum = parseInt(pageNumStr, 10);
    if (pageNum < 1 || pageNum > pages.length) continue;
    const page = pages[pageNum - 1];
    const { height: pageHeight, width: pageWidth } = page.getSize();

    for (const textObj of pageTextObjs) {
      const {
        x,
        y,
        value,
        font,
        fontSize = 16,
        color,
        fontWeight,
        width = 200,
      } = textObj;

      if (!value || !value.trim()) continue;

      const embeddedFont = getFontForText(font, fontWeight);
      const textColor = parseColor(color);

      // Canvas and PDF origin difference
      const canvasHeight = canvas.height;
      const canvasWidth = canvas.width;
      const pdfY = pageHeight - y * (pageHeight / canvasHeight) - fontSize;
      const pdfX = x * (pageWidth / canvasWidth);

      const wrapLimit = estimateCharLimit(width, fontSize);
      const wrappedLines = wrapText(value, wrapLimit);

      wrappedLines.forEach((line, i) => {
        page.drawText(line, {
          x: pdfX,
          y: pdfY - i * (fontSize + 4),
          size: fontSize,
          font: embeddedFont,
          color: textColor,
        });
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Triggers a PDF file download in the browser.
 */
export function triggerDownload(bytes: Uint8Array, filename: string) {
    const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
