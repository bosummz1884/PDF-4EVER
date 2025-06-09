import React, { useEffect, useRef } from 'react';

interface EraserBlock {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  color?: string;
}

interface EraserLayerProps {
  isActive: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  scale: number;
  eraserBlocks: EraserBlock[];
  currentPage: number;
}

export default function EraserLayer({ 
  isActive, 
  canvasRef, 
  scale, 
  eraserBlocks,
  currentPage
}: EraserLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !layerRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Position the layer to match the canvas
    const layer = layerRef.current;
    layer.style.width = `${rect.width}px`;
    layer.style.height = `${rect.height}px`;
    layer.style.position = 'absolute';
    layer.style.top = '0';
    layer.style.left = '0';
    layer.style.pointerEvents = 'none';
    layer.style.zIndex = '5';
  }, [canvasRef, scale]);

  // Filter blocks for current page
  const currentPageBlocks = eraserBlocks.filter(block => block.page === currentPage);

  return (
    <div ref={layerRef} className="absolute top-0 left-0 pointer-events-none">
      {currentPageBlocks.map((block) => (
        <div
          key={block.id}
          style={{
            position: 'absolute',
            left: `${block.x * scale}px`,
            top: `${block.y * scale}px`,
            width: `${block.width * scale}px`,
            height: `${block.height * scale}px`,
            backgroundColor: block.color || '#ffffff',
            border: isActive ? '1px solid rgba(0,0,0,0.3)' : 'none',
            pointerEvents: 'none',
            zIndex: 15,
            borderRadius: '2px'
          }}
        />
      ))}
    </div>
  );
}