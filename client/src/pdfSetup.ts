import * as pdfjsLib from 'pdfjs-dist';
import Worker from 'pdfjs-dist/build/pdf.worker.mjs?worker';

pdfjsLib.GlobalWorkerOptions.workerPort = new Worker();
