// src/features/components/OptimizedCanvasRenderer.tsx

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { usePDFEditor } from '../pdf-editor/PDFEditorContext';
import { usePerformanceOptimization } from '../hooks/usePerformanceOptimization';

interface OptimizedCanvasRendererProps {
  pageNumber: number;
  scale: number;
  className?: string;
}

export const OptimizedCanvasRenderer: React.FC<OptimizedCanvasRendererProps> = ({
  pageNumber,
  scale,
  className = ''
}) => {
  const { state } = usePDFEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number>();
  
  const { 
    debouncedRender, 
    optimizeCanvasRendering,
    cancelRenderTask 
  } = usePerformanceOptimization();

  // Memoize viewport calculations
  const viewport = useMemo(() => {
    if (!state.pdfDocument) return null;
    // This would typically come from the PDF page, but we'll simulate it
    return {
      width: 800 * scale,
      height: 1000 * scale,
      scale
    };
  }, [scale, state.pdfDocument]);

  // Create offscreen canvas for better performance
  const createOffscreenCanvas = useCallback(() => {
    if (!viewport) return null;
    
    const offscreen = document.createElement('canvas');
    offscreen.width = viewport.width;
    offscreen.height = viewport.height;
    offscreenCanvasRef.current = offscreen;
    
    return offscreen;
  }, [viewport]);

  // Optimized render function with batching
  const renderWithBatching = useCallback(() => {
    if (!canvasRef.current || !viewport) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions if changed
    if (canvas.width !== viewport.width || canvas.height !== viewport.height) {
      canvas.width = viewport.width;
      canvas.height = viewport.height;
    }

    // Optimize canvas settings
    optimizeCanvasRendering(canvas);

    // Use requestAnimationFrame for smooth rendering
    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Batch render all elements for this page
      const pageElements = {
        annotations: state.annotations[pageNumber] || [],
        textElements: state.textElements[pageNumber] || [],
        imageElements: state.imageElements[pageNumber] || [],
        whiteoutBlocks: state.whiteoutBlocks[pageNumber] || [],
        freeformElements: state.freeformElements[pageNumber] || [],
        formFields: state.formFields[pageNumber] || []
      };

      // Render elements in optimal order (background to foreground)
      renderWhiteoutBlocks(ctx, pageElements.whiteoutBlocks);
      renderAnnotations(ctx, pageElements.annotations);
      renderFreeformElements(ctx, pageElements.freeformElements);
      renderTextElements(ctx, pageElements.textElements);
      renderImageElements(ctx, pageElements.imageElements);
      renderFormFields(ctx, pageElements.formFields);
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(render);
  }, [viewport, pageNumber, state, optimizeCanvasRendering]);

  // Render functions for different element types
  const renderWhiteoutBlocks = useCallback((ctx: CanvasRenderingContext2D, blocks: any[]) => {
    blocks.forEach(block => {
      ctx.save();
      ctx.fillStyle = block.color || '#ffffff';
      ctx.fillRect(block.x, block.y, block.width, block.height);
      ctx.restore();
    });
  }, []);

  const renderAnnotations = useCallback((ctx: CanvasRenderingContext2D, annotations: any[]) => {
    annotations.forEach(annotation => {
      ctx.save();
      ctx.strokeStyle = annotation.color || '#000000';
      ctx.lineWidth = annotation.strokeWidth || 2;
      
      switch (annotation.type) {
        case 'rectangle':
          ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(annotation.x + annotation.width/2, annotation.y + annotation.height/2, 
                 Math.min(annotation.width, annotation.height)/2, 0, 2 * Math.PI);
          ctx.stroke();
          break;
        case 'line':
          ctx.beginPath();
          ctx.moveTo(annotation.startX, annotation.startY);
          ctx.lineTo(annotation.endX, annotation.endY);
          ctx.stroke();
          break;
      }
      ctx.restore();
    });
  }, []);

  const renderFreeformElements = useCallback((ctx: CanvasRenderingContext2D, elements: any[]) => {
    elements.forEach(element => {
      if (!element.path || element.path.length < 2) return;
      
      ctx.save();
      ctx.strokeStyle = element.color || '#000000';
      ctx.lineWidth = element.strokeWidth || 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(element.path[0].x, element.path[0].y);
      
      for (let i = 1; i < element.path.length; i++) {
        ctx.lineTo(element.path[i].x, element.path[i].y);
      }
      
      ctx.stroke();
      ctx.restore();
    });
  }, []);

  const renderTextElements = useCallback((ctx: CanvasRenderingContext2D, elements: any[]) => {
    elements.forEach(element => {
      ctx.save();
      ctx.fillStyle = element.color || '#000000';
      ctx.font = `${element.fontSize || 16}px ${element.fontFamily || 'Arial'}`;
      ctx.fillText(element.text, element.x, element.y);
      ctx.restore();
    });
  }, []);

  const renderImageElements = useCallback((ctx: CanvasRenderingContext2D, elements: any[]) => {
    elements.forEach(element => {
      if (element.imageData) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, element.x, element.y, element.width, element.height);
        };
        img.src = element.imageData;
      }
    });
  }, []);

  const renderFormFields = useCallback((ctx: CanvasRenderingContext2D, fields: any[]) => {
    fields.forEach(field => {
      ctx.save();
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.strokeRect(field.x, field.y, field.width, field.height);
      
      if (field.value) {
        ctx.fillStyle = '#000000';
        ctx.font = `${field.fontSize || 14}px Arial`;
        ctx.fillText(field.value, field.x + 4, field.y + field.height/2 + 4);
      }
      ctx.restore();
    });
  }, []);

  // Debounced render when state changes
  useEffect(() => {
    debouncedRender(renderWithBatching, 16); // ~60fps
  }, [debouncedRender, renderWithBatching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      cancelRenderTask();
    };
  }, [cancelRenderTask]);

  return (
    <canvas
      ref={canvasRef}
      className={`optimized-canvas ${className}`}
      style={{
        display: 'block',
        maxWidth: '100%',
        height: 'auto'
      }}
    />
  );
};
