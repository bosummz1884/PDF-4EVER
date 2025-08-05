// src/lib/pdfWorker.ts
import * as pdfjsLib from "pdfjs-dist";

// By importing the worker entry file, Vite will bundle it and provide the correct path.
// This is the modern and recommended approach for using pdf.js with bundlers.
import pdfWorker from "pdfjs-dist/build/pdf.worker.entry";

// Set the worker source to the imported module.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// The rest of your application can now use pdfjsLib as usual.
// You no longer need the manual initialization logic.
console.log("PDF.js worker configured successfully using bundled entry.");

export { pdfjsLib };
