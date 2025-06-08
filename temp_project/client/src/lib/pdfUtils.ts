// src/lib/pdfUtils.ts
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/** === FORM UTILITIES === */
export async function fillPdfForm(pdfBytes: Uint8Array, formData: Record<string, any> = {}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  Object.entries(formData).forEach(([fieldName, value]) => {
    const field = form.getFieldMaybe(fieldName);
    if (field && 'setText' in field) {
      (field as any).setText(String(value));
    }
  });

  return await pdfDoc.save();
}

export async function fillPdfFormWithCheckboxes(pdfBytes: Uint8Array, formData: Record<string, any> = {}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  Object.entries(formData).forEach(([fieldName, value]) => {
    const field = form.getFieldMaybe(fieldName);
    if (field) {
      if (field.constructor.name === 'PDFCheckBox') {
        (field as any).check(value);
      } else if ('setText' in field) {
        (field as any).setText(String(value));
      }
    }
  });

  return await pdfDoc.save();
}

export async function detectFormFields(pdfBytes: Uint8Array): Promise<Array<{ name: string; type: string }>> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  return fields.map((field) => ({
    name: field.getName(),
    type: field.constructor.name
  }));
}

/** === PAGE MANIPULATION === */
export async function extractPagesFromPdf(pdfBytes: Uint8Array, pageIndices: number[] = []): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(pdfBytes);
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(sourcePdf, pageIndices);
  pages.forEach((page) => newPdf.addPage(page));
  return await newPdf.save();
}

export async function reorderPdfPages(pdfBytes: Uint8Array, newOrder: number[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const reorderedPdf = await PDFDocument.create();
  const copiedPages = await reorderedPdf.copyPages(pdfDoc, newOrder);
  copiedPages.forEach((page) => reorderedPdf.addPage(page));
  return await reorderedPdf.save();
}

export async function removePdfPages(pdfBytes: Uint8Array, pageIndicesToRemove: number[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();
  const keepIndices = Array.from({ length: totalPages }, (_, i) => i).filter(
    (i) => !pageIndicesToRemove.includes(i)
  );
  return await reorderPdfPages(pdfBytes, keepIndices);
}

/** === MERGE === */
export async function appendPdf(originalPdfBytes: Uint8Array, pdfToAddBytes: Uint8Array): Promise<Uint8Array> {
  const mainPdf = await PDFDocument.load(originalPdfBytes);
  const additionalPdf = await PDFDocument.load(pdfToAddBytes);
  const copiedPages = await mainPdf.copyPages(additionalPdf, additionalPdf.getPageIndices());
  copiedPages.forEach((page) => mainPdf.addPage(page));
  return await mainPdf.save();
}

export async function mergePDFs(pdfBuffers: Uint8Array[]): Promise<Uint8Array> {
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
  pdfBytes: Uint8Array,
  signatureDataUrl: string,
  options: { pageIndex?: number; x?: number; y?: number; width?: number; height?: number } = {}
): Promise<Uint8Array> {
  const { pageIndex = 0, x = 50, y = 50, width = 200, height = 100 } = options;
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pngImage = await pdfDoc.embedPng(signatureDataUrl);
  const pages = pdfDoc.getPages();
  const page = pages[pageIndex];
  page.drawImage(pngImage, { x, y, width, height });
  return await pdfDoc.save();
}

/** === INVOICE GENERATION === */
export async function generateInvoicePdf(options: { 
  clientName: string; 
  items: Array<{ name: string; amount: number }> 
}): Promise<Uint8Array> {
  const { clientName, items } = options;
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
export async function addPasswordToPdf(pdfBytes: Uint8Array, password: string): Promise<never> {
  throw new Error("pdf-lib does not support password protection. Use qpdf or paid PDF API.");
}

export async function highlightTextInPdf(
  pdfBytes: Uint8Array, 
  searchText: string = "", 
  highlightColor = rgb(1, 1, 0)
): Promise<never> {
  throw new Error("pdf-lib cannot highlight text by content natively. Use OCR/pdf.js with annotations.");
}

/** === EDIT HISTORY === */
export class EditAction<T> {
  readonly previousState: T;
  readonly newState: T;

  constructor(previousState: T, newState: T) {
    this.previousState = previousState;
    this.newState = newState;
  }
}

export class EditHistory<T> {
  private readonly _undoStack: EditAction<T>[] = [];
  private readonly _redoStack: EditAction<T>[] = [];

  recordChange(oldState: T, newState: T): void {
    this._undoStack.push(new EditAction(oldState, newState));
    this._redoStack.length = 0; // Clear redo stack
  }

  undo(currentState: T): T | null {
    if (this._undoStack.length === 0) return null;
    const last = this._undoStack.pop()!;
    this._redoStack.push(new EditAction(last.newState, last.previousState));
    return last.previousState;
  }

  redo(currentState: T): T | null {
    if (this._redoStack.length === 0) return null;
    const next = this._redoStack.pop()!;
    this._undoStack.push(new EditAction(next.newState, next.previousState));
    return next.previousState;
  }

  clear(): void {
    this._undoStack.length = 0;
    this._redoStack.length = 0;
  }

  get canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this._redoStack.length > 0;
  }
}