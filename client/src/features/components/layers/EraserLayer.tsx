import React, { useState, useEffect } from 'react';
import { usePDFEditor } from '../../PDFEditorContext';
import { useAnnotations } from '../../hooks/useAnnotations';

export default function EraserLayer() {
  const { 
    currentTool, 
    annotationCanvasRef
  } = usePDFEditor();
  
  const { eraseAnnotationsAt } = useAnnotations();
  
  const [eraserPosition, setEraserPosition] = useState({ x: 0, y: 0 });
  const [eraserSize, setEraserSize] = useState(20);
  const [isErasing, setIsErasing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentTool !== 'eraser') return;
    
    const rect = annotationCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setEraserPosition({ x, y });
    setIsErasing(true);
    eraseAnnotationsAt(x, y, eraserSize);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = annotationCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setEraserPosition({ x, y });
    
    if (isErasing && currentTool === 'eraser') {
      eraseAnnotationsAt(x, y, eraserSize);
    }
  };

  const handleMouseUp = () => {
    setIsErasing(false);
  };

  const handleMouseLeave = () => {
    setIsErasing(false);
  };

  // Only show eraser cursor when eraser tool is active
  if (currentTool !== 'eraser') return null;

  return (
    <div 
      className="eraser-layer absolute inset-0 z-30"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: 'none' }}
    >
      {/* Eraser cursor visualization */}
      <div
        className="eraser-cursor absolute rounded-full border-2 border-black bg-white bg-opacity-50 pointer-events-none"
        style={{
          left: `${eraserPosition.x - eraserSize/2}px`,
          top: `${eraserPosition.y - eraserSize/2}px`,
          width: `${eraserSize}px`,
          height: `${eraserSize}px`,
        }}
      />
    </div>
  );
}