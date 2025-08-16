// src/features/components/tools/WhiteoutTool.tsx

import React, { useCallback, useState } from 'react';
import { usePDFEditor } from '../../pdf-editor/PDFEditorContext';
import { WhiteoutBlock, EditorToolProps } from '@/types/pdf-types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { commonColors } from '@/features/utils/colorUtils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

interface WhiteoutState {
  isDrawing: boolean;
  startPoint: { x: number; y: number } | null;
  currentWhiteout: Partial<WhiteoutBlock> | null;
}

export const WhiteoutTool: React.FC = () => {
  const { state, dispatch, canvasRef } = usePDFEditor();
  const { currentPage, scale, toolSettings, currentTool } = state;
  const [whiteoutState, setWhiteoutState] = useState<WhiteoutState>({
    isDrawing: false,
    startPoint: null,
    currentWhiteout: null
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
    if (currentTool !== 'whiteout') return;
    
    const coords = getCanvasCoordinates(e);
    const settings = toolSettings.whiteout || {};
    
    const newWhiteout: Partial<WhiteoutBlock> = {
      page: currentPage,
      x: coords.x,
      y: coords.y,
      width: 0,
      height: 0,
      color: settings.color || '#FFFFFF'
    };
    
    setWhiteoutState({
      isDrawing: true,
      startPoint: coords,
      currentWhiteout: newWhiteout
    });
  }, [currentTool, getCanvasCoordinates, currentPage, toolSettings]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!whiteoutState.isDrawing || !whiteoutState.startPoint || currentTool !== 'whiteout') return;
    
    const coords = getCanvasCoordinates(e);
    const startPoint = whiteoutState.startPoint;
    
    const updatedWhiteout = {
      ...whiteoutState.currentWhiteout,
      x: Math.min(startPoint.x, coords.x),
      y: Math.min(startPoint.y, coords.y),
      width: Math.abs(coords.x - startPoint.x),
      height: Math.abs(coords.y - startPoint.y)
    };
    
    setWhiteoutState(prev => ({
      ...prev,
      currentWhiteout: updatedWhiteout
    }));
  }, [whiteoutState.isDrawing, whiteoutState.startPoint, whiteoutState.currentWhiteout, currentTool, getCanvasCoordinates]);

  const handleMouseUp = useCallback(() => {
    if (!whiteoutState.isDrawing || !whiteoutState.currentWhiteout) {
      setWhiteoutState({ isDrawing: false, startPoint: null, currentWhiteout: null });
      return;
    }
    
    const whiteout = whiteoutState.currentWhiteout;
    
    // Only create whiteout block if it has meaningful dimensions
    if ((whiteout.width || 0) > 5 && (whiteout.height || 0) > 5) {
      const finalWhiteout: WhiteoutBlock = {
        ...whiteout,
        id: `whiteout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      } as WhiteoutBlock;
      
      dispatch({ 
        type: 'ADD_WHITEOUT_BLOCK', 
        payload: { page: currentPage, block: finalWhiteout } 
      });
      dispatch({ type: 'SAVE_TO_HISTORY' });
    }
    
    setWhiteoutState({ isDrawing: false, startPoint: null, currentWhiteout: null });
  }, [whiteoutState, dispatch, currentPage]);

  // Attach event listeners to canvas
  React.useEffect(() => {
    const canvas = canvasRef?.current;
    if (!canvas || currentTool !== 'whiteout') return;

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

  // Render current whiteout preview
  const renderWhiteoutPreview = () => {
    if (!whiteoutState.isDrawing || !whiteoutState.currentWhiteout) return null;

    const whiteout = whiteoutState.currentWhiteout;
    
    return (
      <div 
        className="absolute pointer-events-none border-2 border-dashed border-gray-400"
        style={{ 
          left: (whiteout.x || 0) * scale, 
          top: (whiteout.y || 0) * scale, 
          width: (whiteout.width || 0) * scale, 
          height: (whiteout.height || 0) * scale, 
          backgroundColor: whiteout.color || '#FFFFFF',
          zIndex: 999
        }} 
      />
    );
  };

  return (
    <>
      {renderWhiteoutPreview()}
    </>
  );
};

export const WhiteoutToolComponent: React.FC<EditorToolProps> = ({
  settings,
  onSettingChange,
}) => {
  const currentColor = settings.color || "#FFFFFF";

  return (
    <div className="space-y-4">
      {/* Color Palette & Picker */}
      <div className="space-y-1.5">
        <Label className="text-xs">Cover-Up Color</Label>
        <div className="flex items-center gap-2">
            <Input
              type="color"
              value={currentColor}
              onChange={(e) => onSettingChange("color", e.target.value)}
              className="w-10 h-10 p-0 cursor-pointer"
            />
             <p className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md">{currentColor.toUpperCase()}</p>
        </div>
      </div>
      
      {/* Quick Select Colors */}
      <div className="space-y-1.5">
          <Label className="text-xs">Common Colors</Label>
          <ToggleGroup
            type="single"
            value={currentColor.toUpperCase()}
            onValueChange={(value) => {
              if (value) {
                onSettingChange("color", value);
              }
            }}
            className="grid grid-cols-5 gap-1 w-full"
          >
            {commonColors.slice(0, 10).map((color) => (
              <ToggleGroupItem
                key={color.name}
                value={color.hex.toUpperCase()}
                aria-label={color.name}
                className={cn(
                  "w-full h-8 rounded-md border-2 border-transparent focus:z-10",
                  "data-[state=on]:border-primary",
                )}
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </ToggleGroup>
      </div>

      <p className="text-[11px] text-muted-foreground pt-1">
          The "Whiteout" tool covers content with a solid color. For irreversible, secure redaction, a dedicated redaction tool should be used.
      </p>
    </div>
  );
};

// Export both the component and the drawing tool for backward compatibility
export default WhiteoutToolComponent;

