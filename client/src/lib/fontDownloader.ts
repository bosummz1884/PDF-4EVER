// Font download utility for comprehensive font library
const fontUrls: Record<string, string> = {
  "Arial": "https://fonts.cdnfonts.com/s/11051/Arial.woff",
  "Helvetica": "https://github.com/ctrlcctrlv/TTF2EOT/blob/master/helvetica.ttf?raw=true",
  "Times New Roman": "https://fonts.cdnfonts.com/s/15099/Times%20New%20Roman.woff",
  "Courier New": "https://github.com/ctrlcctrlv/TTF2EOT/blob/master/courier.ttf?raw=true",
  "Verdana": "https://fonts.cdnfonts.com/s/10593/Verdana.woff",
  "Georgia": "https://fonts.cdnfonts.com/s/10615/Georgia.woff",
  "Roboto": "https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Regular.ttf",
  "Open Sans": "https://github.com/google/fonts/raw/main/apache/opensans/OpenSans-Regular.ttf",
  "Lato": "https://github.com/google/fonts/raw/main/ofl/lato/Lato-Regular.ttf",
  "Montserrat": "https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat-Regular.ttf",
  "Inter": "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.ttf",
  "Poppins": "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf",
};

interface FontCache {
  [fontName: string]: ArrayBuffer;
}

class FontDownloadManager {
  private cache: FontCache = {};
  private downloadPromises: Map<string, Promise<ArrayBuffer>> = new Map();

  async downloadFont(fontName: string): Promise<ArrayBuffer | null> {
    // Return cached font if available
    if (this.cache[fontName]) {
      return this.cache[fontName];
    }

    // Return existing download promise if in progress
    if (this.downloadPromises.has(fontName)) {
      return this.downloadPromises.get(fontName)!;
    }

    const fontUrl = fontUrls[fontName];
    if (!fontUrl) {
      console.warn(`Font URL not found for: ${fontName}`);
      return null;
    }

    // Create download promise
    const downloadPromise = this.fetchFont(fontUrl, fontName);
    this.downloadPromises.set(fontName, downloadPromise);

    try {
      const fontBuffer = await downloadPromise;
      this.cache[fontName] = fontBuffer;
      this.downloadPromises.delete(fontName);
      return fontBuffer;
    } catch (error) {
      console.error(`Failed to download font ${fontName}:`, error);
      this.downloadPromises.delete(fontName);
      return null;
    }
  }

  private async fetchFont(url: string, fontName: string): Promise<ArrayBuffer> {
    const response = await fetch(url, {
      mode: 'cors',
      headers: {
        'Accept': 'application/font-woff, application/font-woff2, font/woff, font/woff2, application/octet-stream'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.status} ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  async downloadMultipleFonts(fontNames: string[]): Promise<Record<string, ArrayBuffer | null>> {
    const results: Record<string, ArrayBuffer | null> = {};
    
    const downloadPromises = fontNames.map(async (fontName) => {
      const buffer = await this.downloadFont(fontName);
      results[fontName] = buffer;
    });

    await Promise.all(downloadPromises);
    return results;
  }

  getCachedFont(fontName: string): ArrayBuffer | null {
    return this.cache[fontName] || null;
  }

  getAvailableFontUrls(): string[] {
    return Object.keys(fontUrls);
  }

  clearCache(): void {
    this.cache = {};
    this.downloadPromises.clear();
  }
}

export const fontDownloadManager = new FontDownloadManager();

export async function downloadEssentialFonts(): Promise<Record<string, ArrayBuffer | null>> {
  const essentialFonts = [
    "Arial", "Helvetica", "Times New Roman", "Courier New", 
    "Roboto", "Open Sans", "Lato", "Montserrat", "Inter"
  ];
  
  console.log('Downloading essential fonts for PDF export...');
  return await fontDownloadManager.downloadMultipleFonts(essentialFonts);
}