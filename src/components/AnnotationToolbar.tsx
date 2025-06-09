import React from "react";
import { Button } from "@/components/ui/button";
import { Type, Highlighter, RotateCcw } from "lucide-react";

interface AnnotationToolbarProps {
  onTextInsert?: (text: string) => void;
  onHighlight?: () => void;
  onReset?: () => void;
}

const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  onTextInsert = () => {},
  onHighlight = () => {},
  onReset = () => {}
}) => {
  return (
    <div className="flex gap-4 my-4 justify-center flex-wrap p-4 bg-muted/50 rounded-lg border border-border">
      <Button 
        onClick={() => onTextInsert("CONFIDENTIAL")}
        className="bg-gradient-to-r from-primary via-secondary to-accent text-white hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
      >
        <Type className="w-4 h-4 mr-2" />
        Insert 'CONFIDENTIAL'
      </Button>
      
      <Button 
        onClick={onHighlight}
        variant="outline"
        className="border-primary hover:bg-primary/10"
      >
        <Highlighter className="w-4 h-4 mr-2" />
        Highlight Section
      </Button>
      
      <Button 
        onClick={onReset}
        variant="outline"
        className="border-destructive text-destructive hover:bg-destructive/10"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset PDF
      </Button>
    </div>
  );
};

export default AnnotationToolbar;