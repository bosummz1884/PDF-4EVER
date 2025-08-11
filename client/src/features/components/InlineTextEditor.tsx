import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Type } from "lucide-react";
import { InlineTextEditorProps } from "@/types/pdf-types";
import { cn } from "@/lib/utils";

export function InlineTextEditor({
  textRegion,
  onSave,
  onCancel,
  scale,
  rotation
}: InlineTextEditorProps) {
  const [editedText, setEditedText] = useState(textRegion.text);
  const [isMultiline, setIsMultiline] = useState(textRegion.text.length > 50);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus the input when editor mounts
    const focusElement = isMultiline ? textareaRef.current : inputRef.current;
    if (focusElement) {
      focusElement.focus();
      focusElement.select();
    }
  }, [isMultiline]);

  const handleSave = () => {
    onSave(editedText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isMultiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const fontStyle = {
    fontFamily: textRegion.originalFontInfo?.fontFamily || 'Arial',
    fontSize: `${textRegion.fontSize * scale}px`,
    fontWeight: textRegion.fontWeight,
    fontStyle: textRegion.fontStyle,
    color: textRegion.color,
    lineHeight: 1.2,
    transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined
  };

  return (
    <div 
      className="absolute z-50 animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        left: textRegion.x * scale,
        top: textRegion.y * scale,
        width: textRegion.width * scale,
        minHeight: textRegion.height * scale
      }}
      data-testid="inline-text-editor"
    >
      {/* Overlay Background */}
      <div className="absolute inset-0 bg-blue-50 border-2 border-primary rounded-sm shadow-lg -z-10" />
      
      {/* Editable Input */}
      {isMultiline ? (
        <textarea
          ref={textareaRef}
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full h-full px-2 py-1 bg-transparent resize-none outline-none",
            "border-none focus:ring-0"
          )}
          style={fontStyle}
          data-testid="textarea-editor"
        />
      ) : (
        <Input
          ref={inputRef}
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full h-full px-2 py-1 bg-transparent border-none focus:ring-0",
            "focus-visible:ring-0 focus-visible:ring-offset-0"
          )}
          style={fontStyle}
          data-testid="input-editor"
        />
      )}

      {/* Control Buttons */}
      <div className="absolute -top-10 left-0 flex items-center gap-1 bg-white shadow-lg rounded-md border border-gray-200 p-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          title="Save Changes"
          data-testid="button-save"
        >
          <Check className="h-3 w-3" />
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Cancel"
          data-testid="button-cancel"
        >
          <X className="h-3 w-3" />
        </Button>
        
        <div className="w-px h-4 bg-gray-300 mx-1" />
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsMultiline(!isMultiline)}
          className="h-6 w-6 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
          title="Toggle Multiline"
          data-testid="button-multiline"
        >
          <Type className="h-3 w-3" />
        </Button>
      </div>

      {/* Resize Handle */}
      <div 
        className="absolute -right-1 -bottom-1 w-3 h-3 bg-primary rounded-full cursor-se-resize shadow-sm"
        title="Resize"
        data-testid="resize-handle"
      />
    </div>
  );
}
