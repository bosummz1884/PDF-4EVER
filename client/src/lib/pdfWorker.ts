// client/src/lib/pdfWorker.ts
import * as pdfjsLib from "pdfjs-dist";

// This imports the special entry point for bundlers like Vite.
// Vite will see this, bundle the worker correctly, and the `pdfWorker`
// variable will automatically contain the correct path string.
import pdfWorker from "pdfjs-dist/build/pdf.worker.entry.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

console.log("PDF.js worker configured using the bundler entry point.");

export { pdfjsLib };
