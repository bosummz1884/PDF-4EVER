import React, { useEffect } from 'react';
import { usePDFEditor } from '../../PDFEditorContext';
import { useAnnotations } from '../../hooks/useAnnotations';

export default function AnnotationLayer() {
  const { 
    currentTool,
    annotationCanvasRef,
    currentPage
  } = usePDFEditor();
  
  const { 
    annotations,
    startDrawing,
    continueDrawing,
    finishDrawing,
    selectedAnnotation,
    setSelectedAnnotation,
    drawAnnotations
  } = useAnnotations();

  // Redraw annotations when they change or page changes
  useEffect(() => {
    drawAnnotations();
  }, [annotations, currentPage, drawAnnotations]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!['select', 'text', 'eraser', 'whiteout', 'form'].includes(currentTool)) {
      const rect = annotationCanvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        startDrawing(x, y, currentTool);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = annotationCanvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      continueDrawing(x, y);
    }
  };

  const handleMouseUp = () => {
    finishDrawing();
  };

  const handleMouseLeave = () => {
    finishDrawing();
  };

  return (
    <div 
      className="annotation-layer absolute inset-0 z-10"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ pointerEvents: ['select', 'text', 'eraser', 'whiteout', 'form'].includes(currentTool) ? 'none' : 'auto' }}
    />
  );
}