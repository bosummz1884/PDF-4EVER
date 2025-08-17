// src/components/navigation/PageNavigationControls.tsx

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';
import { usePDFEditor } from '../../features/pdf-editor/PDFEditorContext';

interface PageNavigationControlsProps {
  className?: string;
  showThumbnails?: boolean;
  onToggleThumbnails?: () => void;
}

export function PageNavigationControls({ 
  className = "", 
  showThumbnails = false, 
  onToggleThumbnails 
}: PageNavigationControlsProps) {
  const { state, dispatch } = usePDFEditor();
  const { currentPage, totalPages, scale, rotation } = state;
  
  const [pageInput, setPageInput] = useState(currentPage.toString());

  // Update input when currentPage changes externally
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Navigation handlers
  const goToFirstPage = () => {
    if (currentPage > 1) {
      dispatch({ type: 'SET_CURRENT_PAGE', payload: 1 });
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      dispatch({ type: 'SET_CURRENT_PAGE', payload: currentPage - 1 });
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      dispatch({ type: 'SET_CURRENT_PAGE', payload: currentPage + 1 });
    }
  };

  const goToLastPage = () => {
    if (currentPage < totalPages) {
      dispatch({ type: 'SET_CURRENT_PAGE', payload: totalPages });
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNumber = parseInt(pageInput, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      dispatch({ type: 'SET_CURRENT_PAGE', payload: pageNumber });
    } else {
      // Reset to current page if invalid
      setPageInput(currentPage.toString());
    }
  };

  const handlePageInputBlur = () => {
    const pageNumber = parseInt(pageInput, 10);
    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
      setPageInput(currentPage.toString());
    }
  };

  // Zoom handlers
  const handleZoom = (direction: 'in' | 'out' | 'fit') => {
    const newScale = direction === 'in' 
      ? Math.min(scale * 1.25, 3.0) 
      : direction === 'out' 
        ? Math.max(scale * 0.8, 0.25) 
        : 1.0;
    dispatch({ type: 'SET_SCALE', payload: newScale });
  };

  // Rotation handler
  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    dispatch({ type: 'SET_ROTATION', payload: newRotation });
  };

  // Keyboard navigation
  // reason: Document-level listeners use the native `KeyboardEvent`, not React's synthetic event.
  const handleKeyDown = (e: KeyboardEvent) => {
    // Don't intercept when typing in inputs/textareas or contenteditable elements
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    ) {
      return;
    }

    switch (e.key) {
      case 'ArrowLeft':
        if (!e.shiftKey) {
          e.preventDefault();
          goToPreviousPage();
        }
        break;
      case 'ArrowRight':
        if (!e.shiftKey) {
          e.preventDefault();
          goToNextPage();
        }
        break;
      case 'Home':
        e.preventDefault();
        goToFirstPage();
        break;
      case 'End':
        e.preventDefault();
        goToLastPage();
        break;
    }
  };

  // Add keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  if (totalPages <= 1) {
    return null; // Don't show navigation for single-page documents
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* First Page Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={goToFirstPage}
        disabled={currentPage === 1}
        title="First Page (Home)"
        className="h-8 w-8 p-0"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>

      {/* Previous Page Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={goToPreviousPage}
        disabled={currentPage === 1}
        title="Previous Page (←)"
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page Input */}
      <div className="flex items-center gap-1">
        <form onSubmit={handlePageInputSubmit} className="flex items-center">
          <Input
            type="text"
            value={pageInput}
            onChange={handlePageInputChange}
            onBlur={handlePageInputBlur}
            className="w-12 h-8 text-center text-sm border-gray-300"
            title="Current Page"
          />
        </form>
        <span className="text-sm text-gray-500">/ {totalPages}</span>
      </div>

      {/* Next Page Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={goToNextPage}
        disabled={currentPage === totalPages}
        title="Next Page (→)"
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Last Page Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={goToLastPage}
        disabled={currentPage === totalPages}
        title="Last Page (End)"
        className="h-8 w-8 p-0"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Zoom Controls */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleZoom('out')}
        title="Zoom Out"
        className="h-8 w-8 p-0"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      <span className="text-sm font-medium min-w-12 text-center">
        {Math.round(scale * 100)}%
      </span>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleZoom('in')}
        title="Zoom In"
        className="h-8 w-8 p-0"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleZoom('fit')}
        title="Fit to Page"
        className="h-8 px-2 text-xs"
      >
        Fit
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Rotate Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRotate}
        title="Rotate 90°"
        className="h-8 w-8 p-0"
      >
        <RotateCw className="h-4 w-4" />
      </Button>

      {/* Thumbnails Toggle (if provided) */}
      {onToggleThumbnails && (
        <>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button
            variant={showThumbnails ? "default" : "ghost"}
            size="sm"
            onClick={onToggleThumbnails}
            title="Toggle Thumbnails"
            className="h-8 w-8 p-0"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
