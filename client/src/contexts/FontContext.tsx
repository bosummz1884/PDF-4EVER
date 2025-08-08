import React, { createContext, useState, useContext, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { loadFonts, getAvailableFontNames } from "../lib/loadFonts";

interface FontContextType {
  loadedFonts: Record<string, any>;
  availableFonts: string[];
  isLoading: boolean;
  loadProgress: number;
  loadCustomFont: (fontName: string, fontUrl: string) => Promise<boolean>;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [loadedFonts, setLoadedFonts] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [availableFonts, setAvailableFonts] = useState<string[]>([]);

  useEffect(() => {
    async function initializeFonts() {
      setIsLoading(true);
      try {
        // Create a temporary PDF document to load fonts into
        const pdfDoc = await PDFDocument.create();
        const fontNames = getAvailableFontNames();
        setAvailableFonts(fontNames);

        // Load fonts in batches to show progress
        const batchSize = 5;
        const fontEntries = Object.entries(fontNames);
        const totalFonts = fontEntries.length;
        const fonts: Record<string, any> = {};

        for (let i = 0; i < totalFonts; i += batchSize) {
          const batch = fontEntries.slice(i, i + batchSize);
          const batchFonts = await loadFonts(pdfDoc);

          Object.assign(fonts, batchFonts);
          setLoadProgress(Math.round(((i + batch.length) / totalFonts) * 100));
        }

        setLoadedFonts(fonts);
      } catch (error) {
        console.error("Failed to load fonts:", error);
      } finally {
        setIsLoading(false);
        setLoadProgress(100);
      }
    }

    initializeFonts();
  }, []);

  const loadCustomFont = async (
    fontName: string,
    fontUrl: string,
  ): Promise<boolean> => {
    try {
      const pdfDoc = await PDFDocument.create();
      const response = await fetch(fontUrl);
      if (response.ok) {
        const fontBytes = await response.arrayBuffer();
        const embeddedFont = await pdfDoc.embedFont(fontBytes);
        setLoadedFonts((prev) => ({
          ...prev,
          [fontName]: embeddedFont,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to load custom font ${fontName}:`, error);
      return false;
    }
  };

  return (
    <FontContext.Provider
      value={{
        loadedFonts,
        availableFonts,
        isLoading,
        loadProgress,
        loadCustomFont,
      }}
      data-oid="er3fl9i"
    >
      {children}
    </FontContext.Provider>
  );
}

export function useFonts() {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error("useFonts must be used within a FontProvider");
  }
  return context;
}
