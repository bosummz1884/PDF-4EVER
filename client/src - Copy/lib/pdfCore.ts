import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';
import { pdfjs } from 'pdfjs-dist';

export interface TextElement {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  page: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  rotation: number;
}

export interface FormField {
  id: string;
  fieldName: string;
  fieldType: string;
  rect: number[];
  value: string;
  options?: string[];
  radioGroup?: string;
  page: number;
  required?: boolean;
}

export interface AnnotationElement {
  id: string;
  type: 'highlight' | 'rectangle' | 'circle' | 'freeform' | 'signature';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  page: number;
  strokeWidth?: number;
  points?: number[];
}

export class PDFCore {
  private static instance: PDFCore;
  private workerInitialized = false;

  static getInstance(): PDFCore {
    if (!PDFCore.instance) {
      PDFCore.instance = new PDFCore();
    }
    return PDFCore.instance;
  }

  async initializeWorker(): Promise<void> {
    if (this.workerInitialized) return;

    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
    this.workerInitialized = true;
  }

  async loadPDF(file: File | ArrayBuffer): Promise<any> {
    await this.initializeWorker();
    
    const data = file instanceof File ? await file.arrayBuffer() : file;
    return await pdfjs.getDocument({ data }).promise;
  }

  async renderPage(
    pdfDoc: any, 
    pageNum: number, 
    canvas: HTMLCanvasElement, 
    scale: number = 1.5
  ): Promise<void> {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const context = canvas.getContext('2d');
    
    if (!context) throw new Error('Canvas context not available');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport }).promise;
  }

  async detectFormFields(pdfDoc: any, pageNum: number): Promise<FormField[]> {
    const page = await pdfDoc.getPage(pageNum);
    const annotations = await page.getAnnotations();
    
    return annotations
      .filter((a: any) => a.subtype === "Widget")
      .map((a: any, index: number) => ({
        id: a.id || `field_${pageNum}_${index}`,
        fieldName: a.fieldName || `field_${pageNum}_${index}`,
        fieldType: a.fieldType,
        rect: a.rect,
        value: a.fieldValue || a.buttonValue || "",
        options: a.options || [],
        radioGroup: a.radioButton ? a.fieldName : undefined,
        page: pageNum,
        required: a.required || false
      }));
  }

  async extractTextContent(pdfDoc: any, pageNum?: number): Promise<string> {
    let allText = '';
    const numPages = pageNum ? 1 : pdfDoc.numPages;
    const startPage = pageNum || 1;
    const endPage = pageNum || pdfDoc.numPages;

    for (let i = startPage; i <= endPage; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      allText += pageText + '\n';
    }

    return allText.trim();
  }

  hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  }

  async getFontForFamily(pdfDoc: PDFDocument, fontFamily: string): Promise<PDFFont> {
    const fontMap: { [key: string]: any } = {
      'Helvetica': StandardFonts.Helvetica,
      'Arial': StandardFonts.Helvetica,
      'Times': StandardFonts.TimesRoman,
      'Times-Roman': StandardFonts.TimesRoman,
      'Times New Roman': StandardFonts.TimesRoman,
      'Courier': StandardFonts.Courier,
      'Courier New': StandardFonts.Courier
    };

    const standardFont = fontMap[fontFamily] || StandardFonts.Helvetica;
    return await pdfDoc.embedFont(standardFont);
  }

  async addTextElementsToPDF(
    pdfData: ArrayBuffer,
    textElements: TextElement[]
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();

    for (const element of textElements) {
      const page = pages[element.page - 1];
      if (!page) continue;

      const { height: pageHeight } = page.getSize();
      const font = await this.getFontForFamily(pdfDoc, element.fontFamily);
      const color = this.hexToRgb(element.color);

      const x = element.x;
      const y = pageHeight - element.y - element.fontSize;

      page.drawText(element.text, {
        x: Math.max(0, x),
        y: Math.max(0, y),
        size: element.fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        rotate: { type: 'degrees', angle: element.rotation }
      });
    }

    return await pdfDoc.save();
  }

  async fillFormFields(
    pdfData: ArrayBuffer,
    formFields: FormField[]
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfData);
    const form = pdfDoc.getForm();

    for (const field of formFields) {
      try {
        switch (field.fieldType) {
          case 'Tx': // Text field
            const textField = form.getTextField(field.fieldName);
            textField.setText(field.value);
            break;
          
          case 'Btn': // Button/Checkbox
            if (field.radioGroup) {
              const radioGroup = form.getRadioGroup(field.radioGroup);
              if (field.value === 'Yes') {
                radioGroup.select(field.fieldName);
              }
            } else {
              const checkBox = form.getCheckBox(field.fieldName);
              if (field.value === 'Yes') {
                checkBox.check();
              } else {
                checkBox.uncheck();
              }
            }
            break;
          
          case 'Ch': // Choice field (dropdown)
            const dropdown = form.getDropdown(field.fieldName);
            dropdown.select(field.value);
            break;
        }
      } catch (error) {
        console.warn(`Failed to fill field ${field.fieldName}:`, error);
      }
    }

    // Flatten the form to make it non-editable
    form.flatten();
    return await pdfDoc.save();
  }

  async addAnnotationsToPDF(
    pdfData: ArrayBuffer,
    annotations: AnnotationElement[]
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();

    for (const annotation of annotations) {
      const page = pages[annotation.page - 1];
      if (!page) continue;

      const { height: pageHeight } = page.getSize();
      const color = this.hexToRgb(annotation.color);
      const y = pageHeight - annotation.y - annotation.height;

      switch (annotation.type) {
        case 'rectangle':
          page.drawRectangle({
            x: annotation.x,
            y,
            width: annotation.width,
            height: annotation.height,
            borderColor: rgb(color.r, color.g, color.b),
            borderWidth: annotation.strokeWidth || 2
          });
          break;

        case 'circle':
          page.drawEllipse({
            x: annotation.x + annotation.width / 2,
            y: y + annotation.height / 2,
            xScale: annotation.width / 2,
            yScale: annotation.height / 2,
            borderColor: rgb(color.r, color.g, color.b),
            borderWidth: annotation.strokeWidth || 2
          });
          break;

        case 'highlight':
          page.drawRectangle({
            x: annotation.x,
            y,
            width: annotation.width,
            height: annotation.height,
            color: rgb(color.r, color.g, color.b, 0.3)
          });
          break;
      }
    }

    return await pdfDoc.save();
  }

  async mergePDFs(pdfFiles: ArrayBuffer[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    for (const pdfData of pdfFiles) {
      const pdf = await PDFDocument.load(pdfData);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    return await mergedPdf.save();
  }

  async splitPDF(pdfData: ArrayBuffer, pageRanges: number[][]): Promise<Uint8Array[]> {
    const originalPdf = await PDFDocument.load(pdfData);
    const splitPdfs: Uint8Array[] = [];

    for (const range of pageRanges) {
      const newPdf = await PDFDocument.create();
      const pageIndices = range.map(pageNum => pageNum - 1); // Convert to 0-based
      const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));
      
      const pdfBytes = await newPdf.save();
      splitPdfs.push(pdfBytes);
    }

    return splitPdfs;
  }

  async rotatePDF(pdfData: ArrayBuffer, pageNum: number, degrees: number): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();
    const page = pages[pageNum - 1];
    
    if (page) {
      page.setRotation({ type: 'degrees', angle: degrees });
    }

    return await pdfDoc.save();
  }

  async compressPDF(pdfData: ArrayBuffer): Promise<Uint8Array> {
    // Basic compression by re-saving the PDF
    const pdfDoc = await PDFDocument.load(pdfData);
    return await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false
    });
  }

  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async exportWithAllElements(
    originalPdfData: ArrayBuffer,
    textElements: TextElement[],
    formFields: FormField[],
    annotations: AnnotationElement[]
  ): Promise<Uint8Array> {
    let pdfBytes = new Uint8Array(originalPdfData);

    // Add text elements first
    if (textElements.length > 0) {
      pdfBytes = await this.addTextElementsToPDF(pdfBytes, textElements);
    }

    // Fill form fields
    if (formFields.length > 0) {
      pdfBytes = await this.fillFormFields(pdfBytes, formFields);
    }

    // Add annotations last
    if (annotations.length > 0) {
      pdfBytes = await this.addAnnotationsToPDF(pdfBytes, annotations);
    }

    return pdfBytes;
  }
}

export const pdfCore = PDFCore.getInstance();