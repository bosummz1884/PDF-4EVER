import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  Download, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Type, 
  Edit, 
  Signature, 
  Move,
  Square,
  Pen,
  ChevronLeft,
  ChevronRight,
  Undo,
  Redo,
  Save,
  FileText,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Highlighter,
  Circle,
  Minus
} from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface Annotation {
  id: string;
  type: 'text' | 'highlight' | 'rectangle' | 'circle' | 'signature' | 'freeform';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
  fontSize?: number;
  font?: string;
  strokeWidth?: number;
  points?: Array<{x: number, y: number}>;
}

interface EditHistory {
  annotations: Annotation[];
  pageRotations: number[];
}

interface PDFEditorProps {
  className?: string;
}

export function AdvancedPDFEditor({ className }: PDFEditorProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [pdfLibDocument, setPdfLibDocument] = useState<PDFDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [currentTool, setCurrentTool] = useState<string>("select");
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [textContent, setTextContent] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(16);
  const [font, setFont] = useState("Helvetica");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<Array<{x: number, y: number}>>([]);
  const [history, setHistory] = useState<EditHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showAnnotations, setShowAnnotations] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);

  // Configure PDF.js worker
  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
  }, []);

  const tools = [
    { id: "select", icon: Move, label: "Select" },
    { id: "text", icon: Type, label: "Add Text" },
    { id: "edit", icon: Edit, label: "Edit Text" },
    { id: "signature", icon: Signature, label: "Sign" },
    { id: "highlight", icon: Highlighter, label: "Highlight" },
    { id: "freeform", icon: Pen, label: "Draw" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" },
  ];

  const fonts = [
    "Helvetica",
    "Times-Roman", 
    "Courier",
    "Helvetica-Bold",
    "Times-Bold",
    "Courier-Bold"
  ];

  const colors = [
    "#000000", "#FF0000", "#00FF00", "#0000FF", 
    "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500",
    "#800080", "#008000", "#800000", "#000080"
  ];

  const saveToHistory = useCallback(() => {
    const newState: EditHistory = {
      annotations: [...annotations],
      pageRotations: [rotation]
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [annotations, rotation, history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setAnnotations(prevState.annotations);
      setRotation(prevState.pageRotations[0] || 0);
      setHistoryIndex(historyIndex - 1);
      renderCurrentPage();
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setAnnotations(nextState.annotations);
      setRotation(nextState.pageRotations[0] || 0);
      setHistoryIndex(historyIndex + 1);
      renderCurrentPage();
    }
  }, [history, historyIndex]);

  const loadPDF = async (file: File) => {
    try {
      setIsLoading(true);
      console.log('Loading PDF file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // Validate file
      if (!file || file.type !== 'application/pdf') {
        throw new Error('Invalid PDF file');
      }
      
      const arrayBuffer = await file.arrayBuffer();
      console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('PDF file is empty');
      }
      
      // Load with PDF.js for rendering
      console.log('Starting PDF.js document loading...');
      const loadingTask = pdfjsLib.getDocument({ 
        data: new Uint8Array(arrayBuffer),
        verbosity: 1,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true
      });
      
      // Handle loading progress
      loadingTask.onProgress = function (progressData: any) {
        console.log('Loading progress:', progressData.loaded / progressData.total);
      };
      
      const pdf = await loadingTask.promise;
      console.log('PDF.js document loaded successfully, pages:', pdf.numPages);
      
      // Try to load with pdf-lib for editing (optional)
      let pdfLib = null;
      try {
        console.log('Starting pdf-lib document loading...');
        pdfLib = await PDFDocument.load(arrayBuffer);
        console.log('pdf-lib document loaded successfully');
      } catch (pdfLibError: any) {
        console.warn('pdf-lib loading failed, editing features will be limited:', pdfLibError);
      }
      
      setPdfDocument(pdf);
      setPdfLibDocument(pdfLib);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setAnnotations([]);
      setHistory([]);
      setHistoryIndex(-1);
      
      console.log('PDF loaded successfully:', file.name, 'Pages:', pdf.numPages);
      
      // Render first page
      await renderPage(pdf, 1);
      if (pdfLib) {
        saveToHistory();
      }
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error loading PDF:', error);
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      if (error?.stack) {
        console.error('Error stack:', error.stack);
      }
      setIsLoading(false);
      
      // Show user-friendly error message
      const errorMessage = error?.message || error?.name || 'Unknown error occurred';
      alert(`Failed to load PDF: ${errorMessage}`);
    }
  };

  const renderPage = async (pdf: any, pageNum: number) => {
    try {
      console.log(`Rendering page ${pageNum}...`);
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      
      if (!canvas) {
        console.error('Canvas ref not found');
        return;
      }

      const context = canvas.getContext('2d');
      if (!context) {
        console.error('Canvas context not available');
        return;
      }

      // Calculate viewport with zoom and rotation
      const viewport = page.getViewport({ 
        scale: zoom / 100,
        rotation: rotation 
      });
      
      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Clear canvas with white background
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      console.log('Starting PDF page render...');
      await page.render(renderContext).promise;
      console.log(`Page ${pageNum} rendered successfully - Canvas size: ${canvas.width}x${canvas.height}`);
      
      // Update annotation canvas size
      const annotationCanvas = annotationCanvasRef.current;
      if (annotationCanvas) {
        annotationCanvas.width = canvas.width;
        annotationCanvas.height = canvas.height;
        annotationCanvas.style.width = canvas.style.width;
        annotationCanvas.style.height = canvas.style.height;
        renderAnnotations();
      }
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  const renderCurrentPage = useCallback(() => {
    if (pdfDocument && currentPage) {
      renderPage(pdfDocument, currentPage);
    }
  }, [pdfDocument, currentPage, zoom, rotation]);

  const renderAnnotations = () => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (!showAnnotations) return;

    const scale = zoom / 100;

    annotations.forEach(annotation => {
      context.save();
      
      switch (annotation.type) {
        case 'text':
          context.fillStyle = annotation.color || '#000000';
          context.font = `${(annotation.fontSize || 16) * scale}px ${annotation.font || 'Arial'}`;
          context.fillText(
            annotation.content || '', 
            annotation.x * scale, 
            annotation.y * scale
          );
          break;
          
        case 'highlight':
          context.fillStyle = (annotation.color || '#FFFF00') + '80'; // Semi-transparent
          context.fillRect(
            annotation.x * scale,
            annotation.y * scale,
            (annotation.width || 100) * scale,
            (annotation.height || 20) * scale
          );
          break;
          
        case 'rectangle':
          context.strokeStyle = annotation.color || '#000000';
          context.lineWidth = (annotation.strokeWidth || 2) * scale;
          context.strokeRect(
            annotation.x * scale,
            annotation.y * scale,
            (annotation.width || 100) * scale,
            (annotation.height || 100) * scale
          );
          break;
          
        case 'circle':
          context.strokeStyle = annotation.color || '#000000';
          context.lineWidth = (annotation.strokeWidth || 2) * scale;
          context.beginPath();
          const radius = ((annotation.width || 50) / 2) * scale;
          context.arc(
            (annotation.x + (annotation.width || 50) / 2) * scale,
            (annotation.y + (annotation.height || 50) / 2) * scale,
            radius,
            0,
            2 * Math.PI
          );
          context.stroke();
          break;
          
        case 'freeform':
          if (annotation.points && annotation.points.length > 1) {
            context.strokeStyle = annotation.color || '#000000';
            context.lineWidth = (annotation.strokeWidth || 2) * scale;
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.beginPath();
            context.moveTo(annotation.points[0].x * scale, annotation.points[0].y * scale);
            for (let i = 1; i < annotation.points.length; i++) {
              context.lineTo(annotation.points[i].x * scale, annotation.points[i].y * scale);
            }
            context.stroke();
          }
          break;
          
        case 'signature':
          if (annotation.points && annotation.points.length > 1) {
            context.strokeStyle = annotation.color || '#000080';
            context.lineWidth = (annotation.strokeWidth || 3) * scale;
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.beginPath();
            context.moveTo(annotation.points[0].x * scale, annotation.points[0].y * scale);
            for (let i = 1; i < annotation.points.length; i++) {
              context.lineTo(annotation.points[i].x * scale, annotation.points[i].y * scale);
            }
            context.stroke();
          }
          break;
      }
      
      // Draw selection border
      if (selectedAnnotation === annotation.id) {
        context.strokeStyle = '#007ACC';
        context.lineWidth = 2;
        context.setLineDash([5, 5]);
        context.strokeRect(
          annotation.x * scale - 5,
          annotation.y * scale - 5,
          ((annotation.width || 100) + 10) * scale,
          ((annotation.height || 20) + 10) * scale
        );
        context.setLineDash([]);
      }
      
      context.restore();
    });
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / (zoom / 100));
    const y = ((event.clientY - rect.top) / (zoom / 100));

    switch (currentTool) {
      case 'text':
        const textAnnotation: Annotation = {
          id: Date.now().toString(),
          type: 'text' as const,
          x,
          y,
          content: textContent || 'Sample Text',
          color: textColor,
          fontSize,
          font
        };
        setAnnotations(prev => [...prev, textAnnotation]);
        saveToHistory();
        break;
        
      case 'highlight':
        const highlightAnnotation: Annotation = {
          id: Date.now().toString(),
          type: 'highlight' as const,
          x,
          y,
          width: 100,
          height: 20,
          color: textColor
        };
        setAnnotations(prev => [...prev, highlightAnnotation]);
        saveToHistory();
        break;
        
      case 'rectangle':
        const rectAnnotation: Annotation = {
          id: Date.now().toString(),
          type: 'rectangle' as const,
          x,
          y,
          width: 100,
          height: 100,
          color: textColor,
          strokeWidth: 2
        };
        setAnnotations(prev => [...prev, rectAnnotation]);
        saveToHistory();
        break;
        
      case 'circle':
        const circleAnnotation: Annotation = {
          id: Date.now().toString(),
          type: 'circle' as const,
          x,
          y,
          width: 80,
          height: 80,
          color: textColor,
          strokeWidth: 2
        };
        setAnnotations(prev => [...prev, circleAnnotation]);
        saveToHistory();
        break;
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool === 'freeform' || currentTool === 'signature') {
      setIsDrawing(true);
      const canvas = annotationCanvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / (zoom / 100);
      const y = (event.clientY - rect.top) / (zoom / 100);
      
      setDrawingPoints([{ x, y }]);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / (zoom / 100);
    const y = (event.clientY - rect.top) / (zoom / 100);
    
    setDrawingPoints(prev => [...prev, { x, y }]);
    
    // Render temporary drawing
    const context = canvas.getContext('2d');
    if (context && drawingPoints.length > 0) {
      const scale = zoom / 100;
      context.strokeStyle = currentTool === 'signature' ? '#000080' : textColor;
      context.lineWidth = (currentTool === 'signature' ? 3 : 2) * scale;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      
      context.beginPath();
      context.moveTo(drawingPoints[0].x * scale, drawingPoints[0].y * scale);
      context.lineTo(x * scale, y * scale);
      context.stroke();
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && drawingPoints.length > 1) {
      const annotationType: 'signature' | 'freeform' = currentTool === 'signature' ? 'signature' : 'freeform';
      const annotation: Annotation = {
        id: Date.now().toString(),
        type: annotationType,
        x: Math.min(...drawingPoints.map(p => p.x)),
        y: Math.min(...drawingPoints.map(p => p.y)),
        points: drawingPoints,
        color: currentTool === 'signature' ? '#000080' : textColor,
        strokeWidth: currentTool === 'signature' ? 3 : 2
      };
      
      setAnnotations(prev => [...prev, annotation]);
      saveToHistory();
    }
    
    setIsDrawing(false);
    setDrawingPoints([]);
    renderAnnotations();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      loadPDF(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      loadPDF(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const exportPDF = async () => {
    if (!pdfLibDocument) return;

    try {
      setIsLoading(true);
      
      // Create a copy of the PDF document
      const pdfDoc = await PDFDocument.create();
      const pages = await pdfDoc.copyPages(pdfLibDocument, pdfLibDocument.getPageIndices());
      
      pages.forEach(page => pdfDoc.addPage(page));
      
      // Add annotations to pages
      const currentPageAnnotations = annotations.filter(ann => true); // For current page
      
      if (currentPageAnnotations.length > 0) {
        const page = pdfDoc.getPage(currentPage - 1);
        const { width, height } = page.getSize();
        
        for (const annotation of currentPageAnnotations) {
          switch (annotation.type) {
            case 'text':
              const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
              page.drawText(annotation.content || '', {
                x: annotation.x,
                y: height - annotation.y - (annotation.fontSize || 16),
                size: annotation.fontSize || 16,
                font,
                color: rgb(
                  parseInt(annotation.color?.slice(1, 3) || '00', 16) / 255,
                  parseInt(annotation.color?.slice(3, 5) || '00', 16) / 255,
                  parseInt(annotation.color?.slice(5, 7) || '00', 16) / 255
                )
              });
              break;
              
            case 'rectangle':
              page.drawRectangle({
                x: annotation.x,
                y: height - annotation.y - (annotation.height || 100),
                width: annotation.width || 100,
                height: annotation.height || 100,
                borderColor: rgb(
                  parseInt(annotation.color?.slice(1, 3) || '00', 16) / 255,
                  parseInt(annotation.color?.slice(3, 5) || '00', 16) / 255,
                  parseInt(annotation.color?.slice(5, 7) || '00', 16) / 255
                ),
                borderWidth: annotation.strokeWidth || 2
              });
              break;
          }
        }
      }
      
      const pdfBytes = await pdfDoc.save();
      
      // Download the edited PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `edited-${pdfFile?.name || 'document.pdf'}`;
      link.click();
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setIsLoading(false);
    }
  };

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    saveToHistory();
    renderCurrentPage();
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      renderPage(pdfDocument, newPage);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      renderPage(pdfDocument, newPage);
    }
  };

  const deleteSelectedAnnotation = () => {
    if (selectedAnnotation) {
      setAnnotations(prev => prev.filter(ann => ann.id !== selectedAnnotation));
      setSelectedAnnotation(null);
      saveToHistory();
      renderAnnotations();
    }
  };

  const clearAllAnnotations = () => {
    setAnnotations([]);
    setSelectedAnnotation(null);
    saveToHistory();
    renderAnnotations();
  };

  // Re-render when annotations or zoom changes
  useEffect(() => {
    renderAnnotations();
  }, [annotations, zoom, showAnnotations]);

  useEffect(() => {
    renderCurrentPage();
  }, [zoom]);

  return (
    <div className={`h-full flex ${className}`}>
      {/* Toolbar */}
      <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r flex flex-col p-4 space-y-4 overflow-y-auto">
        {/* Upload Section */}
        <div className="space-y-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
            disabled={isLoading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isLoading ? "Loading..." : "Upload PDF"}
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <Separator />

        {/* Tools */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tools</Label>
          <div className="grid grid-cols-2 gap-2">
            {tools.map((tool) => (
              <Button
                key={tool.id}
                variant={currentTool === tool.id ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool(tool.id)}
                className="flex flex-col h-16 p-2"
              >
                <tool.icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{tool.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Text Properties */}
        {(currentTool === 'text' || currentTool === 'freeform' || currentTool === 'signature' || currentTool === 'highlight' || currentTool === 'rectangle' || currentTool === 'circle') && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Properties</Label>
            
            {currentTool === 'text' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Text Content</Label>
                  <Input
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Enter text..."
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Font</Label>
                  <Select value={font} onValueChange={setFont}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fonts.map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Font Size: {fontSize}px</Label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={(value) => setFontSize(value[0])}
                    min={8}
                    max={72}
                    step={1}
                    className="w-full"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label className="text-xs">Color</Label>
              <div className="grid grid-cols-6 gap-1">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setTextColor(color)}
                    className={`w-8 h-8 rounded border-2 ${textColor === color ? 'border-gray-800' : 'border-gray-300'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-full h-8"
              />
            </div>
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Actions</Label>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnnotations(!showAnnotations)}
            className="w-full"
          >
            {showAnnotations ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {showAnnotations ? 'Hide' : 'Show'} Annotations
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={deleteSelectedAnnotation}
            disabled={!selectedAnnotation}
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllAnnotations}
            disabled={annotations.length === 0}
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          
          <Button
            onClick={exportPDF}
            disabled={!pdfDocument || isLoading}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {isLoading ? "Exporting..." : "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Controls */}
        {pdfDocument && (
          <div className="bg-white dark:bg-gray-900 border-b p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(25, zoom - 25))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <span className="text-sm font-medium min-w-[60px] text-center">
                {zoom}%
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(300, zoom + 25))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
          {!pdfDocument ? (
            <div
              className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 m-8 rounded-lg"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Drop your PDF here or click to upload
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supports PDF files up to 50MB
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center p-8">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="border border-gray-300 dark:border-gray-600 shadow-lg"
                />
                <canvas
                  ref={annotationCanvasRef}
                  className="absolute top-0 left-0 cursor-crosshair"
                  onClick={handleCanvasClick}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}