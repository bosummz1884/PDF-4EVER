// Static deployment configuration for Cloudflare Pages
export const STATIC_CONFIG = {
  // Disable server-side features for static deployment
  enableAuth: false,
  enableDatabase: false,
  enableServerRoutes: false,
  
  // Client-only PDF processing
  enableClientPDF: true,
  enableLocalStorage: true,
  enableFileSystemAPI: true,
  
  // Feature flags for static deployment
  features: {
    pdfEditing: true,
    textBoxes: true,
    annotations: true,
    whiteout: true,
    ocr: true,
    merge: true,
    split: true,
    export: true,
    localSave: true
  }
};

// Check if running in static environment
export const isStaticDeployment = () => {
  return typeof window !== 'undefined' && !window.location.hostname.includes('replit');
};

// Get appropriate storage for static deployment
export const getStaticStorage = () => {
  if (typeof window !== 'undefined') {
    return {
      setItem: (key: string, value: string) => localStorage.setItem(key, value),
      getItem: (key: string) => localStorage.getItem(key),
      removeItem: (key: string) => localStorage.removeItem(key),
      clear: () => localStorage.clear()
    };
  }
  return null;
};