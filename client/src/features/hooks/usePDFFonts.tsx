import { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { loadFonts, getAvailableFontNames } from '../../lib/loadFonts';
import type { FontInfo } from '../../types/pdf-types';

export function usePDFFonts(pdfDoc?: PDFDocument) {
  const [embeddedFonts, setEmbeddedFonts] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [availableFontNames, setAvailableFontNames] = useState<string[]>([]);
  
  // Load available font names on mount
  useEffect(() => {
    setAvailableFontNames(getAvailableFontNames());
  }, []);
  
  // Load fonts when PDF document is provided
  useEffect(() => {
    if (!pdfDoc) return;
    
    const loadEmbeddedFonts = async () => {
      setIsLoading(true);
      try {
        const fonts = await loadFonts(pdfDoc);
        setEmbeddedFonts(fonts);
      } catch (error) {
        console.error('Error loading fonts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEmbeddedFonts();
  }, [pdfDoc]);
  
  // Convert embedded fonts to FontInfo format for FontManager
  const getFontInfoList = (): FontInfo[] => {
    return Object.keys(embeddedFonts).map(fontName => ({
      name: fontName,
      family: fontName,
      style: 'normal',
      weight: 'normal',
      loaded: true
    }));
  };
  
  return {
    embeddedFonts,
    isLoading,
    availableFontNames,
    getFontInfoList
  };
}