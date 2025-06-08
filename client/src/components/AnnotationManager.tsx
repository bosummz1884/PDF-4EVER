import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Highlighter, Square, Circle, Edit3, Eraser, Type, 
  Palette, MousePointer, Undo, Redo, Trash2, Save, 
  PenTool, Signature, Download
} from 'lucide-react';

export interface Annotation {
  id: string;
  type: 'highlight' | 'rectangle' | 'circle' | 'freeform' | 'signature' | 'text' | 'checkmark' | 'x-mark' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
  page: number;
  points?: number[];
  text?: string;
  fontSize?: number;
}

interface AnnotationManagerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  currentPage: number;
  zoom: number;
  onAnnotationsChange?: (annotations: Annotation[]) => void;
  showControls?: boolean;
}

export default function AnnotationManager({
  canvasRef,
  currentPage,
  zoom = 1,
  onAnnotationsChange,
  showControls = true
}: AnnotationManagerProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentTool, setCurrentTool] = useState<'select' | 'highlight' | 'rectangle' | 'circle' | 'freeform' | 'eraser' | 'signature' | 'text' | 'checkmark' | 'x-mark' | 'line'>('select');
  const [color, setColor] = useState('#ffff00');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [eraserSize, setEraserSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [history, setHistory] = useState<Annotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string>('');
  
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize annotation canvas
  useEffect(() => {
    if (canvasRef.current && annotationCanvasRef.current) {
      const mainCanvas = canvasRef.current;
      const annotationCanvas = annotationCanvasRef.current;
      
      annotationCanvas.width = mainCanvas.width;
      annotationCanvas.height = mainCanvas.height;
      annotationCanvas.style.position = 'absolute';
      annotationCanvas.style.top = '0';
      annotationCanvas.style.left = '0';
      annotationCanvas.style.pointerEvents = currentTool === 'select' ? 'none' : 'auto';
      annotationCanvas.style.zIndex = '10';
    }
  }, [canvasRef, currentTool]);

  // Redraw annotations when they change
  useEffect(() => {
    drawAnnotations();
    onAnnotationsChange?.(annotations);
  }, [annotations, currentPage, zoom]);

  const drawAnnotations = useCallback(() => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    annotations
      .filter(annotation => annotation.page === currentPage)
      .forEach(annotation => {
        ctx.save();
        ctx.strokeStyle = annotation.color;
        ctx.fillStyle = annotation.color;
        ctx.lineWidth = annotation.strokeWidth * zoom;
        
        const x = annotation.x * zoom;
        const y = annotation.y * zoom;
        const width = annotation.width * zoom;
        const height = annotation.height * zoom;
        
        switch (annotation.type) {
          case 'highlight':
            ctx.globalAlpha = 0.3;
            ctx.fillRect(x, y, width, height);
            break;
            
          case 'rectangle':
            ctx.strokeRect(x, y, width, height);
            if (selectedAnnotationId === annotation.id) {
              ctx.strokeStyle = '#0066ff';
              ctx.lineWidth = 2;
              ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
            }
            break;
            
          case 'circle':
            ctx.beginPath();
            ctx.ellipse(
              x + width / 2,
              y + height / 2,
              width / 2,
              height / 2,
              0, 0, 2 * Math.PI
            );
            ctx.stroke();
            break;
            
          case 'freeform':
            if (annotation.points && annotation.points.length > 1) {
              ctx.beginPath();
              ctx.moveTo(annotation.points[0] * zoom, annotation.points[1] * zoom);
              for (let i = 2; i < annotation.points.length; i += 2) {
                ctx.lineTo(annotation.points[i] * zoom, annotation.points[i + 1] * zoom);
              }
              ctx.stroke();
            }
            break;
            
          case 'signature':
            if (annotation.points && annotation.points.length > 1) {
              ctx.lineWidth = 2 * zoom;
              ctx.beginPath();
              ctx.moveTo(annotation.points[0] * zoom, annotation.points[1] * zoom);
              for (let i = 2; i < annotation.points.length; i += 2) {
                ctx.lineTo(annotation.points[i] * zoom, annotation.points[i + 1] * zoom);
              }
              ctx.stroke();
            }
            break;
            
          case 'text':
            if (annotation.text) {
              ctx.font = `${(annotation.fontSize || 16) * zoom}px Arial`;
              ctx.fillText(annotation.text, x, y + (annotation.fontSize || 16) * zoom);
            }
            break;
        }
        
        ctx.restore();
      });
  }, [annotations, currentPage, zoom, selectedAnnotationId]);

  const getCanvasPoint = useCallback((e: React.MouseEvent) => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom
    };
  }, [zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (currentTool === 'select') return;
    
    const point = getCanvasPoint(e);
    setIsDrawing(true);
    setStartPoint(point);
    
    if (currentTool === 'freeform' || currentTool === 'signature') {
      setCurrentPath([point.x, point.y]);
    }
  }, [currentTool, getCanvasPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;
    
    const point = getCanvasPoint(e);
    
    if (currentTool === 'freeform' || currentTool === 'signature') {
      setCurrentPath(prev => [...prev, point.x, point.y]);
      
      // Draw temporary path
      const canvas = annotationCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && currentPath.length > 2) {
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth * zoom;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(currentPath[currentPath.length - 4] * zoom, currentPath[currentPath.length - 3] * zoom);
        ctx.lineTo(point.x * zoom, point.y * zoom);
        ctx.stroke();
      }
    } else if (currentTool === 'eraser') {
      handleErase(point.x, point.y);
    }
  }, [isDrawing, startPoint, currentTool, currentPath, color, strokeWidth, zoom, getCanvasPoint]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !startPoint || currentTool === 'select') return;
    
    const point = getCanvasPoint(e);
    const newId = `annotation-${Date.now()}`;
    
    let newAnnotation: Annotation;
    
    switch (currentTool) {
      case 'highlight':
      case 'rectangle':
        newAnnotation = {
          id: newId,
          type: currentTool,
          x: Math.min(startPoint.x, point.x),
          y: Math.min(startPoint.y, point.y),
          width: Math.abs(point.x - startPoint.x),
          height: Math.abs(point.y - startPoint.y),
          color,
          strokeWidth,
          page: currentPage
        };
        break;
        
      case 'circle':
        newAnnotation = {
          id: newId,
          type: 'circle',
          x: Math.min(startPoint.x, point.x),
          y: Math.min(startPoint.y, point.y),
          width: Math.abs(point.x - startPoint.x),
          height: Math.abs(point.y - startPoint.y),
          color,
          strokeWidth,
          page: currentPage
        };
        break;
        
      case 'checkmark':
      case 'x-mark':
        newAnnotation = {
          id: newId,
          type: currentTool,
          x: Math.min(startPoint.x, point.x),
          y: Math.min(startPoint.y, point.y),
          width: Math.abs(point.x - startPoint.x),
          height: Math.abs(point.y - startPoint.y),
          color,
          strokeWidth,
          page: currentPage
        };
        break;
        
      case 'freeform':
      case 'signature':
        if (currentPath.length > 2) {
          const minX = Math.min(...currentPath.filter((_, i) => i % 2 === 0));
          const maxX = Math.max(...currentPath.filter((_, i) => i % 2 === 0));
          const minY = Math.min(...currentPath.filter((_, i) => i % 2 === 1));
          const maxY = Math.max(...currentPath.filter((_, i) => i % 2 === 1));
          
          newAnnotation = {
            id: newId,
            type: currentTool,
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            color,
            strokeWidth,
            page: currentPage,
            points: currentPath
          };
        } else {
          setIsDrawing(false);
          setStartPoint(null);
          setCurrentPath([]);
          return;
        }
        break;
        
      default:
        setIsDrawing(false);
        setStartPoint(null);
        setCurrentPath([]);
        return;
    }
    
    const newAnnotations = [...annotations, newAnnotation];
    setAnnotations(newAnnotations);
    saveToHistory(newAnnotations);
    
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPath([]);
  }, [isDrawing, startPoint, currentTool, currentPath, color, strokeWidth, currentPage, annotations, getCanvasPoint]);

  const handleErase = useCallback((x: number, y: number) => {
    const toRemove = annotations.filter(annotation => {
      if (annotation.page !== currentPage) return false;
      
      const centerX = annotation.x + annotation.width / 2;
      const centerY = annotation.y + annotation.height / 2;
      const distance = Math.sqrt(Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2));
      
      return distance < eraserSize / 2;
    });
    
    if (toRemove.length > 0) {
      const newAnnotations = annotations.filter(a => !toRemove.includes(a));
      setAnnotations(newAnnotations);
    }
  }, [annotations, currentPage, eraserSize]);

  const deleteAnnotation = useCallback((id: string) => {
    const newAnnotations = annotations.filter(a => a.id !== id);
    setAnnotations(newAnnotations);
    saveToHistory(newAnnotations);
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
    }
  }, [annotations, selectedAnnotationId]);

  const saveToHistory = useCallback((newAnnotations: Annotation[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newAnnotations]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations([...history[historyIndex - 1]]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations([...history[historyIndex + 1]]);
    }
  }, [history, historyIndex]);

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);
    saveToHistory([]);
  }, [saveToHistory]);

  const exportAnnotations = useCallback(() => {
    const dataStr = JSON.stringify(annotations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `annotations-page-${currentPage}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [annotations, currentPage]);

  const currentPageAnnotations = annotations.filter(a => a.page === currentPage);

  return (
    <>
      {showControls && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Annotation Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Tool Selection */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={currentTool === 'select' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentTool('select')}
                >
                  <MousePointer className="h-4 w-4 mr-1" />
                  Select
                </Button>
                <Button
                  variant={currentTool === 'highlight' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentTool('highlight')}
                >
                  <Highlighter className="h-4 w-4 mr-1" />
                  Highlight
                </Button>
                <Button
                  variant={currentTool === 'rectangle' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentTool('rectangle')}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Rectangle
                </Button>
                <Button
                  variant={currentTool === 'circle' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentTool('circle')}
                >
                  <Circle className="h-4 w-4 mr-1" />
                  Circle
                </Button>
                <Button
                  variant={currentTool === 'freeform' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentTool('freeform')}
                >
                  <PenTool className="h-4 w-4 mr-1" />
                  Draw
                </Button>
                <Button
                  variant={currentTool === 'signature' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentTool('signature')}
                >
                  <Signature className="h-4 w-4 mr-1" />
                  Sign
                </Button>
                <Button
                  variant={currentTool === 'eraser' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentTool('eraser')}
                >
                  <Eraser className="h-4 w-4 mr-1" />
                  Eraser
                </Button>
              </div>

              {/* Style Controls */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded border cursor-pointer"
                  />
                </div>

                {currentTool !== 'eraser' && (
                  <div className="flex items-center gap-2 min-w-32">
                    <span className="text-sm">Stroke:</span>
                    <Slider
                      value={[strokeWidth]}
                      onValueChange={(value) => setStrokeWidth(value[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm w-6">{strokeWidth}</span>
                  </div>
                )}

                {currentTool === 'eraser' && (
                  <div className="flex items-center gap-2 min-w-32">
                    <span className="text-sm">Size:</span>
                    <Slider
                      value={[eraserSize]}
                      onValueChange={(value) => setEraserSize(value[0])}
                      max={50}
                      min={5}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm w-8">{eraserSize}px</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                >
                  <Undo className="h-4 w-4 mr-1" />
                  Undo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
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
                  Clear All
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
                
                <Badge variant="secondary" className="ml-auto">
                  {currentPageAnnotations.length} annotation(s)
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Annotation Canvas */}
      <canvas
        ref={annotationCanvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: currentTool === 'select' ? 'none' : 'auto',
          cursor: currentTool === 'eraser' ? `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='${eraserSize}' height='${eraserSize}' viewBox='0 0 ${eraserSize} ${eraserSize}'><circle cx='${eraserSize/2}' cy='${eraserSize/2}' r='${eraserSize/2}' fill='none' stroke='red' stroke-width='2'/></svg>") ${eraserSize/2} ${eraserSize/2}, crosshair` : 
                currentTool === 'select' ? 'default' : 'crosshair',
          zIndex: 10
        }}
      />
    </>
  );
}

export type { Annotation };