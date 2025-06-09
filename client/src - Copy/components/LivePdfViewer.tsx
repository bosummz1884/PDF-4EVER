import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LivePdfViewerProps {
  pdfBytes: ArrayBuffer | null;
  onPageClick?: (x: number, y: number, pageIndex: number) => void;
  onTextSelect?: (text: string, pageIndex: number) => void;
  className?: string;
}

export default function LivePdfViewer({ 
  pdfBytes, 
  onPageClick, 
  onTextSelect,
  className = '' 
}: LivePdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isLoading, setIsLoading] = useState(false);
  const [rotation, setRotation] = useState(0);

  // Load PDF when bytes change
  useEffect(() => {
    if (!pdfBytes) {
      setPdfDoc(null);
      setTotalPages(0);
      setCurrentPage(1);
      return;
    }

    loadPdf();
  }, [pdfBytes]);

  // Render page when doc, page, scale, or rotation changes
  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage();
    }
  }, [pdfDoc, currentPage, scale, rotation]);

  const loadPdf = async () => {
    if (!pdfBytes) return;

    try {
      setIsLoading(true);
      const loadingTask = pdfjsLib.getDocument(pdfBytes);
      const pdf = await loadingTask.promise;
      
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPage = async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Calculate viewport
      const viewport = page.getViewport({ scale, rotation });
      
      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Clear canvas
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        return;
      }

      // Render page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Handle text selection if callback provided
      if (onTextSelect) {
        const textContent = await page.getTextContent();
        // Store text content for selection handling
        (canvas as any).textContent = textContent;
      }
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onPageClick || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;

    onPageClick(x, y, currentPage - 1); // Convert to 0-based index
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setScale(1.5);
    setRotation(0);
  };

  const rotatePage = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        goToPreviousPage();
        break;
      case 'ArrowRight':
        goToNextPage();
        break;
      case '+':
      case '=':
        event.preventDefault();
        zoomIn();
        break;
      case '-':
        event.preventDefault();
        zoomOut();
        break;
      case '0':
        event.preventDefault();
        resetZoom();
        break;
    }
  };

  if (!pdfBytes) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] bg-muted/20 rounded-lg ${className}`}>
        <p className="text-muted-foreground">No PDF loaded</p>
      </div>
    );
  }

  return (
    <div 
      className={`relative bg-white dark:bg-gray-900 rounded-lg shadow-sm border ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/10">
        <div className="flex items-center gap-2">
          <Button
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            size="sm"
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium px-2">
            {currentPage} / {totalPages}
          </span>
          
          <Button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            size="sm"
            variant="outline"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={zoomOut} size="sm" variant="outline">
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm px-2 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <Button onClick={zoomIn} size="sm" variant="outline">
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button onClick={rotatePage} size="sm" variant="outline">
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button onClick={resetZoom} size="sm" variant="outline">
            Reset
          </Button>
        </div>
      </div>

      {/* PDF Canvas Container */}
      <div 
        ref={containerRef}
        className="relative overflow-auto max-h-[600px] bg-gray-100 dark:bg-gray-800"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        
        <div className="flex justify-center p-4">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="border shadow-lg cursor-crosshair max-w-full"
            style={{ 
              transform: `scale(${Math.min(1, (containerRef.current?.clientWidth || 800) / 800)})`,
              transformOrigin: 'top center'
            }}
          />
        </div>
      </div>

      {/* Status indicator */}
      {isLoading && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-2 py-1 rounded text-xs">
          Processing...
        </div>
      )}
    </div>
  );
}