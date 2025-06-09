// src/utils/pdfUtils.js
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/** === FORM UTILITIES === */
export async function fillPdfForm(pdfBytes, formData = {}) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  Object.entries(formData).forEach(([fieldName, value]) => {
    const field = form.getFieldMaybe(fieldName);
    if (field) field.setText(String(value));
  });

  return await pdfDoc.save();
}

export async function fillPdfFormWithCheckboxes(pdfBytes, formData = {}) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  Object.entries(formData).forEach(([fieldName, value]) => {
    const field = form.getFieldMaybe(fieldName);
    if (field) {
      if (field.constructor.name === 'PDFCheckBox') {
        field.check(value);
      } else {
        field.setText(String(value));
      }
    }
  });

  return await pdfDoc.save();
}

export async function detectFormFields(pdfBytes) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  return fields.map((field) => ({
    name: field.getName(),
    type: field.constructor.name
  }));
}

/** === PAGE MANIPULATION === */
export async function extractPagesFromPdf(pdfBytes, pageIndices = []) {
  const sourcePdf = await PDFDocument.load(pdfBytes);
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(sourcePdf, pageIndices);
  pages.forEach((page) => newPdf.addPage(page));
  return await newPdf.save();
}

export async function reorderPdfPages(pdfBytes, newOrder) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const reorderedPdf = await PDFDocument.create();
  const copiedPages = await reorderedPdf.copyPages(pdfDoc, newOrder);
  copiedPages.forEach((page) => reorderedPdf.addPage(page));
  return await reorderedPdf.save();
}

export async function removePdfPages(pdfBytes, pageIndicesToRemove) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();
  const keepIndices = Array.from({ length: totalPages }, (_, i) => i).filter(
    (i) => !pageIndicesToRemove.includes(i)
  );
  return await reorderPdfPages(pdfBytes, keepIndices);
}

/** === MERGE === */
export async function appendPdf(originalPdfBytes, pdfToAddBytes) {
  const mainPdf = await PDFDocument.load(originalPdfBytes);
  const additionalPdf = await PDFDocument.load(pdfToAddBytes);
  const copiedPages = await mainPdf.copyPages(additionalPdf, additionalPdf.getPageIndices());
  copiedPages.forEach((page) => mainPdf.addPage(page));
  return await mainPdf.save();
}

export async function mergePDFs(pdfBuffers) {
  const mergedPdf = await PDFDocument.create();
  for (const pdfBuffer of pdfBuffers) {
    const pdf = await PDFDocument.load(pdfBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  return await mergedPdf.save();
}

/** === SIGNATURES === */
export async function addSignatureToPdf(
  pdfBytes,
  signatureDataUrl,
  { pageIndex = 0, x = 50, y = 50, width = 200, height = 100 }
) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pngImage = await pdfDoc.embedPng(signatureDataUrl);
  const pages = pdfDoc.getPages();
  const page = pages[pageIndex];
  page.drawImage(pngImage, { x, y, width, height });
  return await pdfDoc.save();
}

/** === INVOICE GENERATION === */
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

/** === UNSUPPORTED PLACEHOLDERS === */
export async function addPasswordToPdf(pdfBytes, password) {
  throw new Error("pdf-lib does not support password protection. Use qpdf or paid PDF API.");
}

export async function highlightTextInPdf(pdfBytes, searchText = "", highlightColor = rgb(1, 1, 0)) {
  throw new Error("pdf-lib cannot highlight text by content natively. Use OCR/pdf.js with annotations.");
}

/** === EDIT HISTORY === */
export class EditAction {
  constructor(previousState, newState) {
    this.previousState = previousState;
    this.newState = newState;
  }
}

export class EditHistory {
  constructor() {
    this._undoStack = [];
    this._redoStack = [];
  }

  recordChange(oldState, newState) {
    this._undoStack.push(new EditAction(oldState, newState));
    this._redoStack = [];
  }

  undo(currentState) {
    if (!this._undoStack.length) return null;
    const last = this._undoStack.pop();
    this._redoStack.push(new EditAction(last.newState, last.previousState));
    return last.previousState;
  }

  redo(currentState) {
    if (!this._redoStack.length) return null;
    const next = this._redoStack.pop();
    this._undoStack.push(new EditAction(next.newState, next.previousState));
    return next.previousState;
  }

  clear() {
    this._undoStack = [];
    this._redoStack = [];
  }

  get canUndo() {
    return this._undoStack.length > 0;
  }

  get canRedo() {
    return this._redoStack.length > 0;
  }
}
