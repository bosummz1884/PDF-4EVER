import { useEffect, useRef, useState, useCallback } from 'react';
import LivePdfProcessor from '@/lib/livePdfProcessor';

export function useLivePdfProcessor() {
  const processorRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfStatus, setPdfStatus] = useState({
    hasDocument: false,
    pageCount: 0,
    annotationCount: 0,
    textElementCount: 0
  });
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  // Initialize processor
  useEffect(() => {
    if (!processorRef.current) {
      processorRef.current = new LivePdfProcessor();

      // Set up event listeners
      processorRef.current.addEventListener('processing', setIsProcessing);
      processorRef.current.addEventListener('loaded', (data) => {
        setPdfStatus(prev => ({ ...prev, hasDocument: true, pageCount: data.pageCount }));
        setError(null);
      });
      processorRef.current.addEventListener('updated', (pdfBytes) => {
        setLastUpdate(Date.now());
        setPdfStatus(processorRef.current.getStatus());
      });
      processorRef.current.addEventListener('error', setError);
      processorRef.current.addEventListener('textAdded', () => {
        setPdfStatus(processorRef.current.getStatus());
      });
      processorRef.current.addEventListener('annotationAdded', () => {
        setPdfStatus(processorRef.current.getStatus());
      });
      processorRef.current.addEventListener('pageDeleted', () => {
        setPdfStatus(processorRef.current.getStatus());
      });
      processorRef.current.addEventListener('pageInserted', () => {
        setPdfStatus(processorRef.current.getStatus());
      });
    }

    return () => {
      if (processorRef.current) {
        // Clean up event listeners
        processorRef.current.listeners = [];
      }
    };
  }, []);

  // Load PDF
  const loadPdf = useCallback(async (file) => {
    if (!processorRef.current) return { success: false, error: 'Processor not initialized' };
    
    try {
      const result = await processorRef.current.loadPdf(file);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Add text to PDF
  const addText = useCallback(async (pageIndex, text, x, y, options = {}) => {
    if (!processorRef.current) return false;
    
    try {
      return await processorRef.current.addText(pageIndex, text, x, y, options);
    } catch (error) {
      setError(error.message);
      return false;
    }
  }, []);

  // Add annotation to PDF
  const addAnnotation = useCallback(async (pageIndex, annotation) => {
    if (!processorRef.current) return false;
    
    try {
      return await processorRef.current.addAnnotation(pageIndex, annotation);
    } catch (error) {
      setError(error.message);
      return false;
    }
  }, []);

  // Delete page
  const deletePage = useCallback(async (pageIndex) => {
    if (!processorRef.current) return false;
    
    try {
      return await processorRef.current.deletePage(pageIndex);
    } catch (error) {
      setError(error.message);
      return false;
    }
  }, []);

  // Insert blank page
  const insertBlankPage = useCallback(async (afterPageIndex) => {
    if (!processorRef.current) return false;
    
    try {
      return await processorRef.current.insertBlankPage(afterPageIndex);
    } catch (error) {
      setError(error.message);
      return false;
    }
  }, []);

  // Export PDF
  const exportPdf = useCallback(async () => {
    if (!processorRef.current) return null;
    
    try {
      return await processorRef.current.exportPdf();
    } catch (error) {
      setError(error.message);
      return null;
    }
  }, []);

  // Reset to original
  const resetPdf = useCallback(() => {
    if (!processorRef.current) return;
    
    try {
      processorRef.current.reset();
      setError(null);
    } catch (error) {
      setError(error.message);
    }
  }, []);

  // Get current PDF bytes for preview
  const getCurrentPdfBytes = useCallback(() => {
    if (!processorRef.current) return null;
    return processorRef.current.currentPdfBytes;
  }, [lastUpdate]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isProcessing,
    pdfStatus,
    error,
    lastUpdate,
    
    // Methods
    loadPdf,
    addText,
    addAnnotation,
    deletePage,
    insertBlankPage,
    exportPdf,
    resetPdf,
    getCurrentPdfBytes,
    clearError,
    
    // Processor reference for advanced usage
    processor: processorRef.current
  };
}