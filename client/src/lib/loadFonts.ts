// client/src/lib/loadFonts.ts

import { PDFDocument, PDFFont } from "pdf-lib";

// This list maps font names to the paths where the font files are located.
// For this to work, you must have these font files in your project's `public/fonts/` directory.
const fontPaths: Record<string, string> = {
  Arial: "/fonts/arial.ttf",

  Helvetica: "/fonts/helvetica.ttf",

  "Times New Roman": "/fonts/times-new-roman.ttf",

  "Courier New": "/fonts/courier-new.ttf",

  Verdana: "/fonts/verdana.ttf",

  Georgia: "/fonts/georgia.ttf",

  "Trebuchet MS": "/fonts/trebuchet-ms.ttf",

  Tahoma: "/fonts/tahoma.ttf",

  Impact: "/fonts/impact.ttf",

  "Comic Sans MS": "/fonts/comic-sans-ms.ttf",

  Roboto: "/fonts/roboto.ttf",

  "Open Sans": "/fonts/open-sans.ttf",

  Lato: "/fonts/lato.ttf",

  Montserrat: "/fonts/montserrat.ttf",

  Oswald: "/fonts/oswald.ttf",

  Raleway: "/fonts/raleway.ttf",

  "PT Sans": "/fonts/pt-sans.ttf",

  "Source Sans Pro": "/fonts/source-sans-pro.ttf",

  Merriweather: "/fonts/merriweather.ttf",

  "Noto Sans": "/fonts/noto-sans.ttf",

  Ubuntu: "/fonts/ubuntu.ttf",

  Nunito: "/fonts/nunito.ttf",

  "Work Sans": "/fonts/work-sans.ttf",

  Rubik: "/fonts/rubik.ttf",

  Poppins: "/fonts/poppins.ttf",

  Inter: "/fonts/inter.ttf",

  "Fira Sans": "/fonts/fira-sans.ttf",

  Cabin: "/fonts/cabin.ttf",

  "Playfair Display": "/fonts/playfair-display.ttf",

  "Titillium Web": "/fonts/titillium-web.ttf",

  Inconsolata: "/fonts/inconsolata.ttf",

  "IBM Plex Sans": "/fonts/ibm-plex-sans.ttf",

  Quicksand: "/fonts/quicksand.ttf",

  Assistant: "/fonts/assistant.ttf",

  Mukta: "/fonts/mukta.ttf",

  Arimo: "/fonts/arimo.ttf",

  Karla: "/fonts/karla.ttf",

  "Josefin Sans": "/fonts/josefin-sans.ttf",

  Manrope: "/fonts/manrope.ttf",

  "Zilla Slab": "/fonts/zilla-slab.ttf",

  "Space Grotesk": "/fonts/space-grotesk.ttf",

  Barlow: "/fonts/barlow.ttf",

  Cairo: "/fonts/cairo.ttf",

  "DM Sans": "/fonts/dm-sans.ttf",

  Mulish: "/fonts/mulish.ttf",

  Heebo: "/fonts/heebo.ttf",

  "Exo 2": "/fonts/exo-2.ttf",

  "Be Vietnam Pro": "/fonts/be-vietnam-pro.ttf",

  Anton: "/fonts/anton.ttf",
};

/**
 * Preloads a curated list of font files and embeds them into a pdf-lib document.
 * This is essential for ensuring that any text we add to the PDF can be rendered correctly.
 * @param pdfDoc The pdf-lib document instance to embed fonts into.
 * @returns A promise that resolves with a map of font names to their embedded PDFont objects.
 */
export async function loadAndEmbedFonts(
  pdfDoc: PDFDocument
): Promise<Record<string, PDFFont>> {
  const fontMap: Record<string, PDFFont> = {};

  for (const [fontName, path] of Object.entries(fontPaths)) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        const fontBytes = await response.arrayBuffer();
        // Embed the font data into the PDF document itself
        const embeddedFont = await pdfDoc.embedFont(fontBytes);
        fontMap[fontName] = embeddedFont;
      } else {
        console.warn(
          `Font file not found and will not be available: ${fontName} at ${path}`
        );
      }
    } catch (err) {
      console.warn(
        `Failed to load font "${fontName}". It will not be available.`,
        err
      );
    }
  }

  return fontMap;
}
