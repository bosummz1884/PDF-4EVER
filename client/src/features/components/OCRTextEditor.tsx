import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Edit2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { OCRResult } from "@/types/pdf-types";

interface OCRTextEditorProps {
  result: OCRResult;
  onSave: (result: OCRResult, newText: string) => void;
  onCancel: () => void;
  scale?: number;
  className?: string;
}

export const OCRTextEditor: React.FC<OCRTextEditorProps> = ({
  result,
  onSave,
  onCancel,
  scale = 1,
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(result.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate position and size based on bounding box and scale
  const style = {
    position: 'absolute' as const,
    left: `${result.boundingBox.x0 / scale}px`,
    top: `${result.boundingBox.y0 / scale}px`,
    width: `${(result.boundingBox.x1 - result.boundingBox.x0) / scale}px`,
    minHeight: `${(result.boundingBox.y1 - result.boundingBox.y0) / scale}px`,
    zIndex: 1000,
    transform: 'translateZ(0)', // Force hardware acceleration
  };

  // Focus the textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Select all text for easier editing
      textareaRef.current.setSelectionRange(0, editedText.length);
    }
  }, [isEditing, editedText.length]);

  const handleSave = () => {
    onSave(result, editedText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(result.text); // Reset to original text
    onCancel();
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div 
        className={cn(
          'group relative border border-transparent hover:border-blue-400 bg-yellow-50/50 hover:bg-yellow-100/70 rounded p-1 cursor-text',
          className
        )}
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      >
        <div className="text-xs text-gray-800 break-words whitespace-pre-wrap">
          {editedText}
        </div>
        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full bg-white shadow-sm hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'bg-white border-2 border-blue-400 rounded shadow-lg p-2 z-50',
        className
      )}
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      <Textarea
        ref={textareaRef}
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full min-h-[60px] text-sm p-2 mb-2"
        autoFocus
      />
      <div className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCancel}
          className="h-8"
        >
          <X className="h-3 w-3 mr-1" /> Cancel
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleSave}
          className="h-8"
        >
          <Check className="h-3 w-3 mr-1" /> Save
        </Button>
      </div>
    </div>
  );
};
