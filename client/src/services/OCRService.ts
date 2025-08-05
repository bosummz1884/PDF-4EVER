import { createWorker, PSM, Worker } from 'tesseract.js';
import { getDocument } from 'pdfjs-dist';
import { OCRResult } from '@/types/pdf-types';
import '@/lib/pdfWorker'; // Ensures worker is configured

class OCRService {
  public async performOCR(
    imageData: Tesseract.ImageLike,
    language: string,
    pageNumber: number,
    totalPages: number,
    progressCallback?: (progress: number) => void,
  ): Promise<{ ocrText: string; ocrResults: OCRResult[] }> {
    const worker: Worker = await createWorker(language, 1, {
        logger: (m) => {
             if (m.status === 'recognizing text' && progressCallback) {
                const pageProgress = m.progress / totalPages;
                const totalProgress = ((pageNumber - 1) / totalPages) + pageProgress;
                progressCallback(Math.round(totalProgress * 100));
            }
        },
    });

    try {
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
      });

      const { data } = await worker.recognize(imageData) as { data: { words?: Array<{ text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }>, text?: string } };

      const ocrResults: OCRResult[] = (data.words || [])
        .filter(word => word.text.trim() && word.confidence > 30)
        .map((word, index) => ({
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

      return { ocrText: data.text || '', ocrResults };
    } catch (error) {
        console.error("OCR recognition failed:", error);
        throw new Error("OCR recognition failed.");
    } finally {
        await worker.terminate();
    }
  }

  public async performPDFOCR(
    file: File,
    language: string,
    progressCallback?: (progress: number) => void,
  ): Promise<{ ocrText: string; ocrResults: OCRResult[]; previewUrl?: string }> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let allResults: OCRResult[] = [];
    const allText: string[] = [];
    let previewUrl: string | undefined;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
      const imageData = canvas.toDataURL('image/png');

      if (i === 1) previewUrl = imageData;

      const { ocrText, ocrResults } = await this.performOCR(
        imageData, language, i, pdf.numPages, progressCallback
      );

      allText.push(ocrText);
      allResults = allResults.concat(ocrResults);
    }

    return { ocrText: allText.join('\n\n'), ocrResults: allResults, previewUrl };
  }
}

export const ocrService = new OCRService();