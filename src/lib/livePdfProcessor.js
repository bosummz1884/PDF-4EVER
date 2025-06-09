import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

class LivePdfProcessor {
  constructor() {
    this.pdfDoc = null;
    this.originalPdfBytes = null;
    this.currentPdfBytes = null;
    this.pages = [];
    this.annotations = [];
    this.textElements = [];
    this.listeners = [];
    this.isProcessing = false;
  }

  async loadPdf(file) {
    try {
      this.isProcessing = true;
      this.notifyListeners('processing', true);

      // Store original PDF bytes
      this.originalPdfBytes = await file.arrayBuffer();
      this.currentPdfBytes = this.originalPdfBytes.slice();

      // Load PDF with pdf-lib for editing
      this.pdfDoc = await PDFDocument.load(this.originalPdfBytes);
      this.pages = this.pdfDoc.getPages();

      // Load PDF with PDF.js for rendering
      const loadingTask = pdfjsLib.getDocument(this.currentPdfBytes);
      const pdfDoc = await loadingTask.promise;

      this.isProcessing = false;
      this.notifyListeners('processing', false);
      this.notifyListeners('loaded', { pageCount: this.pages.length });

      return {
        success: true,
        pageCount: this.pages.length,
        pdfDoc: this.pdfDoc
      };
    } catch (error) {
      this.isProcessing = false;
      this.notifyListeners('processing', false);
      this.notifyListeners('error', error.message);
      throw error;
    }
  }

  async addText(pageIndex, text, x, y, options = {}) {
    if (!this.pdfDoc || this.isProcessing) return;

    try {
      this.isProcessing = true;
      this.notifyListeners('processing', true);

      const page = this.pages[pageIndex];
      if (!page) throw new Error('Invalid page index');

      const font = await this.pdfDoc.embedFont(StandardFonts[options.font] || StandardFonts.Helvetica);
      const fontSize = options.size || 12;
      const color = options.color ? this.hexToRgb(options.color) : rgb(0, 0, 0);

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color,
      });

      // Store text element for future reference
      this.textElements.push({
        pageIndex,
        text,
        x,
        y,
        options,
        id: Date.now() + Math.random()
      });

      await this.updatePdfBytes();
      this.isProcessing = false;
      this.notifyListeners('processing', false);
      this.notifyListeners('textAdded', { pageIndex, text, x, y });

