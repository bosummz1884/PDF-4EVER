import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InlineTextEditorProps, DetectedFont, FormattingState } from "@/types/pdf-types";
import { cn } from "@/lib/utils";
import { fontRecognitionService } from "@/services/fontRecognitionService";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";

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
  const [formatting, setFormatting] = useState<FormattingState>({
    bold: textRegion.fontWeight === 'bold',
    italic: textRegion.fontStyle === 'italic',
    underline: false,
    align: 'left',
    color: textRegion.color || '#000000',
    fontSize: textRegion.fontSize,
    fontFamily: textRegion.fontName
  });
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  
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
    // Formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          toggleFormat('bold');
          return;
        case 'i':
          e.preventDefault();
          toggleFormat('italic');
          return;
        case 'u':
          e.preventDefault();
          toggleFormat('underline');
          return;
      }
    }
    
    // Save/cancel
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't save if clicking on toolbar
    if (e.relatedTarget && editorRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    handleSave();
  };

  const toggleFormat = (format: keyof Omit<FormattingState, 'fontSize' | 'fontFamily' | 'color' | 'align'>) => {
    setFormatting(prev => ({
      ...prev,
      [format]: !prev[format]
    }));
  };

  const setAlignment = (align: FormattingState['align']) => {
    setFormatting(prev => ({
      ...prev,
      align
    }));
  };

  const setColor = (color: string) => {
    setFormatting(prev => ({
      ...prev,
      color
    }));
  };

  const handleTextSelect = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setShowToolbar(false);
      return;
    }
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    setToolbarPosition({
      top: rect.top - 40,
      left: rect.left + rect.width / 2
    });
    
    setSelection({
      start: range.startOffset,
      end: range.endOffset
    });
    
    setShowToolbar(true);
  };

  const applyFormatting = (format: Partial<FormattingState>) => {
    setFormatting(prev => ({
      ...prev,
      ...format
    }));
  };

  // Enhanced font styling with better matching and overflow handling
  const fontStyle: React.CSSProperties = {
    fontFamily: matchedFont,
    fontSize: `${Math.max(formatting.fontSize * scale, 12)}px`,
    fontWeight: formatting.bold ? 'bold' : 'normal',
    fontStyle: formatting.italic ? 'italic' : 'normal',
    textDecoration: formatting.underline ? 'underline' : 'none',
    textAlign: formatting.align,
    color: formatting.color,
    lineHeight: 1.2,
    transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    hyphens: 'auto',
    minHeight: '1.2em',
    outline: 'none',
    border: 'none',
    background: 'transparent',
    resize: 'none' as const,
    padding: '4px 8px',
    width: '100%',
    boxSizing: 'border-box'
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
      ref={editorRef}
      className="inline-text-editor absolute z-50 animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        left: textRegion.x * scale,
        top: textRegion.y * scale,
        width: textRegion.width * scale,
        minHeight: Math.max(textRegion.height * scale, textMetrics.estimatedHeight)
      }}
      onMouseDown={(e) => e.stopPropagation()}
      data-testid="inline-text-editor"
    >
      {/* Overlay Background */}
      <div className={cn(
        "absolute inset-0 rounded-sm shadow-lg -z-10 bg-blue-50 border-2 border-primary"
      )} />
      
      {/* Formatting Toolbar */}
      {showToolbar && (
        <div 
          className="absolute z-50 flex items-center gap-1 p-1 bg-white rounded shadow-lg"
          style={{
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`,
            transform: 'translateX(-50%)',
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => toggleFormat('bold')}
            className={formatting.bold ? 'bg-gray-200' : ''}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => toggleFormat('italic')}
            className={formatting.italic ? 'bg-gray-200' : ''}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => toggleFormat('underline')}
            className={formatting.underline ? 'bg-gray-200' : ''}
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </Button>
          
          <div className="h-6 w-px bg-gray-300 mx-1" />
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setAlignment('left')}
            className={formatting.align === 'left' ? 'bg-gray-200' : ''}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setAlignment('center')}
            className={formatting.align === 'center' ? 'bg-gray-200' : ''}
            title="Center"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setAlignment('right')}
            className={formatting.align === 'right' ? 'bg-gray-200' : ''}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          
          <div className="h-6 w-px bg-gray-300 mx-1" />
          
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-8 h-8 p-0"
                title="Text Color"
              >
                <div 
                  className="w-4 h-4 rounded-sm border border-gray-300" 
                  style={{ backgroundColor: formatting.color }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="center">
              <HexColorPicker color={formatting.color} onChange={setColor} />
            </PopoverContent>
          </Popover>
        </div>
      )}
      
      {/* Editable Input */}
      {isMultiline ? (
        <textarea
          ref={textareaRef}
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onSelect={handleTextSelect}
          onMouseUp={handleTextSelect}
          className={cn(
            "w-full h-full bg-transparent resize-none outline-none",
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
          onSelect={handleTextSelect}
          onMouseUp={handleTextSelect}
          className={cn(
            "w-full h-full bg-transparent border-none focus:ring-0",
            "focus-visible:ring-0 focus-visible:ring-offset-0"
          )}
          style={fontStyle}
          data-testid="input-editor"
        />
      )}
    </div>
  );
}
