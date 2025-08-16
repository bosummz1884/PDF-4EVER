// src/features/components/tools/FreeformTool.tsx

import React, { useRef, useState, useCallback } from 'react';
import { usePDFEditor } from '../../pdf-editor/PDFEditorContext';
import { FreeformElement, EditorToolProps } from '@/types/pdf-types';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DrawingState {
  isDrawing: boolean;
  currentPath: Array<{ x: number; y: number }>;
  startTime: number;
}

// Path smoothing utility functions
const smoothPath = (
  points: Array<{ x: number; y: number }>, 
  level: "none" | "low" | "medium" | "high"
): Array<{ x: number; y: number }> => {
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

export const FreeformTool: React.FC = () => {
  const { state, dispatch, canvasRef } = usePDFEditor();
  const { currentPage, scale, toolSettings, currentTool, freeformElements } = state;
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    currentPath: [],
    startTime: 0
  });

  const getCanvasCoordinates = useCallback((event: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef?.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / scale,
      y: (event.clientY - rect.top) / scale,
    };
  }, [scale, canvasRef]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (currentTool !== 'freeform') return;
    
    const coords = getCanvasCoordinates(e);
    
    setDrawingState({
      isDrawing: true,
      currentPath: [coords],
      startTime: Date.now()
    });
  }, [currentTool, getCanvasCoordinates]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drawingState.isDrawing || currentTool !== 'freeform') return;
    
    const coords = getCanvasCoordinates(e);
    
    setDrawingState(prev => ({
      ...prev,
      currentPath: [...prev.currentPath, coords]
    }));
  }, [drawingState.isDrawing, currentTool, getCanvasCoordinates]);

  const handleMouseUp = useCallback(() => {
    if (!drawingState.isDrawing || drawingState.currentPath.length < 2) {
      setDrawingState({ isDrawing: false, currentPath: [], startTime: 0 });
      return;
    }
    
    const settings = toolSettings.freeform || {};
    
    // Create new freeform element with the drawn path
    const smoothedPath = smoothPath(
      drawingState.currentPath, 
      settings.smoothing || 'medium'
    );
    
    const newPath = {
      points: smoothedPath,
      color: settings.color || '#000000',
      opacity: settings.opacity || 1,
      brushSize: settings.brushSize || 3,
      smoothing: settings.smoothing || 'medium'
    };
    
    const newElement: FreeformElement = {
      id: `freeform-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      page: currentPage,
      paths: [newPath],
      bounds: calculateBounds([newPath])
    };
    
    dispatch({ 
      type: 'ADD_FREEFORM_ELEMENT', 
      payload: { page: currentPage, element: newElement } 
    });
    dispatch({ type: 'SAVE_TO_HISTORY' });
    
    setDrawingState({ isDrawing: false, currentPath: [], startTime: 0 });
  }, [drawingState, toolSettings, currentPage, dispatch]);

  // Attach event listeners to canvas
  React.useEffect(() => {
    const canvas = canvasRef?.current;
    if (!canvas || currentTool !== 'freeform') return;

    const handleMouseDownCanvas = (e: MouseEvent) => {
      const mouseEvent = e as any as React.MouseEvent;
      handleMouseDown(mouseEvent);
    };

    const handleMouseMoveCanvas = (e: MouseEvent) => {
      const mouseEvent = e as any as React.MouseEvent;
      handleMouseMove(mouseEvent);
    };

    const handleMouseUpCanvas = () => {
      handleMouseUp();
    };

    canvas.addEventListener('mousedown', handleMouseDownCanvas);
    canvas.addEventListener('mousemove', handleMouseMoveCanvas);
    canvas.addEventListener('mouseup', handleMouseUpCanvas);
    canvas.addEventListener('mouseleave', handleMouseUpCanvas);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDownCanvas);
      canvas.removeEventListener('mousemove', handleMouseMoveCanvas);
      canvas.removeEventListener('mouseup', handleMouseUpCanvas);
      canvas.removeEventListener('mouseleave', handleMouseUpCanvas);
    };
  }, [currentTool, handleMouseDown, handleMouseMove, handleMouseUp, canvasRef]);

  // Render current drawing path as overlay
  const renderDrawingPreview = () => {
    if (!drawingState.isDrawing || drawingState.currentPath.length < 2) return null;

    const settings = toolSettings.freeform || {};
    const pathString = drawingState.currentPath
      .map((point, index) => 
        `${index === 0 ? 'M' : 'L'} ${point.x * scale} ${point.y * scale}`
      )
      .join(' ');

    return (
      <svg 
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1000 }}
      >
        <path
          d={pathString}
          stroke={settings.color || '#000000'}
          strokeWidth={(settings.brushSize || 3) * scale}
          strokeOpacity={settings.opacity || 1}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <>
      {renderDrawingPreview()}
    </>
  );
};

// A component to visually preview the current brush style
const BrushPreview: React.FC<{ settings: EditorToolProps["settings"] }> = ({ settings }) => {
  const style: React.CSSProperties = {
    width: `${settings.brushSize || 3}px`,
    height: `${settings.brushSize || 3}px`,
    backgroundColor: settings.color || "#000000",
    borderRadius: "50%",
    opacity: settings.opacity ?? 1,
  };

  return (
    <div className="p-2 border rounded-md bg-white dark:bg-gray-800 flex items-center justify-center h-20">
      <div style={style} />
    </div>
  );
};

// Tool panel component for configuring freeform drawing settings
export const FreeformToolComponent: React.FC<EditorToolProps> = ({
  settings,
  onSettingChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Brush Color */}
      <div className="space-y-1.5">
        <Label className="text-xs">Brush Color</Label>
        <Input
          type="color"
          value={settings.color || "#000000"}
          onChange={(e) => onSettingChange("color", e.target.value)}
          className="w-full h-8 p-0 cursor-pointer"
        />
      </div>
      
      {/* Opacity Slider */}
      <div className="space-y-1.5">
        <Label className="text-xs">
          Opacity: {Math.round((settings.opacity ?? 1) * 100)}%
        </Label>
        <Slider
          value={[(settings.opacity ?? 1) * 100]}
          onValueChange={([val]) => onSettingChange("opacity", val / 100)}
          min={10}
          max={100}
          step={5}
        />
      </div>

      {/* Brush Size Slider */}
      <div className="space-y-1.5">
        <Label className="text-xs">Brush Size: {settings.brushSize || 3}px</Label>
        <Slider
          value={[settings.brushSize || 3]}
          onValueChange={([val]) => onSettingChange("brushSize", val)}
          min={1}
          max={50}
          step={1}
        />
      </div>
      
      {/* Smoothing Control */}
      <div className="space-y-1.5">
          <Label className="text-xs">Smoothing</Label>
          <Select
              value={settings.smoothing || "medium"}
              onValueChange={(value) => onSettingChange("smoothing", value as "none" | "low" | "medium" | "high")}
          >
              <SelectTrigger>
                  <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
              </SelectContent>
          </Select>
      </div>

      {/* Live Brush Preview */}
      <div className="space-y-1.5">
          <Label className="text-xs">Preview</Label>
          <BrushPreview settings={settings} />
      </div>
    </div>
  );
};

export default FreeformTool;
