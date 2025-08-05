// client/src/lib/pdfWorker.ts
import * as pdfjsLib from "pdfjs-dist";

// This tells Vite to treat the worker file as a dependency and provides a stable URL to it.
// This is the most robust method and avoids issues with build environments.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).href;

console.log(
  "PDF.js worker configured via new URL() with source:",
  pdfjsLib.GlobalWorkerOptions.workerSrc
);

export { pdfjsLib };
