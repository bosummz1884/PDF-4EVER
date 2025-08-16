import { PDFDocumentProxy } from "pdfjs-dist";
import { TextRegion, DetectedFont } from "@/types/pdf-types";
import { fontRecognitionService } from "./fontRecognitionService";

export interface TextExtractionOptions {
  includeInvisibleText?: boolean;
  mergeClosestItems?: boolean;
  normalizeWhitespace?: boolean;
  combineTextItems?: boolean;
}

export class TextExtractionService {
  private static instance: TextExtractionService;

  public static getInstance(): TextExtractionService {
    if (!TextExtractionService.instance) {
      TextExtractionService.instance = new TextExtractionService();
    }
    return TextExtractionService.instance;
  }

  async extractTextRegions(
    pdfDocument: PDFDocumentProxy,
    pageNumber: number,
    options: TextExtractionOptions = {}
  ): Promise<TextRegion[]> {
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();
    
    const viewport = page.getViewport({ scale: 1.0 });
    const textRegions: TextRegion[] = [];

    // Process each text item
    textContent.items.forEach((item: any, index: number) => {
      if (!item.str || item.str.trim() === '') return;

      const transform = item.transform;
      const fontSize = Math.abs(transform[0]);
      const x = transform[4];
      const y = viewport.height - transform[5]; // Convert PDF coordinates

      // Get font style information
      const style = textContent.styles[item.fontName];
      const fontInfo = this.extractFontProperties(item.fontName, style);

      const textRegion: TextRegion = {
        id: `region-${pageNumber}-${index}`,
        page: pageNumber,
        x,
        y: y - fontSize,
        width: item.width,
        height: item.height || fontSize,
        text: item.str,
        fontName: item.fontName,
        fontSize,
        fontWeight: fontInfo.weight,
        fontStyle: fontInfo.style,
        color: "#000000",
        rotation: this.calculateRotation(transform),
        isEditing: false
      };

      textRegions.push(textRegion);
    });

    if (options.mergeClosestItems) {
      return this.mergeAdjacentRegions(textRegions);
    }

    return textRegions;
  }

  private extractFontProperties(fontName: string, style: any): {
    weight: "normal" | "bold";
    style: "normal" | "italic";
  } {
    let weight: "normal" | "bold" = "normal";
    let fontStyle: "normal" | "italic" = "normal";

    const nameLower = fontName.toLowerCase();
    const familyLower = style?.fontFamily?.toLowerCase() || "";

    // Detect bold
    if (nameLower.includes('bold') || familyLower.includes('bold') ||
        nameLower.includes('heavy') || familyLower.includes('heavy')) {
      weight = "bold";
    }

    // Detect italic
    if (nameLower.includes('italic') || familyLower.includes('italic') ||
        nameLower.includes('oblique') || familyLower.includes('oblique')) {
      fontStyle = "italic";
    }

    return { weight, style: fontStyle };
  }

  private calculateRotation(transform: number[]): number {
    return Math.atan2(transform[1], transform[0]) * 180 / Math.PI;
  }

  private mergeAdjacentRegions(regions: TextRegion[]): TextRegion[] {
    const merged: TextRegion[] = [];
    const processed = new Set<string>();

    for (const region of regions) {
      if (processed.has(region.id)) continue;

      const candidates = regions.filter(r => 
        !processed.has(r.id) &&
        r.id !== region.id &&
        this.areRegionsAdjacent(region, r)
      );

      if (candidates.length > 0) {
        const mergedRegion = this.combineRegions([region, ...candidates]);
        merged.push(mergedRegion);
        
        processed.add(region.id);
        candidates.forEach(c => processed.add(c.id));
      } else {
        merged.push(region);
        processed.add(region.id);
      }
    }

    return merged;
  }

  private areRegionsAdjacent(region1: TextRegion, region2: TextRegion): boolean {
    const threshold = Math.max(region1.fontSize * 0.3, 5); // Dynamic threshold based on font size
    
    // Check if regions are on the same line (accounting for rotation)
    const rotationDiff = Math.abs(region1.rotation - region2.rotation);
    if (rotationDiff > 5) return false; // Different rotation angles
    
    const horizontallyAligned = Math.abs(region1.y - region2.y) <= threshold;
    const verticallyAdjacent = 
      Math.abs(region1.x + region1.width - region2.x) <= threshold ||
      Math.abs(region2.x + region2.width - region1.x) <= threshold;

    // Enhanced font matching
    const fontCompatible = region1.fontName === region2.fontName &&
                          Math.abs(region1.fontSize - region2.fontSize) <= 1 &&
                          region1.fontWeight === region2.fontWeight &&
                          region1.fontStyle === region2.fontStyle;

    return horizontallyAligned && verticallyAdjacent && fontCompatible;
  }

  private combineRegions(regions: TextRegion[]): TextRegion {
    const sorted = regions.sort((a, b) => a.x - b.x);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    return {
      ...first,
      id: `merged-${first.page}-${Date.now()}`,
      text: sorted.map(r => r.text).join(' '),
      width: (last.x + last.width) - first.x,
      height: Math.max(...sorted.map(r => r.height))
    };
  }

