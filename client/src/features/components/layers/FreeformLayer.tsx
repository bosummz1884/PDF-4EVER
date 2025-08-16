// src/features/components/layers/FreeformLayer.tsx

import React, { useRef, useState, useCallback } from 'react';
import { FreeformElement } from '@/types/pdf-types';

interface FreeformLayerProps {
  elements: FreeformElement[];
  currentPage: number;
  scale: number;
  isDrawing: boolean;
  brushSettings: {
    color: string;
    opacity: number;
    brushSize: number;
    smoothing: "none" | "low" | "medium" | "high";
  };
  selectedElementIds: string[];
  onElementsChange: (elements: FreeformElement[]) => void;
  onElementSelect: (id: string, event: React.MouseEvent) => void;
}

interface DrawingState {
  isDrawing: boolean;
  currentPath: Array<{ x: number; y: number }>;
  startTime: number;
}

// Path smoothing utility functions
const smoothPath = (points: Array<{ x: number; y: number }>, level: "none" | "low" | "medium" | "high"): Array<{ x: number; y: number }> => {
  if (level === "none" || points.length < 3) return points;
  
  const smoothingFactor = {
    low: 0.1,
    medium: 0.3,
    high: 0.5
  }[level];

  const smoothed = [points[0]];
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    
    smoothed.push({
      x: curr.x + (prev.x + next.x - 2 * curr.x) * smoothingFactor,
      y: curr.y + (prev.y + next.y - 2 * curr.y) * smoothingFactor
    });
  }
  
  if (points.length > 1) {
    smoothed.push(points[points.length - 1]);
  }
  
  return smoothed;
};

const calculateBounds = (paths: FreeformElement['paths']): FreeformElement['bounds'] => {
  if (paths.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  paths.forEach(path => {
    path.points.forEach(point => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

export const FreeformLayer: React.FC<FreeformLayerProps> = ({
  elements,
  currentPage,
  scale,
  isDrawing,
  brushSettings,
  selectedElementIds,
  onElementsChange,
  onElementSelect
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    currentPath: [],
    startTime: 0
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isDrawing) return;
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    setDrawingState({
      isDrawing: true,
      currentPath: [{ x, y }],
      startTime: Date.now()
    });
  }, [isDrawing, scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drawingState.isDrawing || !isDrawing) return;
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    setDrawingState(prev => ({
      ...prev,
      currentPath: [...prev.currentPath, { x, y }]
    }));
  }, [drawingState.isDrawing, isDrawing, scale]);

  const handleMouseUp = useCallback(() => {
    if (!drawingState.isDrawing || drawingState.currentPath.length < 2) {
      setDrawingState({ isDrawing: false, currentPath: [], startTime: 0 });
      return;
    }
    
    // Create new freeform element with the drawn path
    const smoothedPath = smoothPath(drawingState.currentPath, brushSettings.smoothing);
    const newPath = {
      points: smoothedPath,
      color: brushSettings.color,
      opacity: brushSettings.opacity,
      brushSize: brushSettings.brushSize,
      smoothing: brushSettings.smoothing
    };
    
    const newElement: FreeformElement = {
      id: `freeform-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      page: currentPage,
      paths: [newPath],
      bounds: calculateBounds([newPath])
    };
    
    onElementsChange([...elements, newElement]);
    setDrawingState({ isDrawing: false, currentPath: [], startTime: 0 });
  }, [drawingState, brushSettings, currentPage, elements, onElementsChange]);

  const handleElementClick = useCallback((elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onElementSelect(elementId, e);
  }, [onElementSelect]);

  // Render path as SVG path string
  const pathToSVG = (points: Array<{ x: number; y: number }>): string => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x * scale} ${points[0].y * scale}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x * scale} ${points[i].y * scale}`;
    }
    return path;
  };

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Render existing freeform elements */}
      {elements
        .filter(element => element.page === currentPage)
        .map(element => (
          <g key={element.id}>
            {element.paths.map((path, pathIndex) => (
              <path
                key={pathIndex}
                d={pathToSVG(path.points)}
                stroke={path.color}
                strokeWidth={path.brushSize * scale}
                strokeOpacity={path.opacity}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={selectedElementIds.includes(element.id) ? 'ring-2 ring-blue-500' : ''}
                onClick={(e) => handleElementClick(element.id, e)}
                style={{ cursor: 'pointer' }}
              />
            ))}
            {/* Selection indicator */}
            {selectedElementIds.includes(element.id) && (
              <rect
                x={element.bounds.x * scale - 5}
                y={element.bounds.y * scale - 5}
                width={element.bounds.width * scale + 10}
                height={element.bounds.height * scale + 10}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="5,5"
                pointerEvents="none"
              />
            )}
          </g>
        ))}
      
      {/* Render current drawing path */}
      {drawingState.isDrawing && drawingState.currentPath.length > 1 && (
        <path
          d={pathToSVG(drawingState.currentPath)}
          stroke={brushSettings.color}
          strokeWidth={brushSettings.brushSize * scale}
          strokeOpacity={brushSettings.opacity}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          pointerEvents="none"
        />
      )}
    </svg>
  );
};
