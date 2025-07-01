import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Type, Download, Eye, Search } from "lucide-react";
import { usePDFFonts } from 'client/src/features/hooks/usePDFFonts';
import { FontInfo, FontManagerProps } from '../../types/pdf-types';

// Standard PDF-safe fonts
const STANDARD_FONTS: FontInfo[] = [
  { name: "Helvetica", family: "Helvetica", style: "normal", weight: "normal", loaded: true },
  { name: "Times-Roman", family: "Times", style: "normal", weight: "normal", loaded: true },
  { name: "Courier", family: "Courier", style: "normal", weight: "normal", loaded: true },
  { name: "Arial", family: "Arial", style: "normal", weight: "normal", loaded: true },
  { name: "Georgia", family: "Georgia", style: "normal", weight: "normal", loaded: true },
  { name: "Verdana", family: "Verdana", style: "normal", weight: "normal", loaded: true },
];

// Popular Google Fonts
const GOOGLE_FONTS = [
  "Open Sans", "Roboto", "Lato", "Montserrat", "Source Sans Pro",
  "Raleway", "Ubuntu", "Nunito", "Poppins", "Merriweather"
];

export default function FontManager({
  selectedFont,
  onFontChange,
  fontSize,
  onFontSizeChange,
  fontWeight,
  onFontWeightChange,
  fontStyle,
  onFontStyleChange,
  showAdvanced = false,
  pdfDoc,
}: FontManagerProps & {pdfDoc?: any}) {
  // State
  const [availableFonts, setAvailableFonts] = useState<FontInfo[]>([]);
  const [loadingFonts, setLoadingFonts] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [fontPreview, setFontPreview] = useState("The quick brown fox jumps over the lazy dog");
  const [searchQuery, setSearchQuery] = useState("");
  
  // PDF Fonts hook
  const { embeddedFonts, isLoading: loadingEmbeddedFonts, getFontInfoList } = usePDFFonts(pdfDoc);

  // Load Google Font
  const loadGoogleFont = useCallback(async (fontName: string) => {
    try {
      // Check if font is already loaded
      if (document.querySelector(`link[href*="${fontName.replace(/\s+/g, "+")}"]`)) {
        return true;
      }
      
      // Create link element for Google Font
      const link = document.createElement("link");
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, "+")}:wght@300;400;500;600;700&display=swap`;
      link.rel = "stylesheet";
      document.head.appendChild(link);

      // Wait for font to load
      await new FontFaceObserver(fontName).load();
      return true;
    } catch (error) {
      console.warn(`Failed to load font: ${fontName}`, error);
      return false;
    }
  }, []);

  // Initialize fonts
  useEffect(() => {
    // Start with standard fonts
    const initialFonts = [...STANDARD_FONTS];
    
    // Add embedded fonts if available
    if (embeddedFonts && getFontInfoList) {
      const pdfFonts = getFontInfoList();
      initialFonts.push(...pdfFonts);
    }
    
    setAvailableFonts(initialFonts);
  }, [embeddedFonts, getFontInfoList]);

  // Load additional Google Fonts
  const loadMoreFonts = useCallback(async () => {
    setLoadingFonts(true);
    setLoadProgress(0);
    
    const newFonts: FontInfo[] = [];
    
    for (let i = 0; i < GOOGLE_FONTS.length; i++) {
      const fontName = GOOGLE_FONTS[i];
      setLoadProgress(((i + 1) / GOOGLE_FONTS.length) * 100);
      
      const loaded = await loadGoogleFont(fontName);
      newFonts.push({
        name: fontName,
        family: fontName,
        style: "normal",
        weight: "normal",
        loaded,
        variants: ["300", "400", "500", "600", "700"]
      });
    }
    
    setAvailableFonts(prev => {
      // Filter out any duplicates
      const existingFontNames = prev.map(f => f.name);
      const uniqueNewFonts = newFonts.filter(f => !existingFontNames.includes(f.name));
      return [...prev, ...uniqueNewFonts];
    });
    
    setLoadingFonts(false);
  }, [loadGoogleFont]);

  // Filter fonts based on search query
  const filteredFonts = availableFonts.filter(
    (font) =>
      font.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      font.family.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Get info for selected font
  const selectedFontInfo = availableFonts.find((f) => f.name === selectedFont);

  return (
    <div className="space-y-4">
      {/* Font Selection */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={selectedFont} onValueChange={onFontChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {filteredFonts.map((font) => (
              <SelectItem key={font.name} value={font.name}>
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: font.family }}>{font.name}</span>
                  {!font.loaded && (
                    <Badge variant="outline" className="text-xs">
                      Not loaded
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          value={fontSize}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
          className="w-20"
          min={8}
          max={144}
          placeholder="Size"
        />

        <Button
          variant={fontWeight === "bold" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            onFontWeightChange(fontWeight === "bold" ? "normal" : "bold")
          }
        >
          <strong>B</strong>
        </Button>

        <Button
          variant={fontStyle === "italic" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            onFontStyleChange(fontStyle === "italic" ? "normal" : "italic")
          }
        >
          <em>I</em>
        </Button>

        {!loadingFonts && (
          <Button variant="outline" size="sm" onClick={loadMoreFonts}>
            <Download className="h-4 w-4 mr-1" />
            Load More Fonts
          </Button>
        )}
      </div>

      {/* Loading Progress */}
      {loadingFonts && (
        <div className="space-y-2">
          <Progress value={loadProgress} />
          <p className="text-sm text-gray-500">
            Loading fonts... {Math.round(loadProgress)}%
          </p>
        </div>
      )}

      {/* Advanced Controls */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Font Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Font Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fonts..."
                className="pl-10"
              />
            </div>

            {/* Font Preview */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview Text:</label>
              <Input
                value={fontPreview}
                onChange={(e) => setFontPreview(e.target.value)}
                placeholder="Enter preview text..."
              />

              {selectedFontInfo && (
                <div
                  className="p-4 border rounded bg-white dark:bg-gray-900"
                  style={{
                    fontFamily: selectedFontInfo.family,
                    fontSize: `${fontSize}px`,
                    fontWeight: fontWeight,
                    fontStyle: fontStyle,
                  }}
                >
                  {fontPreview}
                </div>
              )}
            </div>

            {/* Font Info */}
            {selectedFontInfo && (
              <div className="space-y-2 text-sm">
                <h4 className="font-medium">Font Information:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500">Family:</span>{" "}
                    {selectedFontInfo.family}
                  </div>
                  <div>
                    <span className="text-gray-500">Style:</span>{" "}
                    {selectedFontInfo.style}
                  </div>
                  <div>
                    <span className="text-gray-500">Weight:</span>{" "}
                    {selectedFontInfo.weight}
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <Badge
                      variant={
                        selectedFontInfo.loaded ? "default" : "secondary"
                      }
                      className="ml-2"
                    >
                      {selectedFontInfo.loaded ? "Loaded" : "Not Loaded"}
                    </Badge>
                  </div>
                </div>

                {selectedFontInfo.variants && (
                  <div>
                    <span className="text-gray-500">Available weights:</span>
                    <div className="flex gap-1 mt-1">
                      {selectedFontInfo.variants.map((variant) => (
                        <Badge
                          key={variant}
                          variant="outline"
                          className="text-xs"
                        >
                          {variant}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Font Statistics */}
            <div className="text-sm text-gray-500">
              <p>Available fonts: {availableFonts.length}</p>
                  <p>
                  Loaded fonts: {availableFonts.filter((f) => f.loaded).length}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
}

// FontFaceObserver polyfill for older browsers
class FontFaceObserver {
  family: string;

  constructor(family: string) {
    this.family = family;
  }

  load() {
    return new Promise((resolve, reject) => {
      const testString = "BESbswy";
      const timeout = 3000;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Canvas context not available"));
        return;
      }

      // Create a style element to add @font-face rule for testing
      const style = document.createElement("style");
      style.innerHTML = `
        @font-face {
          font-family: 'font-observer-test';
          src: local('${this.family}');
          font-weight: normal;
          font-style: normal;
        }
      `;
      document.head.appendChild(style);

      // Set up timeout
      const timer = setTimeout(() => {
        reject(new Error(`Font '${this.family}' load timed out after ${timeout}ms`));
      }, timeout);

      // Check if font is loaded by comparing width with fallback fonts
      const checkFont = () => {
        // Draw with test font
        context.font = `normal 16px 'font-observer-test'`;
        const testWidth = context.measureText(testString).width;

        // Draw with fallback fonts
        context.font = `normal 16px 'serif'`;
        const serifWidth = context.measureText(testString).width;

        context.font = `normal 16px 'sans-serif'`;
        const sansWidth = context.measureText(testString).width;

        // If width is different from both fallbacks, font is loaded
        if (testWidth !== serifWidth && testWidth !== sansWidth) {
          clearTimeout(timer);
          document.head.removeChild(style);
          resolve(true);
          return;
        }

        // Try again in 50ms
        setTimeout(checkFont, 50);
      };

      checkFont();
    });
  }
}