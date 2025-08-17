import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  InlineTextEditorProps, 
  DetectedFont, 
  FormattingState, 
  TextSpan,
  TextFormatting
} from "@/types/pdf-types";
import { cn } from "@/lib/utils";
import { fontRecognitionService } from "@/services/fontRecognitionService";
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Type,
  Minus,
  Plus,
  Highlighter
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";
import { Slider } from "@/components/ui/slider";

// Helper function to convert plain text to rich text spans
const toRichText = (text: string, existingSpans: TextSpan[] = []): TextSpan[] => {
  if (existingSpans.length > 0) {
    return existingSpans; // Preserve existing formatting
  }
  return [{
    text,
    formatting: {}
  }];
};

export function InlineTextEditor({
  textRegion,
  onSave,
  onCancel,
  scale,
  rotation,
  detectedFonts = []
}: InlineTextEditorProps & { detectedFonts?: DetectedFont[] }) {
  const [isMultiline] = useState(textRegion.text.length > 50);
  const [richText, setRichText] = useState<TextSpan[]>(() => 
    toRichText(textRegion.text, textRegion.richText)
  );
  
  const [formatting, setFormatting] = useState<FormattingState>({
    bold: textRegion.fontWeight === 'bold',
    italic: textRegion.fontStyle === 'italic',
    underline: false,
    align: textRegion.textAlign || 'left',
    color: textRegion.color || '#000000',
    fontSize: textRegion.fontSize,
    fontFamily: textRegion.fontName,
    lineHeight: textRegion.lineHeight || 1.2,
    activeFormats: new Set<keyof TextFormatting>(),
    selection: {
      start: 0,
      end: 0,
      range: null
    }
  });
  
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  
  const editorRef = useRef<HTMLDivElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const lastSelection = useRef<Range | null>(null);
  
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
    if (contentEditableRef.current) {
      contentEditableRef.current.focus();
      // Move cursor to the end
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(contentEditableRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, []);

  const getPlainText = useCallback(() => {
    return richText.map(span => span.text).join('');
  }, [richText]);

  const handleSave = useCallback(() => {
    const plainText = getPlainText();
    onSave(plainText);
  }, [getPlainText, onSave]);

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
        case 's':
          e.preventDefault();
          handleSave();
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

  const toggleFormat = useCallback((format: keyof TextFormatting) => {
    setFormatting(prev => {
      const newFormats = new Set(prev.activeFormats);
      const currentValue = prev[format];
      
      if (typeof currentValue === 'boolean') {
        if (currentValue) {
          newFormats.delete(format);
        } else {
          newFormats.add(format);
        }
      }
      
      return {
        ...prev,
        [format]: !currentValue,
        activeFormats: newFormats
      };
    });
    
    // Re-focus the contentEditable to apply formatting
    setTimeout(() => contentEditableRef.current?.focus(), 0);
  }, []);

  const setAlignment = useCallback((align: 'left' | 'center' | 'right' | 'justify') => {
    setFormatting(prev => ({
      ...prev,
      align
    }));
    
    // Re-focus the contentEditable to apply formatting
    setTimeout(() => contentEditableRef.current?.focus(), 0);
  }, []);

  const setColor = useCallback((color: string) => {
    setFormatting(prev => ({
      ...prev,
      color
    }));
    
    // Re-focus the contentEditable to apply formatting
    setTimeout(() => contentEditableRef.current?.focus(), 0);
  }, []);

  const updateFontSize = useCallback((newSize: number) => {
    setFormatting(prev => ({
      ...prev,
      fontSize: Math.max(8, Math.min(72, newSize)) // Limit font size between 8 and 72
    }));
  }, []);

  const handleTextSelect = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setShowToolbar(false);
      return;
    }
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Only show toolbar if selection is within our editor
    if (!editorRef.current?.contains(selection.anchorNode) || 
        !editorRef.current?.contains(selection.focusNode)) {
      return;
    }
    
    setToolbarPosition({
      top: rect.top - 40,
      left: rect.left + rect.width / 2
    });
    
    // Save the current selection
    lastSelection.current = range.cloneRange();
    
    setFormatting(prev => ({
      ...prev,
      selection: {
        start: range.startOffset,
        end: range.endOffset,
        range: range.cloneRange()
      }
    }));
    
    setShowToolbar(true);
  }, []);

  // Apply formatting to the current selection
  const applyFormatting = useCallback((format: Partial<TextFormatting>) => {
    if (!lastSelection.current) return;
    
    try {
      // Save the current selection
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      
      // Get the selected range
      const range = sel.getRangeAt(0);
      
      // Create a new span with the applied formatting
      const span = document.createElement('span');
      Object.entries(format).forEach(([key, value]) => {
        if (value !== undefined) {
          span.style[key as any] = typeof value === 'boolean' ? 'true' : String(value);
        }
      });
      
      // Apply the formatting to the selection
      range.surroundContents(span);
      
      // Update the richText state
      if (contentEditableRef.current) {
        const newHtml = contentEditableRef.current.innerHTML;
        // Parse the HTML and update richText state here
        // This is a simplified version - in a real app, you'd want to properly parse the HTML
        // and update the richText array with the new formatting
        console.log('New HTML with formatting:', newHtml);
      }
      
      // Re-focus and restore selection
      setTimeout(() => {
        if (sel && lastSelection.current) {
          sel.removeAllRanges();
          sel.addRange(lastSelection.current);
        }
        contentEditableRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error('Error applying formatting:', error);
    }
  }, []);

  // Base font style for the editor
  const baseFontStyle: React.CSSProperties = {
    fontFamily: formatting.fontFamily || matchedFont,
    fontSize: `${Math.max((formatting.fontSize || 16) * scale, 12)}px`,
    fontWeight: formatting.bold ? 'bold' : 'normal',
    fontStyle: formatting.italic ? 'italic' : 'normal',
    textDecoration: formatting.underline ? 'underline' : 'none',
    textAlign: formatting.align as React.CSSProperties['textAlign'],
    color: formatting.color,
    lineHeight: formatting.lineHeight,
    transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    hyphens: 'auto',
    minHeight: '1.2em',
    outline: 'none',
    border: 'none',
    background: 'transparent',
    resize: 'none',
    padding: '4px 8px',
    width: '100%',
    boxSizing: 'border-box',
    whiteSpace: 'pre-wrap'
  };
  
  // Calculate if text will overflow
  const textMetrics = useMemo(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { willOverflow: false, estimatedHeight: textRegion.height };
    
    const text = getPlainText();
    const fontSize = formatting.fontSize || 16;
    ctx.font = `${formatting.bold ? 'bold' : 'normal'} ${fontSize}px ${formatting.fontFamily || matchedFont}`;
    const textWidth = ctx.measureText(text).width;
    const availableWidth = textRegion.width * scale - 16; // Account for padding
    
    const willOverflow = textWidth > availableWidth;
    const lineHeight = fontSize * (formatting.lineHeight || 1.2);
    const lines = Math.max(1, Math.ceil(textWidth / availableWidth));
    const estimatedHeight = lines * lineHeight;
    
    return { 
      willOverflow, 
      estimatedHeight: Math.max(estimatedHeight, textRegion.height * scale),
      lines 
    };
  }, [getPlainText, formatting, textRegion, scale, matchedFont]);

  // Handle content changes in the contentEditable
  const handleContentChange = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    // Here you would parse the HTML to update the richText state
    // This is a simplified version that just updates the plain text
    const text = e.currentTarget.innerText;
    setRichText(prev => {
      if (prev.length === 1) {
        // If we only have one span, just update its text
        return [{
          ...prev[0],
          text
        }];
      }
      // Otherwise, we'd need to parse the HTML to update the correct spans
      // For now, just create a single span with the new text
      return [{
        text,
        formatting: {}
      }];
    });
  }, []);

  // Convert rich text to HTML
  const renderRichText = useCallback(() => {
    return richText.map((span, index) => {
      const style: React.CSSProperties = {
        fontFamily: span.formatting.fontFamily || formatting.fontFamily || matchedFont,
        fontSize: span.formatting.fontSize ? `${span.formatting.fontSize}px` : undefined,
        fontWeight: span.formatting.bold ? 'bold' : 'normal',
        fontStyle: span.formatting.italic ? 'italic' : 'normal',
        textDecoration: span.formatting.underline ? 'underline' : 'none',
        color: span.formatting.color || formatting.color,
        backgroundColor: span.formatting.backgroundColor,
        lineHeight: span.formatting.lineHeight ? `${span.formatting.lineHeight}` : '1.2'
      };
      
      // Ensure we have a valid color
      if (!style.color) style.color = '#000000';

      return (
        <span 
          key={index} 
          style={style}
          data-format={JSON.stringify(span.formatting)}
        >
          {span.text}
        </span>
      );
    });
  }, [richText, formatting, matchedFont]);

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
          {/* Text Formatting */}
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
          
          {/* Text Alignment */}
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
          
          {/* Font Size Controls */}
          <div className="flex items-center gap-1 px-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => updateFontSize(Math.max(8, (formatting.fontSize || 16) - 1))}
              title="Decrease Font Size"
            >
              <Minus className="w-3.5 h-3.5" />
            </Button>
            <div className="text-xs w-8 text-center">
              {Math.round(formatting.fontSize || 16)}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => updateFontSize(Math.min(72, (formatting.fontSize || 16) + 1))}
              title="Increase Font Size"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          
          <div className="h-6 w-px bg-gray-300 mx-1" />
          
          {/* Text Color */}
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
              <HexColorPicker 
                color={formatting.color} 
                onChange={setColor} 
              />
              <div className="mt-2 text-xs text-center">
                {formatting.color}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Highlight Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-8 h-8 p-0"
                title="Highlight Color"
              >
                <Highlighter className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="center">
              <HexColorPicker 
                color={formatting.backgroundColor || '#ffff00'} 
                onChange={(color) => applyFormatting({ backgroundColor: color })} 
              />
              <div className="mt-2 text-xs text-center">
                {formatting.backgroundColor || 'Transparent'}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
      
      {/* Content Editable Area */}
      <div
        ref={contentEditableRef}
        className={cn(
          "w-full h-full bg-transparent resize-none outline-none",
          "border-none focus:ring-0 overflow-auto"
        )}
        style={{
          ...baseFontStyle,
          textAlign: (formatting.align as React.CSSProperties['textAlign']) || 'left',
          fontSize: `${formatting.fontSize || 16}px`,
          fontFamily: formatting.fontFamily || matchedFont,
          color: formatting.color || '#000000',
          lineHeight: formatting.lineHeight || 1.2,
          fontWeight: formatting.bold ? 'bold' : 'normal',
          fontStyle: formatting.italic ? 'italic' : 'normal',
          textDecoration: formatting.underline ? 'underline' : 'none'
        }}
        contentEditable
        suppressContentEditableWarning
        onInput={handleContentChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur as any}
        onSelect={handleTextSelect as any}
        onMouseUp={handleTextSelect as any}
        data-testid="rich-text-editor"
      >
        {renderRichText()}
      </div>
    </div>
  );
}
