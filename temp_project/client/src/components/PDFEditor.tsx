import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  ChevronRight
} from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';

interface PDFEditorProps {
  className?: string;
}

export function PDFEditor({ className }: PDFEditorProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [currentTool, setCurrentTool] = useState<string>("select");
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      // Calculate viewport with zoom and rotation
      const viewport = page.getViewport({ 
        scale: zoom / 100,
        rotation: rotation 
      });
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
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

  const handleDownload = () => {
    if (pdfFile) {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfFile);
      link.download = pdfFile.name || "edited-document.pdf";
      link.click();
    }
  };

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    if (pdfDocument) {
      renderPage(pdfDocument, currentPage);
    }
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

  // Re-render when zoom changes
  useEffect(() => {
    if (pdfDocument && currentPage) {
      renderPage(pdfDocument, currentPage);
    }
  }, [zoom]);

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

        {/* View Controls */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setZoom(Math.min(zoom + 25, 200))}
          className="w-14 h-14 p-0 flex flex-col"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
          <span className="text-xs mt-1">Zoom+</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setZoom(Math.max(zoom - 25, 50))}
          className="w-14 h-14 p-0 flex flex-col"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
          <span className="text-xs mt-1">Zoom-</span>
        </Button>

        <div className="text-xs text-center text-muted-foreground">
          {zoom}%
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRotate}
          className="w-14 h-14 p-0 flex flex-col"
          title="Rotate"
        >
          <RotateCw className="h-4 w-4" />
          <span className="text-xs mt-1">Rotate</span>
        </Button>

        {pdfFile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="w-14 h-14 p-0 flex flex-col"
            title="Download"
          >
            <Download className="h-4 w-4" />
            <span className="text-xs mt-1">Save</span>
          </Button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 relative">
        {!pdfDocument ? (
          <div 
            className="h-full flex items-center justify-center p-8"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Card className="p-16 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 max-w-md">
              <Upload className="h-20 w-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-4">Upload Your PDF</h3>
              <p className="text-muted-foreground mb-6 text-lg">
                Drag and drop a PDF file here, or click to browse your files
              </p>
              <Button 
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Choose PDF File'}
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Your files are processed locally and never stored on our servers
              </p>
            </Card>
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center min-h-full">
            {/* Page Navigation */}
            {totalPages > 1 && (
              <div className="mb-4 flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
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
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* PDF Canvas */}
            <div 
              className="bg-white shadow-2xl border relative"
              style={{ 
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease'
              }}
            >
              <canvas
                ref={canvasRef}
                className="block max-w-full h-auto"
                style={{ 
                  cursor: currentTool === "select" ? "default" : "crosshair",
                  transform: `rotate(${rotation}deg)`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}