// src/features/hooks/usePerformanceOptimization.ts

import { useEffect, useRef, useCallback } from 'react';
import { usePDFEditor } from '../pdf-editor/PDFEditorContext';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  elementCount: number;
}

export const usePerformanceOptimization = () => {
  const { state } = usePDFEditor();
  const renderTaskRef = useRef<any>(null);
  const performanceMetricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    elementCount: 0
  });

  // Cancel any pending render tasks when component unmounts or page changes
  const cancelRenderTask = useCallback(() => {
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }
  }, []);

  // Memory cleanup for large files
  const cleanupMemory = useCallback(() => {
    // Force garbage collection if available (development only)
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }

    // Clear unused canvas contexts
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    // Clear blob URLs to prevent memory leaks
    const blobUrls = document.querySelectorAll('img[src^="blob:"]');
    blobUrls.forEach(img => {
      const src = (img as HTMLImageElement).src;
      if (src.startsWith('blob:')) {
        URL.revokeObjectURL(src);
      }
    });
  }, []);

  // Debounced render function to prevent excessive re-renders
  const debouncedRender = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (renderFn: () => void, delay: number = 16) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(renderFn, delay);
      };
    })(),
    []
  );

  // Calculate performance metrics
  const calculateMetrics = useCallback(() => {
    const startTime = performance.now();
    
    // Count total elements across all pages
    const elementCount = Object.values(state.annotations).flat().length +
                        Object.values(state.textElements).flat().length +
                        Object.values(state.imageElements).flat().length +
                        Object.values(state.whiteoutBlocks).flat().length +
                        Object.values(state.freeformElements).flat().length +
                        Object.values(state.formFields).flat().length;

    // Estimate memory usage (rough calculation)
    const memoryUsage = elementCount * 1024 + // Approximate 1KB per element
                       (state.originalPdfData?.length || 0);

    performanceMetricsRef.current = {
      renderTime: performance.now() - startTime,
      memoryUsage,
      elementCount
    };

    return performanceMetricsRef.current;
  }, [state]);

  // Optimize canvas rendering
  const optimizeCanvasRendering = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Enable hardware acceleration
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Use requestAnimationFrame for smooth rendering
    const render = () => {
      // Only render if canvas is visible
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Batch DOM updates
      requestAnimationFrame(() => {
        // Rendering logic here
      });
    };

    return render;
  }, []);

  // Lazy loading implementation for multi-page PDFs
  const shouldRenderPage = useCallback((pageNumber: number) => {
    const currentPage = state.currentPage;
    const preloadRange = 2; // Preload 2 pages before and after current page
    
    return Math.abs(pageNumber - currentPage) <= preloadRange;
  }, [state.currentPage]);

  // Memory leak detection and prevention
  useEffect(() => {
    const checkMemoryLeaks = () => {
      const metrics = calculateMetrics();
      
      // Log warning if memory usage is high
      if (metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB threshold
        console.warn('High memory usage detected:', metrics.memoryUsage / (1024 * 1024), 'MB');
        cleanupMemory();
      }
    };

    const interval = setInterval(checkMemoryLeaks, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [calculateMetrics, cleanupMemory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRenderTask();
      cleanupMemory();
    };
  }, [cancelRenderTask, cleanupMemory]);

  return {
    cancelRenderTask,
    cleanupMemory,
    debouncedRender,
    calculateMetrics,
    optimizeCanvasRendering,
    shouldRenderPage,
    performanceMetrics: performanceMetricsRef.current,
    setRenderTask: (task: any) => {
      renderTaskRef.current = task;
    }
  };
};
