// src/services/OCRService.ts - Using Augmented Types

import { createWorker, PSM, Worker, Word, Page } from "tesseract.js"; // We can now safely import 'Page'
import {
  getDocument,
  PDFDocumentProxy,
} from "pdfjs-dist/types/src/display/api";
import { OCRResult, OCRLanguage } from "@/types/pdf-types";
import "@/lib/pdfWorker";

export const OCR_LANGUAGES: OCRLanguage[] = [
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

export class OCRService {
  private static instance: OCRService;

  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  public async performOCR(
    imageData: Tesseract.ImageLike,
    language: string = "eng",
    pageNumber: number = 1,
    totalPages: number = 1,
    progressCallback?: (progress: number) => void
  ): Promise<{ ocrText: string; ocrResults: OCRResult[] }> {
    const worker: Worker = await createWorker(language, 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && progressCallback) {
          const pageProgress = m.progress / totalPages;
          const totalProgress = (pageNumber - 1) / totalPages + pageProgress;
          progressCallback(Math.round(totalProgress * 100));
        }
      },
    });

    try {
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
      });

      // This is now fully type-safe because of our augmentation file.
      const { data }: { data: Page } = await worker.recognize(imageData);

      const ocrResults: OCRResult[] = (data.words || [])
        .filter((word: Word) => word.text.trim() && word.confidence > 30)
        .map((word: Word, index: number) => ({
          id: `ocr-${pageNumber}-${index}`,
          text: word.text,
          confidence: word.confidence,
          boundingBox: {
            x0: word.bbox.x0,
            y0: word.bbox.y0,
            x1: word.bbox.x1,
            y1: word.bbox.y1,
          },
          page: pageNumber,
        }));

      return { ocrText: data.text || "", ocrResults };
    } catch (error) {
      console.error("OCR recognition failed:", error);
      throw new Error("OCR recognition failed.");
    } finally {
      await worker.terminate();
    }
  }

  // ... the rest of the file remains exactly the same
  
  public async performPDFOCR(
    file: File,
    language: string = "eng",
    progressCallback?: (progress: number) => void
  ): Promise<{
    ocrText: string;
    ocrResults: OCRResult[];
    previewUrl?: string;
  }> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let allResults: OCRResult[] = [];
    const allText: string[] = [];
    let previewUrl: string | undefined;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
      const imageData = canvas.toDataURL("image/png");

      if (i === 1) previewUrl = imageData;

      const { ocrText, ocrResults } = await this.performOCR(
        imageData,
        language,
        i,
        pdf.numPages,
        progressCallback
      );

      allText.push(ocrText);
      allResults = allResults.concat(ocrResults);
    }

    return {
      ocrText: allText.join("\n\n"),
      ocrResults: allResults,
      previewUrl,
    };
  }

  public async extractPDFText(
    pdfDocument: PDFDocumentProxy,
    currentPage: number
  ): Promise<{ extractedText: string; results: OCRResult[] }> {
    try {
      const page = await pdfDocument.getPage(currentPage);
      const textContent = await page.getTextContent();
      let extractedText = "";
      const results: OCRResult[] = [];

      textContent.items.forEach((item, index) => {
        if ("str" in item && item.str.trim()) {
          extractedText += item.str + " ";
          results.push({
            id: `pdf-text-${index}`,
            text: item.str,
            confidence: 100,
            boundingBox: {
              x0: item.transform[4],
              y0: item.transform[5],
              x1: item.transform[4] + (item.width || 0),
              y1: item.transform[5] + (item.height || 0),
            },
            page: currentPage,
          });
        }
      });

      return { extractedText: extractedText.trim(), results };
    } catch (error) {
      console.error("PDF text extraction error:", error);
      throw new Error("PDF text extraction failed.");
    }
  }

  public highlightTextOnCanvas(
    result: OCRResult,
    canvasRef: React.RefObject<HTMLCanvasElement>
  ): void {
    if (!canvasRef?.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(
      result.boundingBox.x0,
      result.boundingBox.y0,
      result.boundingBox.x1 - result.boundingBox.x0,
      result.boundingBox.y1 - result.boundingBox.y0
    );
    ctx.restore();
  }
}

export const ocrService = OCRService.getInstance();