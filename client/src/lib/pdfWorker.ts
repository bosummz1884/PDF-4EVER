// src/lib/pdfWorker.ts
import * as pdfjsLib from "pdfjs-dist";

// Change the filename here to point to the minified version.
const workerSrc = "/pdf.worker.min.js";

// The rest of the configuration remains exactly the same.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

console.log(
  "PDF.js worker manually initialized with minified source:",
  pdfjsLib.GlobalWorkerOptions.workerSrc
);

export { pdfjsLib };
