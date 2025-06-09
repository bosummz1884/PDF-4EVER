import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface PDFViewerControlsProps {
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const PDFViewerControls: React.FC<PDFViewerControlsProps> = ({
  currentPage,
  totalPages,
  zoomLevel,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 mb-4 p-2 bg-muted/50 rounded-lg border border-border">
      <div className="flex items-center gap-2">
        <Button 
          onClick={onPrev} 
          disabled={currentPage <= 1}
          variant="outline"
          size="sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <span className="text-sm font-medium text-foreground min-w-[80px] text-center">
          {currentPage} / {totalPages}
        </span>
        
        <Button 
          onClick={onNext} 
          disabled={currentPage >= totalPages}
          variant="outline"
          size="sm"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          onClick={onZoomOut} 
          disabled={zoomLevel <= 0.5}
          variant="outline"
          size="sm"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        
        <span className="text-sm font-medium text-foreground min-w-[60px] text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        
        <Button 
          onClick={onZoomIn} 
          disabled={zoomLevel >= 3}
          variant="outline"
          size="sm"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default PDFViewerControls;