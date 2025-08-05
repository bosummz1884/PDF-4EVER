// src/lib/pdfWorker.ts
import * as pdfjsLib from "pdfjs-dist";

// This special "?url" import is a Vite directive.
// It tells Vite to find the worker file in your node_modules,
// bundle it, and give you back a URL that is guaranteed to be served correctly.
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";

// Configure PDF.js to use the valid URL that Vite provides.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// This will confirm that Vite is now managing the worker path.
console.log(
  "PDF.js worker configured by Vite with source:",
  pdfjsLib.GlobalWorkerOptions.workerSrc
);

export { pdfjsLib };
