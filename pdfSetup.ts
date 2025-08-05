// pdfSetup.ts
import { pdfjs-dist } from "pdfjs-dist"; // or directly from 'pdfjs-dist' if you're not using react-pdf

import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?worker";

pdfjs.GlobalWorkerOptions.workerPort = new pdfWorker();
