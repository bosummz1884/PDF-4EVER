// src/services/OCRService.ts - Build Fixed

import { createWorker, PSM, Worker } from "tesseract.js";
import type { Word, Line, Bbox } from "tesseract.js";
import { getDocument, PDFDocumentProxy } from "pdfjs-dist";
import { OCRResult, OCRLanguage, TableCell, TableRow, Table } from "@/types/pdf-types";
import "@/lib/pdfWorker";

export const OCR_LANGUAGES: OCRLanguage[] = [
  // Western European Languages
  { code: "eng", name: "English" },
  { code: "spa", name: "Spanish" },
  { code: "fra", name: "French" },
  { code: "deu", name: "German" },
  { code: "por", name: "Portuguese" },
  { code: "ita", name: "Italian" },
  { code: "nld", name: "Dutch" },
  { code: "swe", name: "Swedish" },
  { code: "nor", name: "Norwegian" },
  { code: "dan", name: "Danish" },
  { code: "fin", name: "Finnish" },
  { code: "pol", name: "Polish" },
  { code: "ron", name: "Romanian" },
  
  // Asian Languages
  { code: "chi_sim", name: "Chinese (Simplified)" },
  { code: "chi_tra", name: "Chinese (Traditional)" },
  { code: "jpn", name: "Japanese" },
  { code: "kor", name: "Korean" },
  { code: "tha", name: "Thai" },
  { code: "vie", name: "Vietnamese" },
  
  // Cyrillic Script
  { code: "rus", name: "Russian" },
  { code: "ukr", name: "Ukrainian" },
  { code: "bul", name: "Bulgarian" },
  { code: "srp", name: "Serbian" },
  
  // Middle Eastern Languages
  { code: "ara", name: "Arabic" },
  { code: "fas", name: "Persian" },
  { code: "heb", name: "Hebrew" },
  { code: "tur", name: "Turkish" },
  
  // Indian Subcontinent
  { code: "hin", name: "Hindi" },
  { code: "ben", name: "Bengali" },
  { code: "tam", name: "Tamil" },
  { code: "tel", name: "Telugu" },
  { code: "kan", name: "Kannada" },
  { code: "mal", name: "Malayalam" },
  { code: "guj", name: "Gujarati" },
  { code: "pan", name: "Punjabi" },
  
  // Other European
  { code: "ell", name: "Greek" },
  { code: "hun", name: "Hungarian" },
  { code: "ces", name: "Czech" },
  { code: "slv", name: "Slovenian" },
  { code: "hrv", name: "Croatian" },
  { code: "slk", name: "Slovak" },
  
  // African Languages
  { code: "afr", name: "Afrikaans" },
  { code: "swa", name: "Swahili" },
  
  // Additional Asian
  { code: "ind", name: "Indonesian" },
  { code: "msa", name: "Malay" },
  { code: "fil", name: "Filipino" },
  { code: "mya", name: "Burmese" },
  
  // Additional European
  { code: "cat", name: "Catalan" },
  { code: "eus", name: "Basque" },
  { code: "glg", name: "Galician" },
  
  // Historical/Literary
  { code: "lat", name: "Latin" },
  { code: "swe_old", name: "Swedish (Old)" },
  { code: "frm", name: "French (Middle)" },
  { code: "enm", name: "English (Middle)" },
];

interface TableDetectionOptions {
  minCols?: number;
  minRows?: number;
  minConfidence?: number;
  cellPadding?: number;
  mergeThreshold?: number;
}

export class OCRService {
  private static instance: OCRService;
  
