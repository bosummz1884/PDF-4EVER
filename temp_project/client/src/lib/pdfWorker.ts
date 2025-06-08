// Configure PDF.js worker
import * as pdfjsLib from 'pdfjs-dist';

// Use local worker file provided by user
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

export { pdfjsLib };