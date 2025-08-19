import React, { useRef, useState, useEffect } from 'react';
import { BoundingBox } from '@/types/pdf-types';

interface OCRAreaSelectorProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  scale: number;
  onAreaSelected: (area: BoundingBox) => void;
  onCancel: () => void;
}

export const OCRAreaSelector: React.FC<OCRAreaSelectorProps> = ({
  canvasRef,
  scale,
  onAreaSelected,
  onCancel,
}) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!overlayRef.current || !canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      
      setStartPoint({ x, y });
      setEndPoint({ x, y });
      setIsSelecting(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isSelecting || !overlayRef.current || !canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width)) / scale;
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height)) / scale;
      
      setEndPoint({ x, y });
    };

    const handleMouseUp = () => {
      if (!isSelecting) return;
      
      setIsSelecting(false);
      
      // Calculate the selected area
      const x0 = Math.min(startPoint.x, endPoint.x);
      const y0 = Math.min(startPoint.y, endPoint.y);
      const x1 = Math.max(startPoint.x, endPoint.x);
      const y1 = Math.max(startPoint.y, endPoint.y);
      
      // Only proceed if the selection is large enough
      if (Math.abs(x1 - x0) > 10 && Math.abs(y1 - y0) > 10) {
        onAreaSelected({ x0, y0, x1, y1 });
      } else {
        onCancel();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousedown', handleMouseDown);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSelecting, startPoint, scale, canvasRef, onAreaSelected, onCancel]);

  // Calculate selection rectangle
  const x = Math.min(startPoint.x, endPoint.x);
  const y = Math.min(startPoint.y, endPoint.y);
  const width = Math.abs(endPoint.x - startPoint.x);
  const height = Math.abs(endPoint.y - startPoint.y);

  if (!isSelecting && (width < 10 || height < 10)) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        cursor: 'crosshair',
        zIndex: 1000,
      }}
    >
      {isSelecting && (
        <div
          style={{
            position: 'absolute',
            left: `${x * scale}px`,
            top: `${y * scale}px`,
            width: `${width * scale}px`,
            height: `${height * scale}px`,
            border: '2px dashed #3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '2px 4px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            {Math.round(width)} × {Math.round(height)} px
          </div>
        </div>
      )}
    </div>
  );
};

export default OCRAreaSelector;
