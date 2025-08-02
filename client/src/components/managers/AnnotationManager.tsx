import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePDFEditor } from '../../features/pdf-editor/PDFEditorContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  MousePointer,
  Highlighter,
  Square,
  Circle,
  Minus,
  Trash2,
  Type,
  Eraser,
  Download,
  Undo,
  Redo,
  Eye,
  EyeOff,
  X,
  PenTool,
  Signature,
} from 'lucide-react';
import { Annotation, ToolState } from '../../types/pdf-types';

interface AnnotationManagerProps {
  className?: string;
  onSelect?: (annotationId: string | null) => void;
  onPageChange?: (page: number) => void;
}

const AnnotationManager: React.FC<AnnotationManagerProps> = ({ 
  className,
  onSelect,
}) => {
  const { state, dispatch } = usePDFEditor();
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [signatureData, setSignatureData] = useState<string>("");

  // Refs
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);

  // Tool settings
  const [color, setColor] = useState('#ffff00');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [eraserSize, setEraserSize] = useState(20);
  const [highlightColor, setHighlightColor] = useState('#ffff00');

  // Extract values from context state
  const {
    annotations,
    currentPage,
    currentTool: currentToolState,
    scale,
    history,
    historyIndex,
  } = state;

  // Context actions
  const addAnnotation = useCallback((annotation: Omit<Annotation, 'id'>) => {
    dispatch({
      type: 'ADD_ANNOTATION',
      payload: {
        ...annotation,
        id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }
    });
  }, [dispatch]);

  const deleteAnnotation = useCallback((id: string) => {
    dispatch({
      type: 'DELETE_ANNOTATION',
      payload: id
    });
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
      onSelect?.(null);
    }
  }, [dispatch, selectedAnnotationId, onSelect]);

  const setCurrentTool = useCallback((tool: ToolState) => {
    dispatch({
      type: 'SET_CURRENT_TOOL',
      payload: tool
    });
  }, [dispatch]);

  const clearAnnotations = useCallback(() => {
    const pageAnnotations = annotations.filter(ann => ann.page === currentPage);
    pageAnnotations.forEach(ann => {
      dispatch({
        type: 'DELETE_ANNOTATION',
        payload: ann.id
      });
    });
    setSelectedAnnotationId(null);
    onSelect?.(null);
  }, [dispatch, annotations, currentPage, onSelect]);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, [dispatch]);

  const exportAnnotations = useCallback(() => {
    const dataStr = JSON.stringify(annotations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'annotations.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [annotations]);

  // Canvas event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentToolState === "select" || currentToolState === "eraser") return;

    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width) / scale;
    const y = (e.clientY - rect.top) * (canvas.height / rect.height) / scale;

    setIsDrawing(true);
    setStartPoint({ x, y });

    if (currentToolState === "freeform") {
      setCurrentPath([x, y]);
    }
  }, [currentToolState, scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width) / scale;
    const y = (e.clientY - rect.top) * (canvas.height / rect.height) / scale;

    if (currentToolState === "freeform") {
      setCurrentPath(prev => [...prev, x, y]);
    }

    if (currentToolState === "eraser") {
      // Find and delete annotations at cursor position
      const annotationsToDelete = annotations.filter(annotation => {
        if (annotation.page !== currentPage) return false;
        
        const distance = Math.sqrt(
          Math.pow(x - (annotation.x + annotation.width / 2), 2) +
          Math.pow(y - (annotation.y + annotation.height / 2), 2)
        );
        
        return distance <= eraserSize / 2;
      });

      annotationsToDelete.forEach(annotation => {
        deleteAnnotation(annotation.id);
      });
    }
  }, [isDrawing, currentToolState, scale, annotations, currentPage, eraserSize, deleteAnnotation]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;

    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width) / scale;
    const y = (e.clientY - rect.top) * (canvas.height / rect.height) / scale;

    let newAnnotation: Omit<Annotation, 'id'> | null = null;

    switch (currentToolState) {
      case "highlight": {
        const minX = Math.min(startPoint.x, x);
        const maxX = Math.max(startPoint.x, x);
        const minY = Math.min(startPoint.y, y);
        const maxY = Math.max(startPoint.y, y);
        
        newAnnotation = {
          type: "highlight",
          page: currentPage,
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          color: highlightColor,
          opacity: 0.3,
        };
        break;
      }

      case "rectangle": {
        const rectMinX = Math.min(startPoint.x, x);
        const rectMaxX = Math.max(startPoint.x, x);
        const rectMinY = Math.min(startPoint.y, y);
        const rectMaxY = Math.max(startPoint.y, y);
        
        newAnnotation = {
          type: "rectangle",
          page: currentPage,
          x: rectMinX,
          y: rectMinY,
          width: rectMaxX - rectMinX,
          height: rectMaxY - rectMinY,
          color,
          strokeWidth,
        };
        break;
      }

      case "circle": {
        const centerX = (startPoint.x + x) / 2;
        const centerY = (startPoint.y + y) / 2;
        const radius = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)) / 2;
        
        newAnnotation = {
          type: "circle",
          page: currentPage,
          x: centerX - radius,
          y: centerY - radius,
          width: radius * 2,
          height: radius * 2,
          color,
          strokeWidth,
        };
        break;
      }

      case "line": {
        newAnnotation = {
          type: "line",
          page: currentPage,
          x: startPoint.x,
          y: startPoint.y,
          width: x - startPoint.x,
          height: y - startPoint.y,
          color,
          strokeWidth,
        };
        break;
      }

      case "freeform": {
        if (currentPath.length >= 4) {
          const points = [];
          for (let i = 0; i < currentPath.length; i += 2) {
            points.push({ x: currentPath[i], y: currentPath[i + 1] });
          }
          
          const minPathX = Math.min(...points.map(p => p.x));
          const maxPathX = Math.max(...points.map(p => p.x));
                    const maxPathY = Math.max(...points.map(p => p.y));
                    const minPathY = Math.min(...points.map(p => p.y));
          
          newAnnotation = {
            type: "freeform",
            page: currentPage,
            x: minPathX,
            y: minPathY,
            width: maxPathX - minPathX,
            height: maxPathY - minPathY,
            points,
            color,
            strokeWidth,
          };
        }
        break;
      }

      case "text": {
        const textContent = prompt("Enter text:");
        if (textContent) {
          newAnnotation = {
            type: "text",
            page: currentPage,
            x: startPoint.x,
            y: startPoint.y,
            width: 200,
            height: 30,
            content: textContent,
            color,
          };
        }
        break;
      }

      case "signature": {
        if (signatureData) {
          newAnnotation = {
            type: "signature",
            page: currentPage,
            x: startPoint.x,
            y: startPoint.y,
            width: 200,
            height: 100,
            content: signatureData,
            color,
          };
        }
        break;
      }
    }

    if (newAnnotation) {
      addAnnotation(newAnnotation);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPath([]);
  }, [isDrawing, startPoint, scale, currentToolState, currentPage, highlightColor, color, strokeWidth, signatureData, addAnnotation]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
        }
      }

      // Delete selected annotation
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAnnotationId) {
          e.preventDefault();
          deleteAnnotation(selectedAnnotationId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotationId, deleteAnnotation, undo, redo, onSelect]);

  // Get current page annotations
  const currentPageAnnotations = annotations.filter(ann => ann.page === currentPage);

  return (
    <div className={`annotation-manager ${className || ''}`}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Annotation Tools</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowControls(!showControls)}
            >
              {showControls ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>

        {showControls && (
          <CardContent className="space-y-4">
            {/* Tool Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tools</Label>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant={currentToolState === "select" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool("select")}
                  className="flex flex-col items-center p-2 h-auto"
                >
                  <MousePointer className="h-4 w-4 mb-1" />
                  <span className="text-xs">Select</span>
                </Button>
                
                <Button
                  variant={currentToolState === "highlight" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool("highlight")}
                  className="flex flex-col items-center p-2 h-auto"
                >
                  <Highlighter className="h-4 w-4 mb-1" />
                  <span className="text-xs">Highlight</span>
                </Button>
                
                <Button
                  variant={currentToolState === "rectangle" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool("rectangle")}
                  className="flex flex-col items-center p-2 h-auto"
                >
                  <Square className="h-4 w-4 mb-1" />
                  <span className="text-xs">Rectangle</span>
                </Button>
                
                <Button
                  variant={currentToolState === "circle" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool("circle")}
                  className="flex flex-col items-center p-2 h-auto"
                >
                  <Circle className="h-4 w-4 mb-1" />
                  <span className="text-xs">Circle</span>
                </Button>
                
                <Button
                  variant={currentToolState === "line" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool("line")}
                  className="flex flex-col items-center p-2 h-auto"
                >
                  <Minus className="h-4 w-4 mb-1" />
                  <span className="text-xs">Line</span>
                </Button>
                
                <Button
                  variant={currentToolState === "freeform" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool("freeform")}
                  className="flex flex-col items-center p-2 h-auto"
                >
                  <PenTool className="h-4 w-4 mb-1" />
                  <span className="text-xs">Draw</span>
                </Button>
                
                <Button
                  variant={currentToolState === "text" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool("text")}
                  className="flex flex-col items-center p-2 h-auto"
                >
                  <Type className="h-4 w-4 mb-1" />
                  <span className="text-xs">Text</span>
                </Button>
                
                <Button
                  variant={currentToolState === "signature" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool("signature")}
                  className="flex flex-col items-center p-2 h-auto"
                >
                  <Signature className="h-4 w-4 mb-1" />
                  <span className="text-xs">Sign</span>
                </Button>
                
                <Button
                  variant={currentToolState === "eraser" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool("eraser")}
                  className="flex flex-col items-center p-2 h-auto"
                >
                  <Eraser className="h-4 w-4 mb-1" />
                  <span className="text-xs">Eraser</span>
                </Button>
              </div>
            </div>

            <Separator />

            {/* Tool Settings */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Settings</Label>
              
              {/* Color Picker */}
              <div className="space-y-2">
                <Label className="text-xs">Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-8 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 text-xs"
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* Highlight Color */}
              {currentToolState === "highlight" && (
                <div className="space-y-2">
                  <Label className="text-xs">Highlight Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="color"
                      value={highlightColor}
                      onChange={(e) => setHighlightColor(e.target.value)}
                      className="w-12 h-8 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={highlightColor}
                      onChange={(e) => setHighlightColor(e.target.value)}
                      className="flex-1 text-xs"
                      placeholder="#ffff00"
                    />
                  </div>
                </div>
              )}

              {/* Stroke Width */}
              {(currentToolState === "rectangle" || currentToolState === "circle" || 
                currentToolState === "line" || currentToolState === "freeform") && (
                <div className="space-y-2">
                  <Label className="text-xs">Stroke Width: {strokeWidth}px</Label>
                  <Slider
                    value={[strokeWidth]}
                    onValueChange={(value) => setStrokeWidth(value[0])}
                    max={20}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}

              {/* Eraser Size */}
              {currentToolState === "eraser" && (
                <div className="space-y-2">
                  <Label className="text-xs">Eraser Size: {eraserSize}px</Label>
                  <Slider
                    value={[eraserSize]}
                    onValueChange={(value) => setEraserSize(value[0])}
                    max={50}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Actions</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={!history || historyIndex <= 0}
                >
                  <Undo className="h-4 w-4 mr-1" />
                  Undo
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={redo}
                  disabled={!history || historyIndex >= history.length - 1}
                >
                  <Redo className="h-4 w-4 mr-1" />
                  Redo
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAnnotations}
                  disabled={currentPageAnnotations.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear Page
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportAnnotations}
                  disabled={annotations.length === 0}
                >
                  <Download className="h-4 w-4 mr-1" />
                                    Export
                </Button>
              </div>
            </div>

            <Separator />

            {/* Annotations List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Page {currentPage} Annotations ({currentPageAnnotations.length})
                </Label>
                <Badge variant="secondary" className="text-xs">
                  Total: {annotations.length}
                </Badge>
              </div>
              
              <ScrollArea className="h-32 w-full border rounded-md p-2">
                {currentPageAnnotations.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    No annotations on this page
                  </div>
                ) : (
                  <div className="space-y-1">
                    {currentPageAnnotations.map((annotation) => (
                      <div
                        key={annotation.id}
                        className={`flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-accent ${
                          selectedAnnotationId === annotation.id ? 'bg-accent border-primary' : ''
                        }`}
                        onClick={() => {
                          setSelectedAnnotationId(annotation.id);
                          onSelect?.(annotation.id);
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded border"
                            style={{ backgroundColor: annotation.color }}
                          />
                          <span className="text-xs font-medium capitalize">
                            {annotation.type}
                          </span>
                          {annotation.content && (
                            <span className="text-xs text-muted-foreground truncate max-w-20">
                              &quot;{annotation.content}&quot;
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAnnotation(annotation.id);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Signature Canvas for signature tool */}
            {currentToolState === "signature" && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Signature</Label>
                  <div className="border rounded-md p-2">
                    <canvas
                      ref={signatureCanvasRef}
                      width={200}
                      height={100}
                      className="border rounded cursor-crosshair"
                      style={{ width: '100%', height: '100px' }}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const canvas = signatureCanvasRef.current;
                          if (canvas) {
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.clearRect(0, 0, canvas.width, canvas.height);
                              setSignatureData('');
                            }
                          }
                        }}
                      >
                        Clear
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const canvas = signatureCanvasRef.current;
                          if (canvas) {
                            setSignatureData(canvas.toDataURL());
                          }
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Keyboard Shortcuts */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Shortcuts</Label>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Undo:</span>
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Z</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Redo:</span>
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Shift+Z</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Delete:</span>
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Del</kbd>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Annotation Canvas Overlay */}
      <canvas
        ref={annotationCanvasRef}
        className="absolute inset-0 pointer-events-auto"
        style={{
          cursor: currentToolState === "eraser" ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${eraserSize}" height="${eraserSize}" viewBox="0 0 ${eraserSize} ${eraserSize}"><circle cx="${eraserSize/2}" cy="${eraserSize/2}" r="${eraserSize/2-1}" fill="none" stroke="red" stroke-width="2"/></svg>') ${eraserSize/2} ${eraserSize/2}, auto` : 
                  currentToolState === "select" ? "default" : "crosshair"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDrawing(false);
          setStartPoint(null);
          setCurrentPath([]);
        }}
      />
    </div>
  );
};

export default AnnotationManager;