      return true;
    } catch (error) {
      this.isProcessing = false;
      this.notifyListeners('processing', false);
      this.notifyListeners('error', error.message);
      throw error;
    }
  }

  async addAnnotation(pageIndex, annotation) {
    if (!this.pdfDoc || this.isProcessing) return;

    try {
      this.isProcessing = true;
      this.notifyListeners('processing', true);

      const page = this.pages[pageIndex];
      if (!page) throw new Error('Invalid page index');

      // Handle different annotation types
      switch (annotation.type) {
        case 'highlight':
          await this.addHighlight(page, annotation);
          break;
        case 'rectangle':
          await this.addRectangle(page, annotation);
          break;
        case 'line':
          await this.addLine(page, annotation);
          break;
        default:
          throw new Error('Unsupported annotation type');
      }

      this.annotations.push({
        ...annotation,
        pageIndex,
        id: Date.now() + Math.random()
      });

      await this.updatePdfBytes();
      this.isProcessing = false;
      this.notifyListeners('processing', false);
      this.notifyListeners('annotationAdded', { pageIndex, annotation });

      return true;
    } catch (error) {
      this.isProcessing = false;
      this.notifyListeners('processing', false);
      this.notifyListeners('error', error.message);
      throw error;
    }
  }

  async addHighlight(page, annotation) {
    const { x, y, width, height, color } = annotation;
    const highlightColor = color ? this.hexToRgb(color) : rgb(1, 1, 0);
    
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: highlightColor,
      opacity: 0.3,
    });
  }

  async addRectangle(page, annotation) {
    const { x, y, width, height, color, borderColor } = annotation;
    const fillColor = color ? this.hexToRgb(color) : rgb(0, 0, 1);
    const strokeColor = borderColor ? this.hexToRgb(borderColor) : rgb(0, 0, 0);

    page.drawRectangle({
      x,
      y,
      width,
      height,
      borderColor: strokeColor,
      borderWidth: 2,
      color: fillColor,
      opacity: 0.5,
    });
  }

  async addLine(page, annotation) {
    const { x1, y1, x2, y2, color } = annotation;
    const lineColor = color ? this.hexToRgb(color) : rgb(0, 0, 0);

    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: 2,
      color: lineColor,
    });
  }

  async deletePage(pageIndex) {
    if (!this.pdfDoc || this.isProcessing) return;

    try {
      this.isProcessing = true;
      this.notifyListeners('processing', true);

      if (this.pages.length <= 1) {
        throw new Error('Cannot delete the last page');
      }

      this.pdfDoc.removePage(pageIndex);
      this.pages = this.pdfDoc.getPages();

      // Remove annotations and text elements for deleted page
      this.annotations = this.annotations.filter(ann => ann.pageIndex !== pageIndex);
      this.textElements = this.textElements.filter(elem => elem.pageIndex !== pageIndex);

      // Update page indices for elements after deleted page
      this.annotations.forEach(ann => {
        if (ann.pageIndex > pageIndex) ann.pageIndex--;
      });
      this.textElements.forEach(elem => {
        if (elem.pageIndex > pageIndex) elem.pageIndex--;
      });

      await this.updatePdfBytes();
      this.isProcessing = false;
      this.notifyListeners('processing', false);
      this.notifyListeners('pageDeleted', { pageIndex });

      return true;
    } catch (error) {
      this.isProcessing = false;
      this.notifyListeners('processing', false);
      this.notifyListeners('error', error.message);
      throw error;
    }
  }

  async insertBlankPage(afterPageIndex) {
    if (!this.pdfDoc || this.isProcessing) return;

    try {
      this.isProcessing = true;
      this.notifyListeners('processing', true);

      const referencePageIndex = Math.min(afterPageIndex, this.pages.length - 1);
      const referencePage = this.pages[referencePageIndex];
      const { width, height } = referencePage.getSize();

      this.pdfDoc.insertPage(afterPageIndex + 1, [width, height]);
      this.pages = this.pdfDoc.getPages();

      // Update page indices for elements after inserted page
      this.annotations.forEach(ann => {
        if (ann.pageIndex > afterPageIndex) ann.pageIndex++;
      });
      this.textElements.forEach(elem => {
        if (elem.pageIndex > afterPageIndex) elem.pageIndex++;
      });

      await this.updatePdfBytes();
      this.isProcessing = false;
      this.notifyListeners('processing', false);
      this.notifyListeners('pageInserted', { afterPageIndex });

      return true;
    } catch (error) {
      this.isProcessing = false;
      this.notifyListeners('processing', false);
      this.notifyListeners('error', error.message);
      throw error;
    }
  }

  async updatePdfBytes() {
    if (!this.pdfDoc) return;
    this.currentPdfBytes = await this.pdfDoc.save();
    this.notifyListeners('updated', this.currentPdfBytes);
  }

  async exportPdf() {
    if (!this.currentPdfBytes) return null;
    return this.currentPdfBytes;
  }

  reset() {
    if (!this.originalPdfBytes) return;
    
    this.currentPdfBytes = this.originalPdfBytes.slice();
    this.annotations = [];
    this.textElements = [];
    
    // Reload the original PDF
    this.loadPdf(new Blob([this.originalPdfBytes], { type: 'application/pdf' }));
  }

  // Event listener management
  addEventListener(event, callback) {
    this.listeners.push({ event, callback });
  }

  removeEventListener(event, callback) {
    this.listeners = this.listeners.filter(
      listener => !(listener.event === event && listener.callback === callback)
    );
  }

  notifyListeners(event, data) {
    this.listeners
      .filter(listener => listener.event === event)
      .forEach(listener => listener.callback(data));
  }

  // Utility functions
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? rgb(
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ) : rgb(0, 0, 0);
  }

  getStatus() {
    return {
      isProcessing: this.isProcessing,
      hasDocument: !!this.pdfDoc,
      pageCount: this.pages.length,
      annotationCount: this.annotations.length,
      textElementCount: this.textElements.length
    };
  }
}

export default LivePdfProcessor;