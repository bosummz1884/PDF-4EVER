import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  Palette, 
  Type, 
  Square, 
  Circle, 
  Minus, 
  PenTool,
  Highlighter,
  Eraser,
  Download
} from "lucide-react";

interface AdvancedAnnotationToolProps {
  onClose: () => void;
  onAnnotationApply: (annotation: AnnotationType) => void;
  canvas?: HTMLCanvasElement;
}

interface AnnotationType {
  type: 'text' | 'highlight' | 'rectangle' | 'circle' | 'line' | 'freehand';
  text?: string;
  color: string;
  strokeWidth: number;
  fontSize?: number;
  position?: { x: number; y: number };
  dimensions?: { width: number; height: number };
}

const AdvancedAnnotationTool: React.FC<AdvancedAnnotationToolProps> = ({
  onClose,
  onAnnotationApply,
  canvas
}) => {
  const [selectedTool, setSelectedTool] = useState<AnnotationType['type']>('text');
  const [color, setColor] = useState('#ff0000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [text, setText] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleToolChange = (tool: AnnotationType['type']) => {
    setSelectedTool(tool);
    if (tool === 'text') {
      setText('Sample Text');
    }
  };

  const handleApplyAnnotation = () => {
    const annotation: AnnotationType = {
      type: selectedTool,
      color,
      strokeWidth,
      fontSize: selectedTool === 'text' ? fontSize : undefined,
      text: selectedTool === 'text' ? text : undefined,
      position: { x: 100, y: 100 } // Default position
    };

    onAnnotationApply(annotation);
  };

  const clearCanvas = () => {
    const canvas = drawingCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool !== 'freehand') return;
    setIsDrawing(true);
    
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || selectedTool !== 'freehand') return;
    
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Advanced PDF Annotation Tools</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tool Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Annotation Tools</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={selectedTool === 'text' ? 'default' : 'outline'}
                onClick={() => handleToolChange('text')}
                className="flex flex-col items-center gap-1 h-16"
              >
                <Type className="w-5 h-5" />
                <span className="text-xs">Text</span>
              </Button>
              <Button
                variant={selectedTool === 'highlight' ? 'default' : 'outline'}
                onClick={() => handleToolChange('highlight')}
                className="flex flex-col items-center gap-1 h-16"
              >
                <Highlighter className="w-5 h-5" />
                <span className="text-xs">Highlight</span>
              </Button>
              <Button
                variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
                onClick={() => handleToolChange('rectangle')}
                className="flex flex-col items-center gap-1 h-16"
              >
                <Square className="w-5 h-5" />
                <span className="text-xs">Rectangle</span>
              </Button>
              <Button
                variant={selectedTool === 'circle' ? 'default' : 'outline'}
                onClick={() => handleToolChange('circle')}
                className="flex flex-col items-center gap-1 h-16"
              >
                <Circle className="w-5 h-5" />
                <span className="text-xs">Circle</span>
              </Button>
              <Button
                variant={selectedTool === 'line' ? 'default' : 'outline'}
                onClick={() => handleToolChange('line')}
                className="flex flex-col items-center gap-1 h-16"
              >
                <Minus className="w-5 h-5" />
                <span className="text-xs">Line</span>
              </Button>
              <Button
                variant={selectedTool === 'freehand' ? 'default' : 'outline'}
                onClick={() => handleToolChange('freehand')}
                className="flex flex-col items-center gap-1 h-16"
              >
                <PenTool className="w-5 h-5" />
                <span className="text-xs">Freehand</span>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Properties */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="color-picker">Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    id="color-picker"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-8 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#ff0000"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="stroke-width">Stroke Width</Label>
                <Select value={strokeWidth.toString()} onValueChange={(v) => setStrokeWidth(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1px</SelectItem>
                    <SelectItem value="2">2px</SelectItem>
                    <SelectItem value="3">3px</SelectItem>
                    <SelectItem value="4">4px</SelectItem>
                    <SelectItem value="5">5px</SelectItem>
                    <SelectItem value="8">8px</SelectItem>
                    <SelectItem value="10">10px</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedTool === 'text' && (
                <>
                  <div>
                    <Label htmlFor="font-size">Font Size</Label>
                    <Select value={fontSize.toString()} onValueChange={(v) => setFontSize(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10px</SelectItem>
                        <SelectItem value="12">12px</SelectItem>
                        <SelectItem value="14">14px</SelectItem>
                        <SelectItem value="16">16px</SelectItem>
                        <SelectItem value="18">18px</SelectItem>
                        <SelectItem value="20">20px</SelectItem>
                        <SelectItem value="24">24px</SelectItem>
                        <SelectItem value="32">32px</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="text-input">Text Content</Label>
                    <Input
                      id="text-input"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Enter text to add"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-3">
              <Label>Preview Canvas</Label>
              <div className="border border-border rounded bg-white">
                <canvas
                  ref={drawingCanvasRef}
                  width={300}
                  height={200}
                  className="w-full cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearCanvas}>
                  <Eraser className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleApplyAnnotation}
              className="bg-gradient-to-r from-primary via-secondary to-accent text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Apply Annotation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAnnotationTool;