// client/src/lib/pdfWorker.ts
import * as pdfjsLib from "pdfjs-dist";

// This is the most robust way.
// The `?worker` suffix tells Vite to create a proper web worker constructor.
import PdfjsWorker from "pdfjs-dist/build/pdf.worker.min.js?worker";

// We create a new worker instance ourselves.
const worker = new PdfjsWorker();

// Instead of providing a URL string (workerSrc), we provide the actual
// running worker object. PDF.js will then communicate with it directly.
// This completely avoids all URL path and server MIME type issues.
pdfjsLib.GlobalWorkerOptions.workerPort = worker;

console.log("PDF.js worker configured using a direct worker instance.");

export { pdfjsLib };
