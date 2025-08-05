// client/src/lib/pdfWorker.ts
import * as pdfjsLib from "pdfjs-dist";

// This is now a simple, reliable path because the build script
// ensures the file is at the root of the public assets.
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

console.log(
  "PDF.js worker configured with a static path:",
  pdfjsLib.GlobalWorkerOptions.workerSrc
);

export { pdfjsLib };
