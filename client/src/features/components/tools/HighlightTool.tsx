// src/features/components/tools/HighlightTool.tsx

import React, { useCallback, useState } from 'react';
import { usePDFEditor } from '../../pdf-editor/PDFEditorContext';
import { Annotation, EditorToolProps } from '@/types/pdf-types';
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface HighlightState {
  isDrawing: boolean;
  startPoint: { x: number; y: number } | null;
  currentHighlight: Partial<Annotation> | null;
}

export const HighlightTool: React.FC = () => {
  const { state, dispatch, canvasRef } = usePDFEditor();
  const { currentPage, scale, toolSettings, currentTool } = state;
  const [highlightState, setHighlightState] = useState<HighlightState>({
    isDrawing: false,
    startPoint: null,
    currentHighlight: null
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
    if (currentTool !== 'highlight') return;
    
    const coords = getCanvasCoordinates(e);
    const settings = toolSettings.highlight || {};
    
    const newHighlight: Partial<Annotation> = {
      type: 'highlight',
      page: currentPage,
      x: coords.x,
      y: coords.y,
      width: 0,
      height: 0,
      color: settings.color || '#FFFF00',
      opacity: settings.opacity || 0.5,
      blendMode: settings.blendMode || 'multiply',
      strokeStyle: 'solid' // Convert highlight style to valid stroke style
    };
    
    setHighlightState({
      isDrawing: true,
      startPoint: coords,
      currentHighlight: newHighlight
    });
  }, [currentTool, getCanvasCoordinates, currentPage, toolSettings]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!highlightState.isDrawing || !highlightState.startPoint || currentTool !== 'highlight') return;
    
    const coords = getCanvasCoordinates(e);
    const startPoint = highlightState.startPoint;
    
    const updatedHighlight = {
      ...highlightState.currentHighlight,
      x: Math.min(startPoint.x, coords.x),
      y: Math.min(startPoint.y, coords.y),
      width: Math.abs(coords.x - startPoint.x),
      height: Math.abs(coords.y - startPoint.y)
    };
    
    setHighlightState(prev => ({
      ...prev,
      currentHighlight: updatedHighlight
    }));
  }, [highlightState.isDrawing, highlightState.startPoint, highlightState.currentHighlight, currentTool, getCanvasCoordinates]);

  const handleMouseUp = useCallback(() => {
    if (!highlightState.isDrawing || !highlightState.currentHighlight) {
      setHighlightState({ isDrawing: false, startPoint: null, currentHighlight: null });
      return;
    }
    
    const highlight = highlightState.currentHighlight;
    
    // Only create highlight if it has meaningful dimensions
    if ((highlight.width || 0) > 5 && (highlight.height || 0) > 5) {
      const finalHighlight: Annotation = {
        ...highlight,
        id: `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      } as Annotation;
      
      dispatch({ 
        type: 'ADD_ANNOTATION', 
        payload: { page: currentPage, annotation: finalHighlight } 
      });
      dispatch({ type: 'SAVE_TO_HISTORY' });
    }
    
    setHighlightState({ isDrawing: false, startPoint: null, currentHighlight: null });
  }, [highlightState, dispatch, currentPage]);

  // Attach event listeners to canvas
  React.useEffect(() => {
    const canvas = canvasRef?.current;
    if (!canvas || currentTool !== 'highlight') return;

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

  // Render current highlight preview
  const renderHighlightPreview = () => {
    if (!highlightState.isDrawing || !highlightState.currentHighlight) return null;

    const highlight = highlightState.currentHighlight;
    const settings = toolSettings.highlight || {};
    
    return (
      <div 
        className="absolute pointer-events-none"
        style={{ 
          left: (highlight.x || 0) * scale, 
          top: (highlight.y || 0) * scale, 
          width: (highlight.width || 0) * scale, 
          height: (highlight.height || 0) * scale, 
          backgroundColor: highlight.color || '#FFFF00',
          opacity: highlight.opacity || 0.5,
          mixBlendMode: highlight.blendMode || 'multiply',
          border: settings.style === 'underline' ? `0 0 2px 0 ${highlight.color}` : 
                  settings.style === 'strikethrough' ? `1px 0 0 0 ${highlight.color}` : 'none',
          borderStyle: settings.style === 'squiggly' ? 'wavy' : 'solid',
          zIndex: 999
        }} 
      />
    );
  };

  return (
    <>
      {renderHighlightPreview()}
    </>
  );
};

const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#FFFF00" },
  { name: "Pink", value: "#FFC0CB" },
  { name: "Green", value: "#90EE90" },
  { name: "Blue", value: "#ADD8E6" },
];

// Tool panel component for configuring highlight settings
export const HighlightToolComponent: React.FC<EditorToolProps> = ({
  settings,
  onSettingChange,
}) => {
  const currentColor = settings.color || "#FFFF00";

  return (
    <div className="space-y-4">
      {/* Highlight Style */}
      <div className="space-y-1.5">
        <Label className="text-xs">Highlight Style</Label>
        <Select
          value={settings.style || "solid"}
          onValueChange={(value) =>
            onSettingChange(
              "style",
              value as "solid" | "underline" | "strikethrough" | "squiggly",
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Solid</SelectItem>
            <SelectItem value="underline">Underline</SelectItem>
            <SelectItem value="strikethrough">Strikethrough</SelectItem>
            <SelectItem value="squiggly">Squiggly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Color Palette & Picker */}
      <div className="space-y-1.5">
        <Label className="text-xs">Highlight Color</Label>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={currentColor}
            onChange={(e) => onSettingChange("color", e.target.value)}
            className="w-10 h-10 p-0 cursor-pointer"
          />
          <ToggleGroup
            type="single"
            value={currentColor.toUpperCase()}
            onValueChange={(value) => {
              if (value) {
                onSettingChange("color", value);
              }
            }}
            className="grid grid-cols-4 gap-1 w-full"
          >
            {HIGHLIGHT_COLORS.map((color) => (
              <ToggleGroupItem
                key={color.name}
                value={color.value}
                aria-label={color.name}
                className={cn(
                  "w-full h-10 rounded-md border-2 border-transparent focus:z-10",
                  "data-[state=on]:border-primary",
                )}
                style={{ backgroundColor: color.value }}
              />
            ))}
          </ToggleGroup>
        </div>
      </div>

      {/* Opacity Slider */}
      <div className="space-y-1.5">
        <Label className="text-xs">
          Opacity: {Math.round((settings.opacity || 0.5) * 100)}%
        </Label>
        <Slider
          value={[(settings.opacity || 0.5) * 100]}
          onValueChange={([val]) => onSettingChange("opacity", val / 100)}
          min={10}
          max={100}
          step={5}
        />
      </div>

      {/* Blend Mode */}
      <div className="space-y-1.5">
        <Label className="text-xs">Blend Mode</Label>
        <Select
          value={settings.blendMode || "multiply"}
          onValueChange={(value) =>
            onSettingChange(
              "blendMode",
              value as "multiply" | "overlay" | "screen" | "normal",
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select blend mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="multiply">Multiply (Recommended)</SelectItem>
            <SelectItem value="overlay">Overlay</SelectItem>
            <SelectItem value="screen">Screen</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground pt-1">
          'Multiply' provides the most natural, ink-like appearance.
        </p>
      </div>
    </div>
  );
};

export default HighlightTool;
