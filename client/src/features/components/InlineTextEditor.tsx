import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Type, Palette } from "lucide-react";
import { InlineTextEditorProps, DetectedFont } from "@/types/pdf-types";
import { cn } from "@/lib/utils";
import { fontRecognitionService } from "@/services/fontRecognitionService";

export function InlineTextEditor({
  textRegion,
  onSave,
  onCancel,
  scale,
  rotation,
  detectedFonts = []
}: InlineTextEditorProps & { detectedFonts?: DetectedFont[] }) {
  const [editedText, setEditedText] = useState(textRegion.text);
  const [isMultiline, setIsMultiline] = useState(textRegion.text.length > 50);
  const [showPreview, setShowPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Enhanced font matching using detected fonts
  const matchedFont = useMemo(() => {
    if (!textRegion.originalFontInfo?.fontFamily || !detectedFonts.length) {
      return textRegion.originalFontInfo?.fontFamily || 'Arial';
    }
    
    const bestMatch = fontRecognitionService.findBestFontMatch(
      textRegion.originalFontInfo.fontFamily,
      detectedFonts
    );
    
    if (bestMatch) {
      // Generate a proper font stack for better fallback support
      return fontRecognitionService.generateFontStack(bestMatch);
    }
    
    return textRegion.originalFontInfo.fontFamily;
  }, [textRegion.originalFontInfo, detectedFonts]);

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

  // Enhanced font styling with better matching and overflow handling
  const fontStyle = {
    fontFamily: matchedFont,
    fontSize: `${Math.max(textRegion.fontSize * scale, 12)}px`, // Minimum readable size
    fontWeight: textRegion.fontWeight,
    fontStyle: textRegion.fontStyle,
    color: textRegion.color,
    lineHeight: 1.2,
    transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
    wordWrap: 'break-word' as const,
    overflowWrap: 'break-word' as const,
    hyphens: 'auto' as const
  };
  
  // Calculate if text will overflow
  const textMetrics = useMemo(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { willOverflow: false, estimatedHeight: textRegion.height };
    
    ctx.font = `${fontStyle.fontWeight} ${fontStyle.fontSize} ${fontStyle.fontFamily}`;
    const textWidth = ctx.measureText(editedText).width;
    const availableWidth = textRegion.width * scale - 8; // Account for padding
    
    const willOverflow = textWidth > availableWidth;
    const lines = Math.ceil(textWidth / availableWidth);
    const estimatedHeight = lines * (textRegion.fontSize * scale * 1.2);
    
    return { willOverflow, estimatedHeight, lines };
  }, [editedText, fontStyle, textRegion, scale]);

  return (
    <div 
      className="absolute z-50 animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        left: textRegion.x * scale,
        top: textRegion.y * scale,
        width: textRegion.width * scale,
        minHeight: Math.max(textRegion.height * scale, textMetrics.estimatedHeight)
      }}
      data-testid="inline-text-editor"
    >
      {/* Overlay Background with overflow indicator */}
      <div className={cn(
        "absolute inset-0 rounded-sm shadow-lg -z-10",
        textMetrics.willOverflow 
          ? "bg-yellow-50 border-2 border-yellow-400" 
          : "bg-blue-50 border-2 border-primary"
      )} />
      
      {/* Overflow warning */}
      {textMetrics.willOverflow && (
        <div className="absolute -top-6 right-0 text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
          Text may overflow ({textMetrics.lines} lines)
        </div>
      )}
      
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
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowPreview(!showPreview)}
          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          title="Toggle Preview"
          data-testid="button-preview"
        >
          <Palette className="h-3 w-3" />
        </Button>
      </div>
      
      {/* Real-time Preview */}
      {showPreview && (
        <div className="absolute -right-2 top-0 w-48 bg-white border border-gray-200 rounded-md shadow-lg p-2 z-10">
          <div className="text-xs text-gray-500 mb-1">Preview:</div>
          <div 
            className="text-sm border border-gray-100 rounded p-1 bg-gray-50"
            style={{
              fontFamily: matchedFont,
              fontSize: '12px',
              fontWeight: textRegion.fontWeight,
              fontStyle: textRegion.fontStyle,
              color: textRegion.color,
              wordWrap: 'break-word'
            }}
          >
            {editedText || 'Type to see preview...'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Font: {matchedFont}
            {textMetrics.willOverflow && <span className="text-yellow-600"> ⚠ Overflow</span>}
          </div>
        </div>
      )}

      {/* Resize Handle */}
      <div 
        className="absolute -right-1 -bottom-1 w-3 h-3 bg-primary rounded-full cursor-se-resize shadow-sm"
        title="Resize"
        data-testid="resize-handle"
      />
    </div>
  );
}