  // Default table detection options
  private defaultTableOptions: TableDetectionOptions = {
    minCols: 2,
    minRows: 2,
    minConfidence: 30,
    cellPadding: 5,
    mergeThreshold: 10, // pixels
  };

  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Performs OCR on the provided image data with optional area selection
   */
  public async performOCR(
    imageData: Tesseract.ImageLike,
    language: string = "eng",
    pageNumber: number = 1,
    totalPages: number = 1,
    progressCallback?: (progress: number) => void,
    options: {
      detectTables?: boolean;
      area?: {
        x0: number;
        y0: number;
        x1: number;
        y1: number;
      } | null;
    } = {}
  ): Promise<{ 
    ocrText: string; 
    ocrResults: OCRResult[];
    tables?: Table[];
  } | null> {
    const { detectTables = true, area = null } = options;
    
    if (!imageData) {
      throw new Error('No image data provided for OCR');
    }

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
      // Set page segmentation mode based on whether we're processing an area or full page
      const pageSegMode = area ? PSM.SINGLE_BLOCK : PSM.AUTO;
      
      await worker.setParameters({
        tessedit_pageseg_mode: pageSegMode,
        preserve_interword_spaces: '1',
      });

      // Process the image - crop if area is specified
      let processedImage = imageData;
      let adjustX = 0;
      let adjustY = 0;
      
      if (area) {
        // Validate area coordinates
        if (area.x1 <= area.x0 || area.y1 <= area.y0) {
          throw new Error('Invalid area coordinates');
        }
        
        // Create a canvas to crop the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not create canvas context');

        // Handle different input types
        if (imageData instanceof HTMLImageElement || 
            imageData instanceof HTMLCanvasElement) {
          // Calculate dimensions
          const width = Math.round(area.x1 - area.x0);
          const height = Math.round(area.y1 - area.y0);
          
          // Set canvas size to match the selected area
          canvas.width = width;
          canvas.height = height;
          
          // Draw only the selected area
          ctx.drawImage(
            imageData,
            area.x0, area.y0, // source x, y
            width, height,    // source width, height
            0, 0,            // destination x, y
            width, height    // destination width, height
          );
          
          processedImage = canvas;
          adjustX = area.x0;
          adjustY = area.y0;
        } else if (imageData instanceof ImageData) {
          // For ImageData, we need to manually crop the pixel data
          const sourceData = imageData.data;
          const sourceWidth = imageData.width;
          const sourceHeight = imageData.height;
          
          // Ensure area is within bounds
          const x0 = Math.max(0, Math.floor(area.x0));
          const y0 = Math.max(0, Math.floor(area.y0));
          const x1 = Math.min(sourceWidth, Math.ceil(area.x1));
          const y1 = Math.min(sourceHeight, Math.ceil(area.y1));
          
          const width = x1 - x0;
          const height = y1 - y0;
          
          // Create new ImageData for the cropped area
          const croppedData = new ImageData(width, height);
          
          // Copy pixel data
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const sourceIndex = ((y0 + y) * sourceWidth + (x0 + x)) * 4;
              const destIndex = (y * width + x) * 4;
              
              croppedData.data[destIndex] = sourceData[sourceIndex];
              croppedData.data[destIndex + 1] = sourceData[sourceIndex + 1];
              croppedData.data[destIndex + 2] = sourceData[sourceIndex + 2];
              croppedData.data[destIndex + 3] = sourceData[sourceIndex + 3];
            }
          }
          
          processedImage = croppedData;
          adjustX = x0;
          adjustY = y0;
        }
      }

      // Perform OCR on the processed image
      const { data } = await worker.recognize(processedImage);
      const pageData = data as any; // Type assertion to handle Tesseract.js types

      // Process regular text results with coordinate adjustment for area selection
      const ocrResults: OCRResult[] = [];
      
      if (pageData.words && Array.isArray(pageData.words)) {
        (pageData.words as Word[]).forEach((word: Word, index: number) => {
          if (!word.text?.trim() || (word.confidence || 0) <= 30) return;
          
          const bbox = word.bbox as Bbox;
          
          // Skip words with invalid bounding boxes
          if (bbox.x1 <= bbox.x0 || bbox.y1 <= bbox.y0) {
            console.warn('Skipping word with invalid bounding box:', word);
            return;
          }
          
          // Adjust coordinates if we processed a selected area
          const adjustedBbox = {
            x0: bbox.x0 + adjustX,
            y0: bbox.y0 + adjustY,
            x1: bbox.x1 + adjustX,
            y1: bbox.y1 + adjustY
          };
          
          // Ensure coordinates are valid after adjustment
          if (adjustedBbox.x1 <= adjustedBbox.x0 || adjustedBbox.y1 <= adjustedBbox.y0) {
            console.warn('Skipping word with invalid adjusted bounding box:', word);
            return;
          }
          
          ocrResults.push({
            id: `ocr-${pageNumber}-${index}-${Date.now()}`,
            text: word.text,
            confidence: word.confidence || 0,
            boundingBox: adjustedBbox,
            page: pageNumber,
            isTable: false,
            language,
            isSelected: false,
            lastModified: Date.now(),
            version: 1
          });
        });
      }

      // Detect tables if requested
      let tables: Table[] = [];
      if (detectTables && pageData.lines && Array.isArray(pageData.lines) && pageData.lines.length > 0) {
        try {
          tables = this.detectTables(pageData.lines as Line[], pageNumber);
        } catch (error) {
          console.warn('Error detecting tables:', error);
        }
      }

      const result = { 
        ocrText: data.text || "", 
        ocrResults,
        tables: tables.length > 0 ? tables : undefined
      };

      return result;
    } catch (error) {
      console.error('Error during OCR processing:', error);
      throw error;
    } finally {
      try {
        await worker.terminate();
      } catch (error) {
        console.warn('Error terminating worker:', error);
      }
    }
  }

  /**
   * Detects tables in OCR results by analyzing line structure
   */
  private detectTables(
    lines: Line[],
    pageNumber: number,
    options: TableDetectionOptions = {}
  ): Table[] {
    const opts = { ...this.defaultTableOptions, ...options };
    const allTables: Table[] = [];
    
    // Group lines by their vertical positions to identify rows
    const lineGroups: Line[][] = [];
    let currentGroup: Line[] = [];
    
    // Sort lines by their vertical position
    const sortedLines = [...lines].sort((a, b) => a.bbox.y0 - b.bbox.y0);
    
    // Group lines that are close to each other vertically
    sortedLines.forEach((line, index) => {
      if (currentGroup.length === 0) {
        currentGroup.push(line);
      } else {
        const lastLine = currentGroup[currentGroup.length - 1];
        const yDiff = line.bbox.y0 - lastLine.bbox.y0;
        
        // If lines are close vertically, they're in the same row
        if (yDiff < (opts.mergeThreshold || 10)) {
          currentGroup.push(line);
        } else {
          lineGroups.push([...currentGroup]);
          currentGroup = [line];
        }
      }
    });
    
    if (currentGroup.length > 0) {
      lineGroups.push(currentGroup);
    }
    
    // Now analyze each group for tabular structure
    for (const group of lineGroups) {
      if (group.length < (opts.minRows || 2)) continue;
      
      // Detect columns in this group
      const columnPositions = this.detectColumns(group, opts);
      if (columnPositions.length < (opts.minCols || 2)) continue;
      
      // Create table from this group
      const table = this.createTableFromLines(group, columnPositions, pageNumber, opts);
      if (table) {
        allTables.push(table);
      }
    }
    
    return allTables;
  }
  
  /**
   * Detects the number of columns in a group of lines
   */
  private detectColumns(lines: Line[], options: TableDetectionOptions = {}): number[] {
    // Simple approach: find distinct vertical positions where text appears
    const xPositions = lines.map(line => line.bbox.x0);
    const sortedPositions = [...new Set(xPositions)].sort((a, b) => a - b);
    
    // If we have very few positions, just return them
    if (sortedPositions.length <= 2) {
      return [
        Math.min(...xPositions) - (options.cellPadding || 5),
        Math.max(...xPositions) + (options.cellPadding || 5)
      ];
    }
    
    // Group positions that are close to each other
    const groups: number[][] = [];
    let currentGroup: number[] = [];
    const threshold = options.mergeThreshold || 20; // pixels
    
    sortedPositions.forEach((pos, index) => {
      if (currentGroup.length === 0) {
        currentGroup.push(pos);
      } else {
        const lastPos = currentGroup[currentGroup.length - 1];
        if (pos - lastPos < threshold) {
          currentGroup.push(pos);
        } else {
          groups.push([...currentGroup]);
          currentGroup = [pos];
        }
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    // Calculate column boundaries (average of gaps between groups)
    if (groups.length < 2) {
      return [
        Math.min(...xPositions) - (options.cellPadding || 5),
        Math.max(...xPositions) + (options.cellPadding || 5)
      ];
    }
    
    const boundaries: number[] = [];
    
    // Add left boundary
    const leftBoundary = Math.min(...xPositions) - (options.cellPadding || 5);
    boundaries.push(leftBoundary);
    
    // Add boundaries between columns
    for (let i = 1; i < groups.length; i++) {
      const leftGroup = groups[i - 1];
      const rightGroup = groups[i];
      const boundary = (Math.max(...leftGroup) + Math.min(...rightGroup)) / 2;
      boundaries.push(boundary);
    }
    
    // Add right boundary
    const rightBoundary = Math.max(...xPositions) + (options.cellPadding || 5);
    boundaries.push(rightBoundary);
    
    return boundaries;
  }
  
  /**
   * Creates table rows from a group of lines
   */
  private createTableRows(lines: Line[], columnPositions: number[]): TableRow[] {
    const rows: TableRow[] = [];
    
    // Group lines by their vertical position to form rows
    const lineGroups: Line[][] = [];
    let currentGroup: Line[] = [];
    const rowThreshold = 5; // pixels
    
    lines.forEach((line, index) => {
      if (currentGroup.length === 0) {
        currentGroup.push(line);
      } else {
        const lastLine = currentGroup[currentGroup.length - 1];
        if (Math.abs(line.bbox.y0 - lastLine.bbox.y0) < rowThreshold) {
          currentGroup.push(line);
        } else {
          lineGroups.push([...currentGroup]);
          currentGroup = [line];
        }
      }
    });
    
    if (currentGroup.length > 0) {
      lineGroups.push(currentGroup);
    }
    
    // Create rows from line groups
    lineGroups.forEach((group, rowIndex) => {
      const cells: TableCell[] = [];
      const rowBBox = {
        x0: Math.min(...group.map(l => l.bbox.x0)),
        y0: Math.min(...group.map(l => l.bbox.y0)),
        x1: Math.max(...group.map(l => l.bbox.x1)),
        y1: Math.max(...group.map(l => l.bbox.y1)),
      };
      
      // Sort lines in the row by x-position
      group.sort((a, b) => a.bbox.x0 - b.bbox.x0);
      
      // Create cells based on column positions
      for (let i = 0; i < columnPositions.length - 1; i++) {
        const cellLeft = columnPositions[i];
        const cellRight = columnPositions[i + 1];
        
        // Find lines that fall within this column
        const cellLines = group.filter(
          line => line.bbox.x0 >= cellLeft && line.bbox.x1 <= cellRight
        );
        
        const cellText = cellLines.map(line => line.text).join(' ').trim();
        
        cells.push({
          id: `cell-${rowIndex}-${i}`,
          text: cellText,
          rowIndex,
          colIndex: i,
          rowSpan: 1,
          colSpan: 1,
          boundingBox: {
            x0: cellLeft,
            y0: rowBBox.y0,
            x1: cellRight,
            y1: rowBBox.y1,
          },
          confidence: 0 // Will be calculated if needed
        });
      }
      
      rows.push({
        id: `row-${rowIndex}`,
        cells,
        boundingBox: rowBBox
      });
    });
    
    return rows;
  }
  
  /**
   * Calculates column positions based on line x-positions
   */
  private calculateColumnPositions(lines: Line[], columnCount: number): number[] {
    // Simple approach: find the most common x-positions
    const xPositions = lines.map(line => line.bbox.x0);
    const sortedPositions = [...new Set(xPositions)].sort((a, b) => a - b);
    
    // If we have fewer positions than columns, distribute evenly
    if (sortedPositions.length <= columnCount) {
      const minX = Math.min(...xPositions);
      const maxX = Math.max(...xPositions);
      const columnWidth = (maxX - minX) / columnCount;
      
      return Array.from({ length: columnCount + 1 }, (_, i) => 
        minX + (i * columnWidth)
      );
    }
    
    // Otherwise, use k-means clustering to find column boundaries
    const k = Math.min(columnCount + 1, sortedPositions.length);
    const centroids = Array.from({ length: k }, (_, i) => 
      sortedPositions[Math.floor((i * sortedPositions.length) / k)]
    );
    
    let clusters: number[][] = [];
    let iterations = 0;
    const maxIterations = 10;
    
    while (iterations < maxIterations) {
      // Assign each position to the nearest centroid
      const newClusters: number[][] = Array(k).fill(0).map(() => []);
      
      sortedPositions.forEach(pos => {
        let minDist = Infinity;
        let closestCentroid = 0;
        
        centroids.forEach((centroid, i) => {
          const dist = Math.abs(pos - centroid);
          if (dist < minDist) {
            minDist = dist;
            closestCentroid = i;
          }
        });
        
        newClusters[closestCentroid].push(pos);
      });
      
      // Check for convergence
      let converged = true;
      
      // Update centroids
      newClusters.forEach((cluster, i) => {
        if (cluster.length === 0) return;
        
        const newCentroid = cluster.reduce((sum, pos) => sum + pos, 0) / cluster.length;
        
        if (Math.abs(newCentroid - centroids[i]) > 0.1) {
          converged = false;
          centroids[i] = newCentroid;
        }
      });
      
      if (converged) break;
      clusters = newClusters;
      iterations++;
    }
    
    // Sort the final centroids and add min/max boundaries
    const sortedCentroids = [...centroids].sort((a, b) => a - b);
    const minX = Math.min(...xPositions);
    const maxX = Math.max(...xPositions.map((x, i) => x + lines[i].bbox.width));
    
    return [minX, ...sortedCentroids, maxX];
  }

  public async performPDFOCR(
    file: File,
    language: string = "eng",
    progressCallback?: (progress: number) => void,
    detectTables: boolean = true
  ): Promise<{
    ocrText: string;
    ocrResults: OCRResult[];
    previewUrl?: string;
    tables?: Table[];
  }> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let allResults: OCRResult[] = [];
    const allText: string[] = [];
    let previewUrl: string | undefined;
    const allTables: Table[] = [];

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

      const { ocrText, ocrResults, tables: pageTables } = await this.performOCR(
        imageData,
        language,
        i,
        pdf.numPages,
        progressCallback,
        detectTables
      );

      allText.push(ocrText);
      allResults = allResults.concat(ocrResults);
      
      if (pageTables && pageTables.length > 0) {
        allTables.push(...pageTables);
      }
    }

    return {
      ocrText: allText.join("\n\n"),
      ocrResults: allResults,
      previewUrl,
      tables: allTables.length > 0 ? allTables : undefined,
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

  /**
   * Updates the text of a specific OCR result
   * @param results The current array of OCR results
   * @param resultId The ID of the result to update
   * @param newText The new text value
   * @returns A new array with the updated result
   */
  public updateOCRText(
    results: OCRResult[],
    resultId: string,
    newText: string
  ): OCRResult[] {
    return results.map(result => {
      if (result.id === resultId) {
        return {
          ...result,
          text: newText,
          // Update confidence since this is a manual edit
          confidence: 100 
        };
      }
      return result;
    });
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
