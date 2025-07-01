import React, { useEffect } from 'react';
import { usePDFEditor } from '../PDFEditorContext';
import AnnotationLayer from './layers/AnnotationLayer';
import AdvancedTextLayer from './layers/AdvancedTextLayer';
import WhiteoutLayer from './layers/WhiteoutLayer';
import EraserLayer from './layers/EraserLayer';

export default function PDFCanvas() {
  const { 
    canvasRef,
    annotationCanvasRef,
    currentTool,
    zoom,
    currentPage,
    totalPages
  } = usePDFEditor();

  return (
    <div className="pdf-canvas-container">
      {/* Main PDF rendering canvas */}
      <canvas 
        ref={canvasRef} 
        className="pdf-canvas"
      />
      
      {/* Annotation canvas overlay */}
      <canvas 
        ref={annotationCanvasRef}
        className="annotation-canvas"
      />
      
      {/* Additional layers */}
      <AnnotationLayer />
      <AdvancedTextLayer />
      <WhiteoutLayer />
      {currentTool === 'eraser' && <EraserLayer />}
      
      {/* Page navigation overlay */}
      <div className="page-navigation">
        <div className="page-counter">
          Page {currentPage} of {totalPages}
        </div>
      </div>
    </div>
  );
}