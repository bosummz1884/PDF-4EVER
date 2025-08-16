// src/components/navigation/ThumbnailNavigation.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { X } from 'lucide-react';
import { usePDFEditor } from '../../features/pdf-editor/PDFEditorContext';

interface ThumbnailNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface ThumbnailCache {
  [pageNumber: number]: string; // Base64 data URL
}

export function ThumbnailNavigation({ isOpen, onClose, className = "" }: ThumbnailNavigationProps) {
  const { state, dispatch } = usePDFEditor();
  const { pdfDocument, currentPage, totalPages } = state;
  
  const [thumbnailCache, setThumbnailCache] = useState<ThumbnailCache>({});
  const [loadingThumbnails, setLoadingThumbnails] = useState<Set<number>>(new Set());
  const thumbnailRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});

  // Thumbnail generation function
  const generateThumbnail = useCallback(async (pageNumber: number) => {
    if (!pdfDocument || thumbnailCache[pageNumber] || loadingThumbnails.has(pageNumber)) {
      return;
    }

    setLoadingThumbnails(prev => new Set(prev).add(pageNumber));

    try {
      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 0.2 }); // Small scale for thumbnails
      
      // Create canvas for thumbnail
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      // Convert to data URL and cache
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setThumbnailCache(prev => ({
        ...prev,
        [pageNumber]: dataUrl
      }));

    } catch (error) {
      console.error(`Failed to generate thumbnail for page ${pageNumber}:`, error);
    } finally {
      setLoadingThumbnails(prev => {
        const newSet = new Set(prev);
        newSet.delete(pageNumber);
        return newSet;
      });
    }
  }, [pdfDocument, thumbnailCache, loadingThumbnails]);

  // Generate thumbnails for visible pages
  useEffect(() => {
    if (!isOpen || !pdfDocument) return;

    // Generate thumbnails for current page and nearby pages first
    const pagesToGenerate = [];
    const range = 3; // Generate 3 pages before and after current page
    
    for (let i = Math.max(1, currentPage - range); i <= Math.min(totalPages, currentPage + range); i++) {
      pagesToGenerate.push(i);
    }

    // Generate thumbnails with priority for current page
    pagesToGenerate.forEach((pageNum, index) => {
      setTimeout(() => generateThumbnail(pageNum), index * 50); // Stagger requests
    });

    // Generate remaining thumbnails in background
    const remainingPages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (!pagesToGenerate.includes(i)) {
        remainingPages.push(i);
      }
    }

    remainingPages.forEach((pageNum, index) => {
      setTimeout(() => generateThumbnail(pageNum), (pagesToGenerate.length + index) * 100);
    });

  }, [isOpen, pdfDocument, currentPage, totalPages, generateThumbnail]);

  // Handle page selection
  const handlePageSelect = (pageNumber: number) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: pageNumber });
    onClose(); // Close thumbnail panel after selection
  };

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentPage > 1) {
            dispatch({ type: 'SET_CURRENT_PAGE', payload: currentPage - 1 });
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentPage < totalPages) {
            dispatch({ type: 'SET_CURRENT_PAGE', payload: currentPage + 1 });
          }
          break;
        case 'Enter':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPage, totalPages, dispatch, onClose]);

  if (!isOpen || !pdfDocument) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center ${className}`}>
      <Card className="w-11/12 h-5/6 max-w-6xl bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Page Thumbnails</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Thumbnail Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {Array.from({ length: totalPages }, (_, index) => {
              const pageNumber = index + 1;
              const isCurrentPage = pageNumber === currentPage;
              const thumbnail = thumbnailCache[pageNumber];
              const isLoading = loadingThumbnails.has(pageNumber);

              return (
                <div
                  key={pageNumber}
                  className={`relative cursor-pointer transition-all duration-200 ${
                    isCurrentPage 
                      ? 'ring-2 ring-blue-500 shadow-lg transform scale-105' 
                      : 'hover:shadow-md hover:scale-102'
                  }`}
                  onClick={() => handlePageSelect(pageNumber)}
                >
                  <Card className="aspect-[3/4] overflow-hidden">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={`Page ${pageNumber}`}
                        className="w-full h-full object-contain bg-white"
                      />
                    ) : isLoading ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <span className="text-gray-400 text-sm">Loading...</span>
                      </div>
                    )}
                  </Card>
                  
                  {/* Page Number Label */}
                  <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs font-medium ${
                    isCurrentPage 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-black bg-opacity-70 text-white'
                  }`}>
                    {pageNumber}
                  </div>

                  {/* Current Page Indicator */}
                  {isCurrentPage && (
                    <div className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with Instructions */}
        <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>Click a thumbnail to navigate to that page</span>
            <span>Press ESC to close • Use arrow keys to navigate</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
