import React, { useState } from 'react';

export interface EraserLayerProps {
  eraserSize: number;
  setEraserSize: React.Dispatch<React.SetStateAction<number>>;
  onErase: (x: number, y: number, size: number) => void;
  currentTool: string;
  currentPage: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export default function EraserLayer({
  eraserSize,
  setEraserSize,
  onErase,
  currentTool,
  currentPage,
  canvasRef,
}: EraserLayerProps) {
  const [eraserPosition, setEraserPosition] = useState({ x: 0, y: 0 });
  const [isErasing, setIsErasing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentTool !== 'eraser') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setEraserPosition({ x, y });
    setIsErasing(true);
    onErase(x, y, eraserSize);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setEraserPosition({ x, y });
    if (isErasing && currentTool === 'eraser') {
      onErase(x, y, eraserSize);
    }
  };

  const handleMouseUp = () => {
    setIsErasing(false);
  };

  const handleMouseLeave = () => {
    setIsErasing(false);
  };

  if (currentTool !== 'eraser') return null;

  return (
    <div
      className="eraser-layer absolute inset-0 z-30"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: 'none', pointerEvents: currentTool === 'eraser' ? 'auto' : 'none' }}
    >
      <div
        className="eraser-cursor absolute rounded-full border-2 border-black bg-white bg-opacity-50 pointer-events-none"
        style={{
          left: `${eraserPosition.x - eraserSize / 2}px`,
          top: `${eraserPosition.y - eraserSize / 2}px`,
          width: `${eraserSize}px`,
          height: `${eraserSize}px`,
        }}
      />
    </div>
  );
}
