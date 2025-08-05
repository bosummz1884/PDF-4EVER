import { PDFDocument, StandardFonts, rgb, Color } from 'pdf-lib';
import { Annotation, TextElement, WhiteoutBlock } from '@/types/pdf-types';
import { loadAndEmbedFonts } from './loadFonts';

// Correctly typed helper to parse hex colors into a format pdf-lib understands.
// It now returns a `Color` object from `pdf-lib` and handles opacity separately.
function parseColor(colorStr?: string): { color: Color; opacity: number } {
  if (!colorStr) return { color: rgb(0, 0, 0), opacity: 1 }; // Default to black
  if (colorStr === 'transparent') return { color: rgb(0, 0, 0), opacity: 0 };

  const hex = colorStr.replace('#', '');
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return { color: rgb(r, g, b), opacity: 1 };
  }
  return { color: rgb(0, 0, 0), opacity: 1 };
}


/**
 * The main saving function. It takes the original PDF data and all user-created elements,
 * draws them onto the PDF pages, and returns the new file as a Uint8Array.
 */
export async function savePdfWithAnnotations(
  originalPdfData: Uint8Array,
  textElements: TextElement[],
  annotations: Annotation[],
  whiteoutBlocks: WhiteoutBlock[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalPdfData);
  const fontMap = await loadAndEmbedFonts(pdfDoc);
  const pages = pdfDoc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageNum = i + 1;
    const { height: pageHeight } = page.getSize();

    // 1. Draw Annotations (Shapes and Highlights)
    const pageAnnotations = annotations.filter(a => a.page === pageNum);
    for (const ann of pageAnnotations) {
      const y = pageHeight - ann.y - ann.height; // Y-axis is inverted in pdf-lib
      
      const { color: fillColor, opacity: fillOpacity } = parseColor(ann.fillColor);
      const { color: strokeColor, opacity: borderOpacity } = parseColor(ann.strokeColor || ann.color);
      const highlightOpacity = ann.opacity || 0.3;

      const baseOptions = {
        borderWidth: ann.strokeWidth,
        borderColor: strokeColor,
        borderOpacity: borderOpacity,
      };

      if (ann.type === 'rectangle') {
        page.drawRectangle({
          ...baseOptions,
          x: ann.x, y, width: ann.width, height: ann.height,
          color: fillColor,
          opacity: fillOpacity,
        });
      } else if (ann.type === 'highlight') {
        page.drawRectangle({
            x: ann.x, y, width: ann.width, height: ann.height,
            color: parseColor(ann.color).color,
            opacity: highlightOpacity,
        });
      } else if (ann.type === 'circle') {
        page.drawEllipse({
          ...baseOptions,
          x: ann.x + ann.width / 2, y: y + ann.height / 2,
          xScale: ann.width / 2, yScale: ann.height / 2,
          color: fillColor,
          opacity: fillOpacity,
        });
      }
    }

    // 2. Draw Text Elements
    const pageTextElements = textElements.filter(t => t.page === pageNum);
    for (const text of pageTextElements) {
        const font = fontMap[text.fontFamily] || await pdfDoc.embedFont(StandardFonts.Helvetica);
        page.drawText(text.text, {
            x: text.x,
            y: pageHeight - text.y - text.fontSize,
            font,
            size: text.fontSize,
            color: parseColor(text.color).color,
            lineHeight: text.lineHeight * text.fontSize,
        });
    }

    // 3. Draw Whiteout Blocks
    const pageWhiteoutBlocks = whiteoutBlocks.filter(w => w.page === pageNum);
    for (const block of pageWhiteoutBlocks) {
        page.drawRectangle({
            x: block.x, y: pageHeight - block.y - block.height,
            width: block.width, height: block.height,
            color: rgb(1, 1, 1),
        });
    }
  }

  return await pdfDoc.save();
}

/**
 * Triggers a file download in the browser.
 */
export function triggerDownload(bytes: Uint8Array, filename: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}