  convertPDFToScreenCoordinates(
    region: TextRegion,
    scale: number,
    rotation: number,
    canvasRect: DOMRect
  ): { x: number; y: number; width: number; height: number } {
    // Apply scale transformation
    const scaledX = region.x * scale;
    const scaledY = region.y * scale;
    const scaledWidth = region.width * scale;
    const scaledHeight = region.height * scale;

    // Apply rotation if needed (simplified for common cases)
    let finalX = scaledX;
    let finalY = scaledY;
    let finalWidth = scaledWidth;
    let finalHeight = scaledHeight;

    if (rotation === 90) {
      finalX = scaledY;
      finalY = canvasRect.height - scaledX - scaledWidth;
      finalWidth = scaledHeight;
      finalHeight = scaledWidth;
    } else if (rotation === 180) {
      finalX = canvasRect.width - scaledX - scaledWidth;
      finalY = canvasRect.height - scaledY - scaledHeight;
    } else if (rotation === 270) {
      finalX = canvasRect.width - scaledY - scaledHeight;
      finalY = scaledX;
      finalWidth = scaledHeight;
      finalHeight = scaledWidth;
    }

    return {
      x: finalX + canvasRect.left,
      y: finalY + canvasRect.top,
      width: finalWidth,
      height: finalHeight
    };
  }

  async searchText(
    pdfDocument: PDFDocumentProxy,
    searchTerm: string,
    pageNumber?: number
  ): Promise<TextRegion[]> {
    const pages = pageNumber ? [pageNumber] : Array.from({ length: pdfDocument.numPages }, (_, i) => i + 1);
    const results: TextRegion[] = [];

    for (const page of pages) {
      const regions = await this.extractTextRegions(pdfDocument, page);
      const matches = regions.filter(region => 
        region.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
      results.push(...matches);
    }

    return results;
  }

  getTextRegionAt(regions: TextRegion[], x: number, y: number): TextRegion | null {
    return regions.find(region => 
      x >= region.x && x <= region.x + region.width &&
      y >= region.y && y <= region.y + region.height
    ) || null;
  }

  /**
   * Enhanced text boundary detection with better accuracy
   */
  detectTextBoundaries(regions: TextRegion[]): TextRegion[] {
    return regions.map(region => {
      // Calculate more accurate boundaries based on font metrics
      const adjustedHeight = Math.max(region.height, region.fontSize * 1.2);
      const adjustedY = region.y - (adjustedHeight - region.height) / 2;
      
      return {
        ...region,
        y: adjustedY,
        height: adjustedHeight,
        // Add padding for better click targets
        x: region.x - 2,
        width: region.width + 4
      };
    });
  }

  /**
   * Handle rotated and skewed text with improved coordinate transformation
   */
  normalizeRotatedText(regions: TextRegion[]): TextRegion[] {
    return regions.map(region => {
      if (Math.abs(region.rotation) < 1) return region; // No significant rotation
      
      // Calculate bounding box for rotated text
      const radians = (region.rotation * Math.PI) / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      
      // Transform corners of the text region
      const corners = [
        { x: 0, y: 0 },
        { x: region.width, y: 0 },
        { x: region.width, y: region.height },
        { x: 0, y: region.height }
      ];
      
      const transformedCorners = corners.map(corner => ({
        x: region.x + corner.x * cos - corner.y * sin,
        y: region.y + corner.x * sin + corner.y * cos
      }));
      
      // Calculate new bounding box
      const minX = Math.min(...transformedCorners.map(c => c.x));
      const maxX = Math.max(...transformedCorners.map(c => c.x));
      const minY = Math.min(...transformedCorners.map(c => c.y));
      const maxY = Math.max(...transformedCorners.map(c => c.y));
      
      return {
        ...region,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    });
  }

  /**
   * Advanced text region merging with line detection
   */
  mergeTextLines(regions: TextRegion[]): TextRegion[] {
    const lines: TextRegion[][] = [];
    const processed = new Set<string>();
    
    // Group regions into lines
    for (const region of regions) {
      if (processed.has(region.id)) continue;
      
      const line = [region];
      processed.add(region.id);
      
      // Find other regions on the same line
      for (const other of regions) {
        if (processed.has(other.id)) continue;
        
        if (this.areOnSameLine(region, other)) {
          line.push(other);
          processed.add(other.id);
        }
      }
      
      lines.push(line);
    }
    
    // Merge regions within each line
    return lines.map(line => {
      if (line.length === 1) return line[0];
      
      // Sort by x position
      line.sort((a, b) => a.x - b.x);
      
      const first = line[0];
      const last = line[line.length - 1];
      
      return {
        ...first,
        id: `line-${first.page}-${Date.now()}`,
        text: line.map(r => r.text).join(' '),
        width: (last.x + last.width) - first.x,
        height: Math.max(...line.map(r => r.height))
      };
    });
  }

  private areOnSameLine(region1: TextRegion, region2: TextRegion): boolean {
    const threshold = Math.min(region1.fontSize, region2.fontSize) * 0.5;
    
    // Check vertical alignment (same line)
    const verticalOverlap = Math.min(region1.y + region1.height, region2.y + region2.height) - 
                           Math.max(region1.y, region2.y);
    
    return verticalOverlap > threshold &&
           Math.abs(region1.rotation - region2.rotation) <= 5 && // Similar rotation
           region1.fontName === region2.fontName; // Same font
  }

  /**
   * Extract text with improved accuracy for complex layouts
   */
  async extractTextWithLayout(
    pdfDocument: PDFDocumentProxy,
    pageNumber: number
  ): Promise<TextRegion[]> {
    let regions = await this.extractTextRegions(pdfDocument, pageNumber, {
      mergeClosestItems: false,
      normalizeWhitespace: true
    });
    
    // Apply enhancements
    regions = this.normalizeRotatedText(regions);
    regions = this.detectTextBoundaries(regions);
    regions = this.mergeTextLines(regions);
    
    return regions;
  }
}

export const textExtractionService = TextExtractionService.getInstance();
