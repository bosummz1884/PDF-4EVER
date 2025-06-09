import { PDFDocument } from 'pdf-lib';

export async function deletePage(pdfBytes, pageIndex) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  
  if (pageIndex >= 0 && pageIndex < pages.length && pages.length > 1) {
    pdfDoc.removePage(pageIndex);
  }
  
  return await pdfDoc.save();
}

export async function insertBlankPage(pdfBytes, afterPageIndex) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  
  if (pages.length > 0) {
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    pdfDoc.insertPage(afterPageIndex, [width, height]);
  }
  
  return await pdfDoc.save();
}

export async function reorderPages(pdfBytes, newOrder) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  
  // Create new document with pages in new order
  const newDoc = await PDFDocument.create();
  
  for (const pageIndex of newOrder) {
    if (pageIndex >= 0 && pageIndex < pages.length) {
      const [copiedPage] = await newDoc.copyPages(pdfDoc, [pageIndex]);
      newDoc.addPage(copiedPage);
    }
  }
  
  return await newDoc.save();
}