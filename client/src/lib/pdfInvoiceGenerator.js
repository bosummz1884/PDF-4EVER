import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateInvoicePdf({ clientName, items }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;

  let y = 750;
  page.drawText(`Invoice for: ${clientName}`, {
    x: 50,
    y,
    size: 16,
    font,
    color: rgb(0, 0, 0),
  });

  y -= 40;
  items.forEach((item, i) => {
    page.drawText(`${i + 1}. ${item.name} - $${item.amount.toFixed(2)}`, {
      x: 50,
      y,
      size: fontSize,
      font,
    });
    y -= 20;
  });

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  y -= 30;
  page.drawText(`Total: $${total.toFixed(2)}`, {
    x: 50,
    y,
    size: 14,
    font,
    color: rgb(0.2, 0.2, 0.8),
  });

  return await pdfDoc.save();
}