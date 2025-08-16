// src/features/components/LazyPageRenderer.tsx

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PDFPageProxy } from 'pdfjs-dist';
import { usePDFEditor } from '../pdf-editor/PDFEditorContext';
import { usePerformanceOptimization } from '../hooks/usePerformanceOptimization';

interface LazyPageRendererProps {
  pageNumber: number;
  scale: number;
  onPageRender?: (pageNumber: number, canvas: HTMLCanvasElement) => void;
}

export const LazyPageRenderer: React.FC<LazyPageRendererProps> = ({
  pageNumber,
  scale,
  onPageRender
}) => {
  const { state } = usePDFEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const renderTaskRef = useRef<any>(null);
  
  const { 
    shouldRenderPage, 
    cancelRenderTask, 
    optimizeCanvasRendering,
    setRenderTask 
  } = usePerformanceOptimization();

  // Intersection Observer for lazy loading
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before the element is visible
        threshold: 0.1
      }
    );

    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // Render page when in view and should render
  const renderPage = useCallback(async () => {
    if (!state.pdfDocument || !canvasRef.current || isRendered) return;
    if (!isInView && !shouldRenderPage(pageNumber)) return;

    try {
      // Cancel any existing render task
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page: PDFPageProxy = await state.pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Optimize canvas rendering
      optimizeCanvasRendering(canvas);

      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;
      setRenderTask(renderTask);

      await renderTask.promise;
      setIsRendered(true);
      
      // Callback for additional processing
      if (onPageRender) {
        onPageRender(pageNumber, canvas);
      }

    } catch (error: any) {
      if (error.name !== 'RenderingCancelledException') {
        console.error(`Error rendering page ${pageNumber}:`, error);
      }
    }
  }, [
    state.pdfDocument, 
    pageNumber, 
    scale, 
    isInView, 
    shouldRenderPage, 
    isRendered,
    optimizeCanvasRendering,
    setRenderTask,
    onPageRender
  ]);

  // Trigger render when conditions are met
  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Cleanup on unmount or page change
  useEffect(() => {
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pageNumber]);

  return (
    <div className="lazy-page-container">
      <canvas
        ref={canvasRef}
        className="pdf-page-canvas"
        style={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
          // Add loading placeholder
          backgroundColor: isRendered ? 'transparent' : '#f5f5f5',
          minHeight: isRendered ? 'auto' : '600px'
        }}
      />
      {!isRendered && isInView && (
        <div className="loading-overlay absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading page {pageNumber}...</span>
        </div>
      )}
    </div>
  );
};
