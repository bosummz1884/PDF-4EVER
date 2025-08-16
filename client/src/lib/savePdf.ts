// src/lib/savePdf.ts

// CORRECTED: Imported RotationTypes from pdf-lib and our custom ImageElement type
import { PDFDocument, StandardFonts, rgb, Color, RotationTypes } from "pdf-lib";
import {
  Annotation,
  TextElement,
  WhiteoutBlock,
  ImageElement,
  FreeformElement,
} from "@/types/pdf-types";
import { loadAndEmbedFonts } from "./loadFonts";

// This helper function remains the same
function parseColor(colorStr?: string): { color: Color; opacity: number } {
  if (!colorStr) return { color: rgb(0, 0, 0), opacity: 1 };
  if (colorStr === "transparent") return { color: rgb(0, 0, 0), opacity: 0 };

  const hex = colorStr.replace("#", "");
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return { color: rgb(r, g, b), opacity: 1 };
  }
  return { color: rgb(0, 0, 0), opacity: 1 };
}

export async function savePdfWithAnnotations(
  originalPdfData: Uint8Array,
  textElements: TextElement[],
  annotations: Annotation[],
  whiteoutBlocks: WhiteoutBlock[],
  imageElements: ImageElement[],
  freeformElements: FreeformElement[] = [],
  onProgress?: (progress: number, status: string) => void
): Promise<Uint8Array> {
  onProgress?.(10, "Loading PDF document...");
  const pdfDoc = await PDFDocument.load(originalPdfData);
  
  onProgress?.(20, "Loading fonts...");
  const fontMap = await loadAndEmbedFonts(pdfDoc);
  const pages = pdfDoc.getPages();

  const totalElements = annotations.length + textElements.length + whiteoutBlocks.length + imageElements.length + freeformElements.length;
  let processedElements = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageNum = i + 1;
    const { height: pageHeight } = page.getSize();
    
    onProgress?.(30 + (i / pages.length) * 50, `Processing page ${pageNum}/${pages.length}...`);

    // Sections for Annotations, Text, and Whiteout Blocks remain unchanged...
    // 1. Draw Annotations
    const pageAnnotations = annotations.filter((a) => a.page === pageNum);
    for (const ann of pageAnnotations) {
      const y = pageHeight - ann.y - ann.height;

      const { color: fillColor, opacity: fillOpacity } = parseColor(
        ann.fillColor
      );
      const { color: strokeColor, opacity: borderOpacity } = parseColor(
        ann.strokeColor || ann.color
      );
      const highlightOpacity = ann.opacity || 0.3;

      const baseOptions = {
        borderWidth: ann.strokeWidth,
        borderColor: strokeColor,
        borderOpacity: borderOpacity,
      };

      if (ann.type === "rectangle") {
        page.drawRectangle({
          ...baseOptions,
          x: ann.x,
          y,
          width: ann.width,
          height: ann.height,
          color: fillColor,
          opacity: fillOpacity,
        });
      } else if (ann.type === "highlight") {
        page.drawRectangle({
          x: ann.x,
          y,
          width: ann.width,
          height: ann.height,
          color: parseColor(ann.color).color,
          opacity: highlightOpacity,
        });
      } else if (ann.type === "circle") {
        page.drawEllipse({
          ...baseOptions,
          x: ann.x + ann.width / 2,
          y: y + ann.height / 2,
          xScale: ann.width / 2,
          yScale: ann.height / 2,
          color: fillColor,
          opacity: fillOpacity,
        });
      }
    }

    // 2. Draw Text Elements
    const pageTextElements = textElements.filter((t) => t.page === pageNum);
    for (const text of pageTextElements) {
      const font =
        fontMap[text.fontFamily] ||
        (await pdfDoc.embedFont(StandardFonts.Helvetica));
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
    const pageWhiteoutBlocks = whiteoutBlocks.filter((w) => w.page === pageNum);
    for (const block of pageWhiteoutBlocks) {
      const { color: blockColor } = parseColor(block.color || "#FFFFFF");
      page.drawRectangle({
        x: block.x,
        y: pageHeight - block.y - block.height,
        width: block.width,
        height: block.height,
        color: blockColor,
      });
    }

    // 4. Draw Image Elements
    const pageImageElements = imageElements.filter(
      (img) => img.page === pageNum
    );
    for (const img of pageImageElements) {
      const imageBytes = Uint8Array.from(atob(img.src.split(",")[1]), (c) =>
        c.charCodeAt(0)
      );
      let pdfImage;

      if (
        img.src.startsWith("data:image/jpeg") ||
        img.src.startsWith("data:image/jpg")
      ) {
        pdfImage = await pdfDoc.embedJpg(imageBytes);
      } else if (img.src.startsWith("data:image/png")) {
        pdfImage = await pdfDoc.embedPng(imageBytes);
      } else {
        console.warn(
          `Unsupported image type for ${img.id}. Only JPG and PNG are supported.`
        );
        continue;
      }

      page.drawImage(pdfImage, {
        x: img.x,
        y: pageHeight - img.y - img.height,
        width: img.width,
        height: img.height,
        // CORRECTED: Used the RotationTypes enum from pdf-lib
        rotate: { type: RotationTypes.Degrees, angle: -img.rotation },
        opacity: img.opacity ?? 1,
      });
      processedElements++;
    }

    // 5. Draw Freeform Elements
    const pageFreeformElements = freeformElements.filter((f) => f.page === pageNum);
    for (const freeform of pageFreeformElements) {
      // Draw each path in the freeform element
      for (const path of freeform.paths) {
        if (path.points.length < 2) continue;

        const { color: pathColor } = parseColor(path.color);
        
        // Create a path using moveTo and lineTo operations
        const pathPoints = path.points.map(point => ({
          x: point.x,
          y: pageHeight - point.y // Convert coordinate system
        }));

        // Draw the path as a series of connected lines
        for (let j = 1; j < pathPoints.length; j++) {
          const start = pathPoints[j - 1];
          const end = pathPoints[j];
          
          // Draw line segment with brush size as stroke width
          page.drawLine({
            start: { x: start.x, y: start.y },
            end: { x: end.x, y: end.y },
            thickness: path.brushSize,
            color: pathColor,
            opacity: path.opacity,
            lineCap: 'round' as any, // Round line caps for smoother appearance
          });
        }
      }
      processedElements++;
    }
  }

  onProgress?.(90, "Finalizing PDF...");
  const savedBytes = await pdfDoc.save();
  onProgress?.(100, "PDF saved successfully!");
  
  return savedBytes;
}

export function triggerDownload(bytes: Uint8Array, filename: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
