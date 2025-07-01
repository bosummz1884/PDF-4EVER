import React, { useState } from 'react';
import { usePDFEditor } from '../../PDFEditorContext';
import { useWhiteout } from '../../hooks/useWhiteout';
import { WhiteoutBlock } from '@/types/pdf-types';

export default function WhiteoutLayer() {
  const { 
    currentTool, 
    canvasRef,
    currentPage
  } = usePDFEditor();
  
  const {
    whiteoutBlocks,
    addWhiteoutBlock,
    updateWhiteoutBlock,
    deleteWhiteoutBlock,
    selectedWhiteoutBlock,
    setSelectedWhiteoutBlock
  } = useWhiteout();

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentTool !== 'whiteout') return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPoint({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || currentTool !== 'whiteout') return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Create or update temporary whiteout block
    const tempBlock: WhiteoutBlock = {
      id: 'temp-whiteout',
      x: Math.min(startPoint.x, x),
      y: Math.min(startPoint.y, y),
      width: Math.abs(x - startPoint.x),
      height: Math.abs(y - startPoint.y),
      page: currentPage
    };
    
    // Update UI to show the temporary block
    // This could be done with a temporary state or by updating a ref
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || currentTool !== 'whiteout') return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Only add if it has some size
    if (Math.abs(x - startPoint.x) > 5 && Math.abs(y - startPoint.y) > 5) {
      const newBlock: WhiteoutBlock = {
        id: `whiteout-${Date.now()}`,
        x: Math.min(startPoint.x, x),
        y: Math.min(startPoint.y, y),
        width: Math.abs(x - startPoint.x),
        height: Math.abs(y - startPoint.y),
        page: currentPage
      };
      
      addWhiteoutBlock(newBlock);
    }
    
    setIsDrawing(false);
  };

  // Filter whiteout blocks for current page
  const currentPageWhiteoutBlocks = whiteoutBlocks.filter(
    block => block.page === currentPage
  );

  return (
    <div 
      className="whiteout-layer absolute inset-0 z-15"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ pointerEvents: currentTool === 'whiteout' ? 'auto' : 'none' }}
    >
      {currentPageWhiteoutBlocks.map((block) => (
        <div
          key={block.id}
          className={`absolute whiteout-block ${selectedWhiteoutBlock === block.id ? 'selected' : ''}`}
          style={{
            left: `${block.x}px`,
            top: `${block.y}px`,
            width: `${block.width}px`,
            height: `${block.height}px`,
            backgroundColor: 'white',
            border: selectedWhiteoutBlock === block.id ? '1px dashed #0066cc' : '1px solid #e0e0e0'
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedWhiteoutBlock(block.id);
          }}
        />
      ))}
    </div>
  );
}