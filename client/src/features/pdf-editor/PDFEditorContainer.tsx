import React, { useCallback, useEffect, useState } from 'react';
import { usePDFEditor } from './PDFEditorContext';
import { useKeyboardShortcuts } from '@/features/hooks/useKeyboardShortcuts';
import PDFSidebar from '.././components/PDFSidebar';
import ToolPanel from './ToolPanel';
import AdvancedTextLayer from '.././components/layers/AdvancedTextLayer';
import { Annotation, PDFEditorAction, WhiteoutBlock, ToolType } from '@/types/pdf-types';
import { Button } from '@/components/ui/button';

export default function PDFEditorContainer() {
  const { state, dispatch, canvasRef, renderPage, loadPDF, savePDF } = usePDFEditor();
  const { currentPage, currentTool, toolSettings, scale, selectedElementId, selectedElementType } = state;

  const [drawingShape, setDrawingShape] = useState<Partial<Annotation> | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  
  useEffect(() => {
    if (state.pdfDocument) {
      renderPage();
    }
  }, [state.pdfDocument, currentPage, scale, state.rotation, renderPage]);

  const getCanvasCoordinates = (event: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / scale,
      y: (event.clientY - rect.top) / scale,
    };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const coords = getCanvasCoordinates(e);
    setStartPoint(coords);
    const settings = toolSettings[currentTool];

    if (['rectangle', 'circle', 'highlight', 'whiteout', 'line'].includes(currentTool)) {
      const { strokeStyle, ...validSettings } = settings;
      setDrawingShape({
        type: currentTool,
        page: currentPage,
        x: coords.x,
        y: coords.y,
        width: 0,
        height: 0,
        ...(strokeStyle === 'double' ? { strokeStyle: 'solid' } : { strokeStyle }),
        ...validSettings,
      });
    }
  }, [currentPage, currentTool, toolSettings]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!startPoint) return;
    const coords = getCanvasCoordinates(e);
    
    if (drawingShape) {
        if (drawingShape.type === 'line') {
            setDrawingShape({ ...drawingShape, width: coords.x - startPoint.x, height: coords.y - startPoint.y });
        } else {
            setDrawingShape({
              ...drawingShape,
              x: Math.min(startPoint.x, coords.x),
              y: Math.min(startPoint.y, coords.y),
              width: Math.abs(startPoint.x - coords.x),
              height: Math.abs(startPoint.y - coords.y),
            });
        }
    }
  }, [startPoint, drawingShape]);

  const handleMouseUp = useCallback(() => {
    if (drawingShape && startPoint && (drawingShape.width !== 0 || drawingShape.height !== 0)) {
       const finalShape = { ...drawingShape, id: `${drawingShape.type}-${Date.now()}` };
      
      if (finalShape.type === 'whiteout') {
        dispatch({ type: 'ADD_WHITEOUT_BLOCK', payload: { page: currentPage, block: finalShape as WhiteoutBlock } });
      } else {
        dispatch({ type: 'ADD_ANNOTATION', payload: { page: currentPage, annotation: finalShape as Annotation } });
      }
      dispatch({ type: 'SAVE_TO_HISTORY' });
    }
    setDrawingShape(null);
    setStartPoint(null);
  }, [drawingShape, startPoint, dispatch, currentPage]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await loadPDF(file);
  }, [loadPDF]);
  
  useKeyboardShortcuts({
      onUndo: () => dispatch({ type: 'UNDO' }),
      onRedo: () => dispatch({ type: 'REDO' }),
      onSave: savePDF,
      onDelete: () => {
          if (selectedElementId && selectedElementType) {
              const actionType = `DELETE_${selectedElementType.toUpperCase()}_ELEMENT` as 'DELETE_ANNOTATION' | 'DELETE_TEXT_ELEMENT';
              if(actionType === 'DELETE_ANNOTATION' || actionType === 'DELETE_TEXT_ELEMENT'){
                dispatch({ type: actionType, payload: { page: currentPage, id: selectedElementId } });
              }
          }
      },
      onZoomIn: () => dispatch({ type: 'SET_SCALE', payload: scale * 1.2 }),
      onZoomOut: () => dispatch({ type: 'SET_SCALE', payload: scale / 1.2 }),
      setCurrentTool: (tool: ToolType) => dispatch({ type: 'SET_CURRENT_TOOL', payload: tool }),
  });

  const currentPageAnnotations = state.annotations[currentPage] || [];
  const currentPageTextElements = state.textElements[currentPage] || [];
  const currentPageWhiteoutBlocks = state.whiteoutBlocks[currentPage] || [];
  
  return (
    <div className="h-full w-full bg-gray-200 flex flex-col font-sans">
      <div className="flex-1 flex overflow-hidden">
        <PDFSidebar />
        <main className="flex-1 flex items-center justify-center overflow-auto p-8 bg-gray-300 dark:bg-gray-800">
          {state.pdfDocument ? (
            <div
              className="relative shadow-lg"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ transform: `rotate(${state.rotation}deg)` }}
            >
              <canvas ref={canvasRef} className="block" />
              <div className="absolute inset-0 pointer-events-none">
                {currentPageAnnotations.map(ann => (
                  <div key={ann.id} style={{ position: 'absolute', left: ann.x * scale, top: ann.y * scale, width: ann.width! * scale, height: ann.height! * scale, border: `${ann.strokeWidth || 2}px solid ${ann.strokeColor || ann.color}`, backgroundColor: ann.fillColor || (ann.type === 'highlight' ? `${ann.color}80` : 'transparent'), borderRadius: ann.type === 'circle' ? '50%' : `${ann.cornerRadius || 0}px`, opacity: ann.opacity || 1 }} />
                ))}
                {currentPageWhiteoutBlocks.map(block => (
                  <div key={block.id} style={{ position: 'absolute', left: block.x * scale, top: block.y * scale, width: block.width * scale, height: block.height * scale, backgroundColor: 'white' }} />
                ))}
                <AdvancedTextLayer textElements={currentPageTextElements} selectedElementId={selectedElementId} scale={scale} page={currentPage} dispatch={dispatch} />
                {drawingShape && (
                  <div style={{ position: 'absolute', left: drawingShape.x! * scale, top: drawingShape.y! * scale, width: drawingShape.width! * scale, height: drawingShape.height! * scale, border: `${drawingShape.strokeWidth || 2}px dashed #3B82F6`, backgroundColor: `${drawingShape.fillColor || drawingShape.color || '#3B82F6'}30`, borderRadius: drawingShape.type === 'circle' ? '50%' : `${drawingShape.cornerRadius || 0}px` }} />
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
                <h2 className="text-xl font-semibold mb-2">Welcome to the Editor</h2>
                <p>Click &quot;Upload PDF&quot; in the header to begin.</p>
            </div>
          )}
        </main>
        <ToolPanel />
      </div>
    </div>
  );
}