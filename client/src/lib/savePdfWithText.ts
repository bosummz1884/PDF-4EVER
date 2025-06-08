import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { loadFonts } from "./loadFonts";

interface TextObject {
  x: number;
  y: number;
  value: string;
  font?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
}

/**
 * Embeds all inline edited text into the original PDF and triggers download.
 */
export async function savePdfWithText(
  originalFile: File, 
  textObjects: TextObject[], 
  canvas: HTMLCanvasElement,
  fileName?: string
) {
  try {
    const arrayBuffer = await originalFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Get all pages for multi-page support
    const pages = pdfDoc.getPages();
    
    // Load comprehensive font library
    console.log('Loading comprehensive font library...');
    const fontMap = await loadFonts(pdfDoc);
    console.log('Loaded fonts:', Object.keys(fontMap));
    
    // Load fallback standard fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
    const courierBoldFont = await pdfDoc.embedFont(StandardFonts.CourierBold);

    // Enhanced font mapping with comprehensive font support
    const getFontForText = (fontName?: string, fontWeight?: string) => {
      const isBold = fontWeight === 'bold';
      
      if (!fontName) return fontMap['Arial'] || helveticaFont;
      
      // First, try to find exact match in loaded fonts
      if (fontMap[fontName]) {
        return fontMap[fontName];
      }
      
      // Try to find similar font in loaded fonts
      const lowerFont = fontName.toLowerCase();
      
      // Look for close matches in our comprehensive font library
      for (const [loadedFontName, embeddedFont] of Object.entries(fontMap)) {
        const lowerLoadedFont = loadedFontName.toLowerCase();
        if (lowerLoadedFont.includes(lowerFont) || lowerFont.includes(lowerLoadedFont)) {
          return embeddedFont;
        }
      }
      
      // Fallback to category-based matching
      if (lowerFont.includes('times') || lowerFont.includes('roman')) {
        return fontMap['Times New Roman'] || fontMap['Georgia'] || (isBold ? helveticaBoldFont : timesFont);
      }
      if (lowerFont.includes('arial') || lowerFont.includes('helvetica')) {
        return fontMap['Arial'] || fontMap['Helvetica'] || (isBold ? helveticaBoldFont : helveticaFont);
      }
      if (lowerFont.includes('courier') || lowerFont.includes('mono')) {
        return fontMap['Courier New'] || fontMap['Inconsolata'] || (isBold ? courierBoldFont : courierFont);
      }
      if (lowerFont.includes('sans')) {
        return fontMap['Open Sans'] || fontMap['Source Sans Pro'] || fontMap['Roboto'] || helveticaFont;
      }
      
      // Default to best available font
      return fontMap['Arial'] || fontMap['Roboto'] || fontMap['Open Sans'] || helveticaFont;
    };

    const parseColor = (colorStr?: string) => {
      if (!colorStr || colorStr === '#000000') return rgb(0, 0, 0);
      
      // Remove # if present
      const hex = colorStr.replace('#', '');
      
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;
        return rgb(r, g, b);
      }
      
      return rgb(0, 0, 0); // Default to black
    };

    // Process text objects for the first page (expandable for multi-page)
    const page = pages[0];
    const { height: pageHeight, width: pageWidth } = page.getSize();
    
    for (const textObj of textObjects) {
      const {
        x,
        y,
        value,
        font,
        fontSize = 16,
        color,
        fontWeight,
      } = textObj;

      if (!value || !value.trim()) continue;

      const embeddedFont = getFontForText(font, fontWeight);
      const textColor = parseColor(color);
      
      // Convert canvas coordinates to PDF coordinates
      // PDF origin is bottom-left, canvas origin is top-left
      const canvasHeight = canvas.height;
      const canvasWidth = canvas.width;
      const pdfY = pageHeight - (y * (pageHeight / canvasHeight));
      const pdfX = x * (pageWidth / canvasWidth);

      page.drawText(value, {
        x: pdfX,
        y: pdfY,
        size: fontSize,
        font: embeddedFont,
        color: textColor,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const finalFileName = fileName || `edited-${originalFile.name}`;
    triggerDownload(pdfBytes, finalFileName);
    
    return true;
  } catch (error) {
    console.error('Error saving PDF with text:', error);
    throw error;
  }
}

function triggerDownload(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}