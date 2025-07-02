import React, { useState } from 'react';
import { WhiteoutBlock, WhiteoutLayerProps } from '@/types/pdf-types';

export default function WhiteoutLayer({
  whiteoutBlocks,
  setWhiteoutBlocks,
  isActive,
  currentPage,
  canvasRef,
  scale,
  page,
}: WhiteoutLayerProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [tempBlock, setTempBlock] = useState<WhiteoutBlock | null>(null);
  const [selectedWhiteoutBlock, setSelectedWhiteoutBlock] = useState<string | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    setStartPoint({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !isActive) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    setTempBlock({
      id: 'temp-whiteout',
      x: Math.min(startPoint.x, x),
      y: Math.min(startPoint.y, y),
      width: Math.abs(x - startPoint.x),
      height: Math.abs(y - startPoint.y),
      page: currentPage,
      color: '#ffffff',
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !isActive) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    if (Math.abs(x - startPoint.x) > 5 && Math.abs(y - startPoint.y) > 5) {
      const newBlock: WhiteoutBlock = {
        id: `whiteout-${Date.now()}`,
        x: Math.min(startPoint.x, x),
        y: Math.min(startPoint.y, y),
        width: Math.abs(x - startPoint.x),
        height: Math.abs(y - startPoint.y),
        page: currentPage,
        color: '#ffffff',
      };
      setWhiteoutBlocks(prev => [...prev, newBlock]);
    }
    setIsDrawing(false);
    setTempBlock(null);
  };

  const currentPageWhiteoutBlocks = whiteoutBlocks.filter(block => block.page === currentPage);
  return (
    <div
      className="whiteout-layer absolute inset-0 z-15"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ pointerEvents: isActive ? 'auto' : 'none' }}
    >
      {currentPageWhiteoutBlocks.map((block) => (
        <div
          key={block.id}
          className={`absolute whiteout-block ${selectedWhiteoutBlock === block.id ? 'selected' : ''}`}
          style={{
            left: `${block.x * scale}px`,
            top: `${block.y * scale}px`,
            width: `${block.width * scale}px`,
            height: `${block.height * scale}px`,
            backgroundColor: 'white',
            border: selectedWhiteoutBlock === block.id ? '1px dashed #0066cc' : '1px solid #e0e0e0',
            zIndex: 20,
          }}
          onClick={e => {
            e.stopPropagation();
            setSelectedWhiteoutBlock(block.id);
          }}
        />
      ))}
      {/* Show temp whiteout block while drawing */}
      {isDrawing && tempBlock && tempBlock.page === currentPage && (
        <div
          className="absolute whiteout-block"
          style={{
            left: `${tempBlock.x * scale}px`,
            top: `${tempBlock.y * scale}px`,
            width: `${tempBlock.width * scale}px`,
            height: `${tempBlock.height * scale}px`,
            backgroundColor: 'rgba(255,255,255,0.5)',
            border: '1px dashed #999',
            pointerEvents: 'none',
            zIndex: 30,
          }}
        />
      )}
    </div>
  );
}
