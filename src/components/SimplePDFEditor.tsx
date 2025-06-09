import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Plus,
  Minus
} from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';

interface SimplePDFEditorProps {
  className?: string;
}

export function SimplePDFEditor({ className }: SimplePDFEditorProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTool, setCurrentTool] = useState<string>("select");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Configure PDF.js worker
  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
  }, []);

  const tools = [
    { id: "select", icon: Move, label: "Select" },
    { id: "text", icon: Type, label: "Add Text" },
    { id: "edit", icon: Edit, label: "Edit Text" },
    { id: "signature", icon: Signature, label: "Sign" },
    { id: "annotation", icon: Pen, label: "Annotate" },
    { id: "shape", icon: Square, label: "Shapes" },
  ];

  const loadPDF = async (file: File) => {
    try {
      setIsLoading(true);
      console.log('Loading PDF file:', file.name);
      
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      
      console.log('PDF loaded successfully:', file.name, 'Pages:', pdf.numPages);
      
      // Render first page
      await renderPage(pdf, 1);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setIsLoading(false);
    }
  };

  const renderPage = async (pdf: any, pageNum: number) => {
    try {
      console.log(`Rendering page ${pageNum} with zoom ${zoom}`);
      
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      
      if (!canvas) {
        console.error('Canvas not found');
        return;
      }

      const context = canvas.getContext('2d');
      if (!context) {
        console.error('Canvas context not available');
        return;
      }

      // Get the original viewport
      const originalViewport = page.getViewport({ scale: 1, rotation: rotation });
      
      // Calculate scaled viewport
      const scaledViewport = page.getViewport({ 
        scale: zoom,
        rotation: rotation 
      });
      
      // Set canvas size
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      
      console.log(`Canvas dimensions: ${canvas.width}x${canvas.height}`);
      
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set white background
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
        enableWebGL: false
      };
      
      console.log('Starting render...');
      const renderTask = page.render(renderContext);
      
      await renderTask.promise;
      console.log(`Page ${pageNum} rendered successfully`);
      
    } catch (error) {
      console.error('Error rendering page:', error);
    }
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

  const goToPreviousPage = async () => {
    if (currentPage > 1 && pdfDocument) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      await renderPage(pdfDocument, newPage);
    }
  };

  const goToNextPage = async () => {
    if (currentPage < totalPages && pdfDocument) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      await renderPage(pdfDocument, newPage);
    }
  };

  const handleZoomIn = async () => {
    const newZoom = Math.min(3.0, zoom + 0.25);
    setZoom(newZoom);
    if (pdfDocument) {
      await renderPage(pdfDocument, currentPage);
    }
  };

  const handleZoomOut = async () => {
    const newZoom = Math.max(0.25, zoom - 0.25);
    setZoom(newZoom);
    if (pdfDocument) {
      await renderPage(pdfDocument, currentPage);
    }
  };

  const handleRotate = async () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    if (pdfDocument) {
      await renderPage(pdfDocument, currentPage);
    }
  };

  const handleDownload = () => {
    if (pdfFile) {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfFile);
      link.download = pdfFile.name || "document.pdf";
      link.click();
    }
  };

  return (
    <div className={`h-full flex ${className}`}>
      {/* Toolbar */}
      <div className="w-20 bg-gray-50 dark:bg-gray-800 border-r flex flex-col items-center py-4 space-y-3">
        {/* Upload */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="w-14 h-14 p-0 flex flex-col"
          title="Upload PDF"
        >
          <Upload className="h-5 w-5" />
          <span className="text-xs mt-1">Upload</span>
        </Button>

        <div className="border-t w-12 my-2" />

        {/* Tools */}
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={currentTool === tool.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setCurrentTool(tool.id)}
            className="w-14 h-14 p-0 flex flex-col"
            title={tool.label}
          >
            <tool.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{tool.label.split(" ")[0]}</span>
          </Button>
        ))}

        <div className="border-t w-12 my-2" />

        {/* Actions */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRotate}
          className="w-14 h-14 p-0 flex flex-col"
          title="Rotate"
          disabled={!pdfDocument}
        >
          <RotateCw className="h-5 w-5" />
          <span className="text-xs mt-1">Rotate</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="w-14 h-14 p-0 flex flex-col"
          title="Download"
          disabled={!pdfFile}
        >
          <Download className="h-5 w-5" />
          <span className="text-xs mt-1">Save</span>
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
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
              
              <span className="text-sm font-medium min-w-[100px] text-center">
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
                onClick={handleZoomOut}
                disabled={zoom <= 0.25}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <span className="text-sm font-medium min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3.0}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900" ref={containerRef}>
          {!pdfDocument ? (
            <div
              className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 m-8 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Drop your PDF here or click to upload
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supports PDF files up to 50MB
                </p>
                {isLoading && (
                  <div className="mt-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading PDF...</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center p-8">
              <div className="bg-white shadow-lg">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto border border-gray-200"
                  style={{ 
                    display: 'block',
                    margin: '0 auto'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}