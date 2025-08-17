import type { PDFDocumentProxy } from "pdfjs-dist";
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

  // Analyze fonts across all pages and return per-page results
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
    // reason: Normalize disparate PDF font identifiers to canonical families and infer style/weight
    let rawFamily = (style?.fontFamily || "Unknown").replace(/['"]/g, '').split(',')[0].trim();
    let familyLower = rawFamily.toLowerCase();

    // Normalize common vendor suffixes/prefixes and weight/style descriptors often embedded in names
    const cleanup = (s: string) => s
      .replace(/[-_]?mt\b/gi, '')
      .replace(/[-_]?ps\b/gi, '')
      .replace(/[-_]?std\b/gi, '')
      .replace(/[-_]?pro\b/gi, '')
      .replace(/[-_]?lt\b/gi, '')
      .replace(/[-_]?roman\b/gi, '')
      .replace(/[-_]?regular\b/gi, '')
      .replace(/[-_]?book\b/gi, '')
      .replace(/[-_]?medium\b/gi, '')
      .replace(/[-_]?light\b/gi, '')
      .replace(/[-_]?ultra(light)?\b/gi, '')
      .replace(/[-_]?black\b/gi, '')
      .replace(/[-_]?heavy\b/gi, '')
      .replace(/[-_]?bold\b/gi, '')
      .replace(/[-_]?italic\b/gi, '')
      .replace(/[-_]?oblique\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const nameLower = fontName.toLowerCase();
    const normalizedFamilyLower = cleanup(familyLower);

    // Canonical mappings to well-known families
    const fontMappings: Record<string, string> = {
      'helvetica': 'Helvetica',
      'arial': 'Arial',
      'times': 'Times New Roman',
      'times new roman': 'Times New Roman',
      'courier': 'Courier New',
      'courier new': 'Courier New',
      'georgia': 'Georgia',
      'verdana': 'Verdana',
      'tahoma': 'Tahoma',
      'garamond': 'Garamond',
      'palatino': 'Palatino',
      'bookman': 'Bookman',
      'avant garde': 'Avant Garde'
    };

    let canonicalFamily = fontMappings[normalizedFamilyLower] || cleanup(rawFamily);

    // Infer weight
    let weight: "normal" | "bold" = (
      /\b(bold|heavy|black|semibold|demibold|medium)\b/.test(nameLower) ||
      /\b(bold|heavy|black|semibold|demibold|medium)\b/.test(familyLower)
    ) ? "bold" : "normal";

    // Infer style
    let styleInfo: "normal" | "italic" = (
      /\b(italic|oblique)\b/.test(nameLower) ||
      /\b(italic|oblique)\b/.test(familyLower)
    ) ? "italic" : "normal";

    return {
      family: canonicalFamily,
      weight,
      styleInfo
    };
  }

  private getFallbackFont(fontFamily: string): string {
    // reason: Provide a primary near-equivalent fallback for common families
    const fallbackMappings: Record<string, string> = {
      'Helvetica': 'Arial',
      'Arial': 'Helvetica',
      'Times': 'Times New Roman',
      'Times New Roman': 'Times',
      'Courier': 'Courier New',
      'Courier New': 'Courier',
      'Palatino': 'Georgia',
      'Garamond': 'Georgia',
      'Optima': 'Verdana',
      'Tahoma': 'Verdana',
      'Verdana': 'Tahoma'
    };

    return fallbackMappings[fontFamily] || 'Arial';
  }

  private getRotationFromTransform(transform: number[]): number {
    // Calculate rotation from transformation matrix
    return Math.atan2(transform[1], transform[0]) * 180 / Math.PI;
  }

  private calculateFontConfidence(fontFamily: string, originalName: string): number {
    // reason: Weigh recognizability, system availability, and cleanliness of the normalized name
    const isSystem = this.systemFonts.has(fontFamily);
    const cleanNameScore = /[a-z]/i.test(fontFamily) ? 0.2 : 0.0; // basic sanity of readable name
    const canonicalScore = (fontFamily !== 'Unknown') ? 0.4 : 0.0;
    const systemScore = isSystem ? 0.3 : 0.0;
    const bonus = /[-_]/.test(originalName) ? 0.0 : 0.1; // fewer artifacts in original name
    return Math.min(canonicalScore + systemScore + cleanNameScore + bonus, 0.95);
  }

  private calculateConfidence(fonts: DetectedFont[]): number {
    if (fonts.length === 0) return 0;
    // reason: Combine per-font confidence with usage frequency to get page-level confidence
    const totalInstances = fonts.reduce((sum, f) => sum + (f.instances || 0), 0) || fonts.length;
    const weighted = fonts.reduce((sum, f) => sum + (f.confidence * ((f.instances || 1) / totalInstances)), 0);
    const diversityPenalty = (new Set(fonts.map(f => f.fontFamily)).size > 8) ? 0.05 : 0;
    return Math.max(0, Math.min(1, weighted - diversityPenalty));
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
    const norm = (s: string) => s.replace(/['"]/g, '').toLowerCase();
    const target = norm(targetFontFamily);

    // Exact match first
    let exactMatch = detectedFonts.find(font => norm(font.fontFamily) === target);
    if (exactMatch) return exactMatch;
    
    // Partial match (contains)
    let partialMatch = detectedFonts.find(font => {
      const f = norm(font.fontFamily);
      return f.includes(target) || target.includes(f);
    });
    if (partialMatch) return partialMatch;
    
    // Fallback match
    let fallbackMatch = detectedFonts.find(font => font.fallbackFont && norm(font.fallbackFont) === target);
    if (fallbackMatch) return fallbackMatch;
    
    // Similarity-based choice as tie breaker
    const scored = detectedFonts.map(f => ({ f, s: this.calculateFontSimilarity({
      // construct a lightweight DetectedFont-like shape for scoring
      id: 'target', fontName: targetFontFamily, fontFamily: targetFontFamily, fontSize: f.fontSize,
      fontWeight: f.fontWeight, fontStyle: f.fontStyle, isSystemFont: false, fallbackFont: this.getFallbackFont(targetFontFamily),
      instances: 1, pages: [], confidence: 0.5
    } as DetectedFont, f) }));
    scored.sort((a, b) => b.s - a.s || b.f.confidence - a.f.confidence);
    return scored[0]?.f || null;
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
    const name = detectedFont.fontFamily;
    const lower = name.toLowerCase();
    const stack: string[] = [name];

    // Primary near-equivalent
    if (detectedFont.fallbackFont && detectedFont.fallbackFont !== name) {
      stack.push(detectedFont.fallbackFont);
    }

    // Platform-safe tiered fallbacks by category
    const serif = ["Times New Roman", "Times", "Georgia", "Garamond", "serif"];
    const mono = ["Consolas", "Monaco", "Courier New", "Courier", "monospace"];
    const sans = ["Arial", "Helvetica", "Verdana", "Tahoma", "Trebuchet MS", "sans-serif"];

    const isSerif = lower.includes('serif') || ["times", "georgia", "garamond", "palatino"].some(s => name.includes(s));
    const isMono = lower.includes('mono') || ["courier", "consolas", "monaco"].some(s => lower.includes(s));

    if (isSerif) stack.push(...serif.filter(f => f !== name));
    else if (isMono) stack.push(...mono.filter(f => f !== name));
    else stack.push(...sans.filter(f => f !== name));

    // Deduplicate while preserving order
    const deduped = Array.from(new Set(stack));
    return deduped.map(font => font.includes(' ') ? `"${font}"` : font).join(', ');
  }

  public clearCache(): void {
    this.fontCache.clear();
  }
}

export const fontRecognitionService = FontRecognitionService.getInstance();
