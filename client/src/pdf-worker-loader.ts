// This ensures Vite directly imports the latest worker from node_modules
export default new Worker("pdfjs-dist/build/pdf.worker.mjs?worker");
