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
import { FontInfo, FontManagerProps } from "../../types/pdf-types";
import { usePDFFonts } from "../../features/hooks/usePDFFonts";

// Standard PDF-safe fonts
const STANDARD_FONTS: FontInfo[] = [
  {
    name: "Helvetica",
    family: "Helvetica",
    style: "normal",
    weight: "normal",
    loaded: true,
  },
  {
    name: "Times-Roman",
    family: "Times",
    style: "normal",
    weight: "normal",
    loaded: true,
  },
  {
    name: "Courier",
    family: "Courier",
    style: "normal",
    weight: "normal",
    loaded: true,
  },
  {
    name: "Arial",
    family: "Arial",
    style: "normal",
    weight: "normal",
    loaded: true,
  },
  {
    name: "Georgia",
    family: "Georgia",
    style: "normal",
    weight: "normal",
    loaded: true,
  },
  {
    name: "Verdana",
    family: "Verdana",
    style: "normal",
    weight: "normal",
    loaded: true,
  },
];

// Popular Google Fonts
const GOOGLE_FONTS = [
  "Open Sans",
  "Roboto",
  "Lato",
  "Montserrat",
  "Source Sans Pro",
  "Raleway",
  "Ubuntu",
  "Nunito",
  "Poppins",
  "Merriweather",
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
}: FontManagerProps & { pdfDoc?: any }) {
  // State
  const [availableFonts, setAvailableFonts] = useState<FontInfo[]>([]);
  const [loadingFonts, setLoadingFonts] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [fontPreview, setFontPreview] = useState(
    "The quick brown fox jumps over the lazy dog",
  );
  const [searchQuery, setSearchQuery] = useState("");

  // PDF Fonts hook
  const {
    embeddedFonts,
    isLoading: loadingEmbeddedFonts,
    getFontInfoList,
  } = usePDFFonts(pdfDoc);

  // Load Google Font
  const loadGoogleFont = useCallback(async (fontName: string) => {
    try {
      // Check if font is already loaded
      if (
        document.querySelector(`link[href*="${fontName.replace(/\s+/g, "+")}"]`)
      ) {
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
        variants: ["300", "400", "500", "600", "700"],
      });
    }

    setAvailableFonts((prev) => {
      // Filter out any duplicates
      const existingFontNames = prev.map((f) => f.name);
      const uniqueNewFonts = newFonts.filter(
        (f) => !existingFontNames.includes(f.name),
      );
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
    <div className="space-y-4" data-oid="9mr0dz7">
      {/* Font Selection */}
      <div className="flex items-center gap-2 flex-wrap" data-oid="2ceo108">
        <Select
          value={selectedFont}
          onValueChange={onFontChange}
          data-oid="15z2x-s"
        >
          <SelectTrigger className="w-48" data-oid="2ddq42r">
            <SelectValue placeholder="Select font" data-oid="1ylwhci" />
          </SelectTrigger>
          <SelectContent className="max-h-60" data-oid="ei87.iv">
            {filteredFonts.map((font) => (
              <SelectItem key={font.name} value={font.name} data-oid="ekcae8:">
                <div className="flex items-center gap-2" data-oid="3o8f3ca">
                  <span style={{ fontFamily: font.family }} data-oid="l58bakc">
                    {font.name}
                  </span>
                  {!font.loaded && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                      data-oid="k7ewap1"
                    >
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
          data-oid="f3ahfey"
        />

        <Button
          variant={fontWeight === "bold" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            onFontWeightChange(fontWeight === "bold" ? "normal" : "bold")
          }
          data-oid="x3c2fi5"
        >
          <strong data-oid=":ux25dn">B</strong>
        </Button>

        <Button
          variant={fontStyle === "italic" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            onFontStyleChange(fontStyle === "italic" ? "normal" : "italic")
          }
          data-oid="sk7q111"
        >
          <em data-oid="yidq0qs">I</em>
        </Button>

        {!loadingFonts && (
          <Button
            variant="outline"
            size="sm"
            onClick={loadMoreFonts}
            data-oid=".j-0oby"
          >
            <Download className="h-4 w-4 mr-1" data-oid="ypo4wjo" />
            Load More Fonts
          </Button>
        )}
      </div>

      {/* Loading Progress */}
      {loadingFonts && (
        <div className="space-y-2" data-oid="c12ddsx">
          <Progress value={loadProgress} data-oid="22diq5j" />
          <p className="text-sm text-gray-500" data-oid="nn3093t">
            Loading fonts... {Math.round(loadProgress)}%
          </p>
        </div>
      )}

      {/* Advanced Controls */}
      {showAdvanced && (
        <Card data-oid="m.mi5d-">
          <CardHeader data-oid="35.ccgx">
            <CardTitle className="flex items-center gap-2" data-oid="qxdvxf4">
              <Type className="h-5 w-5" data-oid="h1ueg21" />
              Font Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" data-oid="ent:a49">
            {/* Font Search */}
            <div className="relative" data-oid="cg6_3cp">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                data-oid="6sv8hp6"
              />

              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fonts..."
                className="pl-10"
                data-oid="tj49t3i"
              />
            </div>

            {/* Font Preview */}
            <div className="space-y-2" data-oid="pkmd9pb">
              <label className="text-sm font-medium" data-oid="2:g7_fg">
                Preview Text:
              </label>
              <Input
                value={fontPreview}
                onChange={(e) => setFontPreview(e.target.value)}
                placeholder="Enter preview text..."
                data-oid="2mxxkuc"
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
                  data-oid=".uqg:-z"
                >
                  {fontPreview}
                </div>
              )}
            </div>

            {/* Font Info */}
            {selectedFontInfo && (
              <div className="space-y-2 text-sm" data-oid="6s0_ug7">
                <h4 className="font-medium" data-oid="wg8z4-w">
                  Font Information:
                </h4>
                <div className="grid grid-cols-2 gap-2" data-oid="om0wurx">
                  <div data-oid="ivmsehf">
                    <span className="text-gray-500" data-oid="-nw:q_9">
                      Family:
                    </span>{" "}
                    {selectedFontInfo.family}
                  </div>
                  <div data-oid="s:svime">
                    <span className="text-gray-500" data-oid="sprx9z5">
                      Style:
                    </span>{" "}
                    {selectedFontInfo.style}
                  </div>
                  <div data-oid="ehj5vr3">
                    <span className="text-gray-500" data-oid="0pz:_dp">
                      Weight:
                    </span>{" "}
                    {selectedFontInfo.weight}
                  </div>
                  <div data-oid="m:._4x5">
                    <span className="text-gray-500" data-oid="1:nlpxd">
                      Status:
                    </span>
                    <Badge
                      variant={
                        selectedFontInfo.loaded ? "default" : "secondary"
                      }
                      className="ml-2"
                      data-oid="hemhgne"
                    >
                      {selectedFontInfo.loaded ? "Loaded" : "Not Loaded"}
                    </Badge>
                  </div>
                </div>

                {selectedFontInfo.variants && (
                  <div data-oid="a7m209-">
                    <span className="text-gray-500" data-oid="wlavuzq">
                      Available weights:
                    </span>
                    <div className="flex gap-1 mt-1" data-oid="db57bsh">
                      {selectedFontInfo.variants.map((variant) => (
                        <Badge
                          key={variant}
                          variant="outline"
                          className="text-xs"
                          data-oid="15tzpwz"
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
            <div className="text-sm text-gray-500" data-oid=".07dh1e">
              <p data-oid="u26i9ki">Available fonts: {availableFonts.length}</p>
              <p data-oid="urgl:zs">
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
        reject(
          new Error(`Font '${this.family}' load timed out after ${timeout}ms`),
        );
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
