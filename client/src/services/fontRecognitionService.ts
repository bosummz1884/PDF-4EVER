import { getDocument, PDFDocumentProxy } from "pdfjs-dist";
import { DetectedFont, FontRecognitionResult, TextRegion } from "@/types/pdf-types";

export class FontRecognitionService {
  private static instance: FontRecognitionService;
  private fontCache = new Map<string, DetectedFont>();
  private systemFonts = new Set([
    "Arial", "Helvetica", "Times", "Times New Roman", "Courier", "Courier New",
    "Georgia", "Verdana", "Tahoma", "Impact", "Comic Sans MS", "Trebuchet MS",
    "Palatino", "Garamond", "Bookman", "Avant Garde"
  ]);

  public static getInstance(): FontRecognitionService {
    if (!FontRecognitionService.instance) {
      FontRecognitionService.instance = new FontRecognitionService();
    }
    return FontRecognitionService.instance;
  }

  async analyzePDFFonts(pdfDocument: PDFDocumentProxy): Promise<FontRecognitionResult[]> {
    const results: FontRecognitionResult[] = [];
    
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const pageResult = await this.analyzePageFonts(pdfDocument, pageNum);
      results.push(pageResult);
    }

    return results;
  }

  async analyzePageFonts(pdfDocument: PDFDocumentProxy, pageNumber: number): Promise<FontRecognitionResult> {
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    const textRegions: TextRegion[] = [];
    const fontInstances = new Map<string, DetectedFont>();

    // Process each text item
    textContent.items.forEach((item: any, index: number) => {
      if (!item.str || item.str.trim() === '') return;

      const transform = item.transform;
      const fontSize = Math.abs(transform[0]);
      const x = transform[4];
      const y = viewport.height - transform[5]; // Convert PDF coordinates
      
      // Get font information from styles
      const style = textContent.styles[item.fontName];
      const fontInfo = this.extractFontInfo(item.fontName, style, fontSize);
      
      // Create text region
      const textRegion: TextRegion = {
        id: `text-${pageNumber}-${index}`,
        page: pageNumber,
        x,
        y: y - fontSize, // Adjust for baseline
        width: item.width,
        height: item.height || fontSize,
        text: item.str,
        fontName: item.fontName,
        fontSize,
        fontWeight: fontInfo.fontWeight,
        fontStyle: fontInfo.fontStyle,
        color: "#000000", // Default color, could be enhanced
        rotation: this.getRotationFromTransform(transform),
        isEditing: false,
        originalFontInfo: fontInfo
      };

      textRegions.push(textRegion);

      // Track font instances
      const fontKey = `${fontInfo.fontFamily}-${fontInfo.fontWeight}-${fontInfo.fontStyle}`;
      if (fontInstances.has(fontKey)) {
        const existing = fontInstances.get(fontKey)!;
        existing.instances++;
        if (!existing.pages.includes(pageNumber)) {
          existing.pages.push(pageNumber);
        }
      } else {
        fontInstances.set(fontKey, { ...fontInfo, instances: 1, pages: [pageNumber] });
      }
    });

    return {
      page: pageNumber,
      fonts: Array.from(fontInstances.values()),
      textRegions,
      confidence: this.calculateConfidence(Array.from(fontInstances.values()))
    };
  }

  private extractFontInfo(fontName: string, style: any, fontSize: number): DetectedFont {
    const cacheKey = `${fontName}-${fontSize}`;
    
    if (this.fontCache.has(cacheKey)) {
      return { ...this.fontCache.get(cacheKey)! };
    }

    // Parse font name to extract family and style
    const { family, weight, styleInfo } = this.parseFontName(fontName, style);
    
    const detectedFont: DetectedFont = {
      id: cacheKey,
      fontName,
      fontFamily: family,
      fontSize,
      fontWeight: weight,
      fontStyle: styleInfo,
      isSystemFont: this.systemFonts.has(family),
      fallbackFont: this.getFallbackFont(family),
      instances: 0,
      pages: [],
      confidence: this.calculateFontConfidence(family, fontName)
    };

    this.fontCache.set(cacheKey, detectedFont);
    return detectedFont;
  }

  private parseFontName(fontName: string, style: any): {
    family: string;
    weight: "normal" | "bold";
    styleInfo: "normal" | "italic";
  } {
    // Handle PDF.js internal font names (e.g., "g_d0_f1")
    let family = style?.fontFamily || "Unknown";
    let weight: "normal" | "bold" = "normal";
    let styleInfo: "normal" | "italic" = "normal";

    // Clean up font family name
    family = family.replace(/['"]/g, '').split(',')[0].trim();

    // Extract weight and style from font name or style
    const nameLower = fontName.toLowerCase();
    const familyLower = family.toLowerCase();

    // Check for bold
    if (nameLower.includes('bold') || familyLower.includes('bold') || 
        nameLower.includes('heavy') || familyLower.includes('heavy')) {
      weight = "bold";
    }

    // Check for italic
    if (nameLower.includes('italic') || familyLower.includes('italic') ||
        nameLower.includes('oblique') || familyLower.includes('oblique')) {
      styleInfo = "italic";
    }

    // Handle common PDF font mappings
    const fontMappings: Record<string, string> = {
      'helvetica': 'Helvetica',
      'arial': 'Arial',
      'times': 'Times New Roman',
      'courier': 'Courier New',
      'georgia': 'Georgia',
      'verdana': 'Verdana'
    };

    const mappedFamily = fontMappings[familyLower] || family;

    return {
      family: mappedFamily,
      weight,
      styleInfo
    };
  }

  private getFallbackFont(fontFamily: string): string {
    const fallbackMappings: Record<string, string> = {
      'Helvetica': 'Arial',
      'Times': 'Times New Roman',
      'Courier': 'Courier New',
      'Palatino': 'Georgia',
      'Optima': 'Verdana'
    };

    return fallbackMappings[fontFamily] || 'Arial';
  }

  private getRotationFromTransform(transform: number[]): number {
    // Calculate rotation from transformation matrix
    return Math.atan2(transform[1], transform[0]) * 180 / Math.PI;
  }

  private calculateFontConfidence(fontFamily: string, originalName: string): number {
    // Higher confidence for system fonts and recognizable names
    if (this.systemFonts.has(fontFamily)) return 0.9;
    if (fontFamily !== "Unknown") return 0.7;
    return 0.3;
  }

  private calculateConfidence(fonts: DetectedFont[]): number {
    if (fonts.length === 0) return 0;
    
    const avgConfidence = fonts.reduce((sum, font) => sum + font.confidence, 0) / fonts.length;
    return Math.min(avgConfidence + (fonts.length > 1 ? 0.1 : 0), 1.0);
  }

  async matchSystemFont(detectedFont: DetectedFont): Promise<string> {
    const { fontFamily, fontWeight, fontStyle } = detectedFont;
    
    // Try exact match first
    if (await this.isFontAvailable(fontFamily)) {
      return this.buildFontString(fontFamily, fontWeight, fontStyle);
    }

    // Try fallback font
    if (detectedFont.fallbackFont && await this.isFontAvailable(detectedFont.fallbackFont)) {
      return this.buildFontString(detectedFont.fallbackFont, fontWeight, fontStyle);
    }

    // Default fallback
    return this.buildFontString('Arial', fontWeight, fontStyle);
  }

  private async isFontAvailable(fontFamily: string): Promise<boolean> {
    // Use CSS Font Loading API to check font availability
    try {
      const font = new FontFace('test-font', `local("${fontFamily}")`);
      await font.load();
      return font.status === 'loaded';
    } catch {
      return this.systemFonts.has(fontFamily);
    }
  }

  private buildFontString(family: string, weight: "normal" | "bold", style: "normal" | "italic"): string {
    const parts = [];
    if (style === "italic") parts.push("italic");
    if (weight === "bold") parts.push("bold");
    parts.push(`"${family}"`);
    return parts.join(" ");
  }

  /**
   * Find the best font match from a list of detected fonts
   */
  public findBestFontMatch(targetFontFamily: string, detectedFonts: DetectedFont[]): DetectedFont | null {
    if (!detectedFonts.length) return null;
    
    // Exact match first
    let exactMatch = detectedFonts.find(font => 
      font.fontFamily.toLowerCase() === targetFontFamily.toLowerCase()
    );
    if (exactMatch) return exactMatch;
    
    // Partial match (contains)
    let partialMatch = detectedFonts.find(font => 
      font.fontFamily.toLowerCase().includes(targetFontFamily.toLowerCase()) ||
      targetFontFamily.toLowerCase().includes(font.fontFamily.toLowerCase())
    );
    if (partialMatch) return partialMatch;
    
    // Fallback match
    let fallbackMatch = detectedFonts.find(font => 
      font.fallbackFont?.toLowerCase() === targetFontFamily.toLowerCase()
    );
    if (fallbackMatch) return fallbackMatch;
    
    // Return highest confidence font as last resort
    return detectedFonts.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
  }

  /**
   * Enhanced font matching with similarity scoring
   */
  public findSimilarFonts(targetFont: DetectedFont, availableFonts: DetectedFont[], maxResults = 5): DetectedFont[] {
    const similarities = availableFonts.map(font => ({
      font,
      score: this.calculateFontSimilarity(targetFont, font)
    }));
    
    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(item => item.font);
  }

  private calculateFontSimilarity(font1: DetectedFont, font2: DetectedFont): number {
    let score = 0;
    
    // Family name similarity (most important)
    if (font1.fontFamily === font2.fontFamily) {
      score += 0.5;
    } else if (font1.fontFamily.toLowerCase().includes(font2.fontFamily.toLowerCase()) ||
               font2.fontFamily.toLowerCase().includes(font1.fontFamily.toLowerCase())) {
      score += 0.3;
    }
    
    // Weight similarity
    if (font1.fontWeight === font2.fontWeight) score += 0.2;
    
    // Style similarity
    if (font1.fontStyle === font2.fontStyle) score += 0.2;
    
    // Size similarity (less important for matching)
    const sizeDiff = Math.abs(font1.fontSize - font2.fontSize);
    if (sizeDiff <= 2) score += 0.1;
    else if (sizeDiff <= 5) score += 0.05;
    
    return score;
  }

  /**
   * Generate web font fallback stack
   */
  public generateFontStack(detectedFont: DetectedFont): string {
    const stack = [detectedFont.fontFamily];
    
    if (detectedFont.fallbackFont && detectedFont.fallbackFont !== detectedFont.fontFamily) {
      stack.push(detectedFont.fallbackFont);
    }
    
    // Add generic fallbacks based on font characteristics
    if (detectedFont.fontFamily.toLowerCase().includes('serif') || 
        ['Times', 'Georgia', 'Garamond'].some(serif => detectedFont.fontFamily.includes(serif))) {
      stack.push('serif');
    } else if (detectedFont.fontFamily.toLowerCase().includes('mono') ||
               ['Courier', 'Monaco', 'Consolas'].some(mono => detectedFont.fontFamily.includes(mono))) {
      stack.push('monospace');
    } else {
      stack.push('sans-serif');
    }
    
    return stack.map(font => font.includes(' ') ? `"${font}"` : font).join(', ');
  }

  public clearCache(): void {
    this.fontCache.clear();
  }
}

export const fontRecognitionService = FontRecognitionService.getInstance();
