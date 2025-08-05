declare module 'pdfjs-dist/build/pdf.worker.mjs?worker' {
  const workerFactory: new () => Worker;
  export default workerFactory;
}
