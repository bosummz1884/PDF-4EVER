import React, { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
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
  const [isMultiline] = useState(textRegion.text.length > 50);
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
    // Focus the input when editor mounts and place caret at end of text
    // reason: user wants to immediately continue typing at the end without confirm/cancel
    const focusElement = isMultiline ? textareaRef.current : inputRef.current;
    if (focusElement) {
      focusElement.focus();
      const len = editedText.length;
      try {
        // Set caret to end without selecting the whole text
        (focusElement as HTMLInputElement | HTMLTextAreaElement).setSelectionRange?.(len, len);
      } catch {}
    }
  }, [isMultiline, editedText.length]);

  const handleSave = () => {
    onSave(editedText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // reason: save on Enter for both single-line and multiline; Shift+Enter inserts newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    // reason: without explicit buttons, commit changes when leaving the editor
    handleSave();
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
      {/* Overlay Background - neutralized (no overflow tip) */}
      <div className={cn(
        "absolute inset-0 rounded-sm shadow-lg -z-10 bg-blue-50 border-2 border-primary"
      )} />
      
      {/* Editable Input */}
      {isMultiline ? (
        <textarea
          ref={textareaRef}
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
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
          onBlur={handleBlur}
          className={cn(
            "w-full h-full px-2 py-1 bg-transparent border-none focus:ring-0",
            "focus-visible:ring-0 focus-visible:ring-offset-0"
          )}
          style={fontStyle}
          data-testid="input-editor"
        />
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
