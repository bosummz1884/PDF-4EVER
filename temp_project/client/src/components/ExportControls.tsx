import React from "react";
import { Button } from "@/components/ui/button";
import { Download, PenTool, Eraser } from "lucide-react";

interface ExportControlsProps {
  onExport: () => Promise<void>;
  onToggleSignature: () => void;
  onClearAnnotations: () => void;
}

const ExportControls: React.FC<ExportControlsProps> = ({
  onExport,
  onToggleSignature,
  onClearAnnotations,
}) => {
  return (
    <div className="flex items-center gap-2 mb-4 p-2 bg-muted/50 rounded-lg border border-border">
      <Button 
        onClick={onExport}
        className="bg-gradient-to-r from-primary via-secondary to-accent text-white hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
      >
        <Download className="w-4 h-4 mr-2" />
        Export PDF
      </Button>
      
      <Button 
        onClick={onToggleSignature}
        variant="outline"
        size="sm"
      >
        <PenTool className="w-4 h-4 mr-2" />
        Signature
      </Button>
      
      <Button 
        onClick={onClearAnnotations}
        variant="outline"
        size="sm"
      >
        <Eraser className="w-4 h-4 mr-2" />
        Clear
      </Button>
    </div>
  );
};

export default ExportControls;