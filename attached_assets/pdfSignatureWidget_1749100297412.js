import { PDFDocument, rgb } from "pdf-lib";

/**
 * Places a signature image on a specified PDF page.
 * @param {Uint8Array} pdfBytes - The original PDF document.
 * @param {string} signatureDataUrl - Base64 PNG image of the signature.
 * @param {Object} options - Signature options.
 * @param {number} options.pageIndex - Index of the page to place the signature.
 * @param {number} options.x - X position on the page.
 * @param {number} options.y - Y position on the page.
 * @param {number} options.width - Width of the signature image.
 * @param {number} options.height - Height of the signature image.
 * @returns {Uint8Array} Updated PDF bytes.
 */
export async function addSignatureToPdf(
  pdfBytes,
  signatureDataUrl,
  { pageIndex = 0, x = 50, y = 50, width = 200, height = 100 }
) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pngImage = await pdfDoc.embedPng(signatureDataUrl);
  const pages = pdfDoc.getPages();
  const page = pages[pageIndex];

  page.drawImage(pngImage, {
    x,
    y,
    width,
    height,
  });

  return await pdfDoc.save();
}
