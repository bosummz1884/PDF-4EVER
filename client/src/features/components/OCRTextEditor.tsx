import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Check, X, Edit2, Bold, Italic, Underline, List, ListOrdered, Link } from 'lucide-react';
import { cn } from "@/lib/utils";
import { OCRResult } from "@/types/pdf-types";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";

type TextFormat = 'bold' | 'italic' | 'underline' | 'list' | 'orderedList' | 'link';

const formatText = (text: string, format: TextFormat, selectionStart: number, selectionEnd: number): { text: string; newCursorPos: number } => {
  const selectedText = text.substring(selectionStart, selectionEnd);
  let newText = '';
  let newCursorPos = selectionEnd;

  switch (format) {
    case 'bold':
      newText = `${text.substring(0, selectionStart)}**${selectedText}**${text.substring(selectionEnd)}`;
      newCursorPos = selectionEnd + 4; // Account for added ** **
      break;
    case 'italic':
      newText = `${text.substring(0, selectionStart)}_${selectedText}_${text.substring(selectionEnd)}`;
      newCursorPos = selectionEnd + 2; // Account for added _ _
      break;
    case 'underline':
      newText = `${text.substring(0, selectionStart)}<u>${selectedText}</u>${text.substring(selectionEnd)}`;
      newCursorPos = selectionEnd + 7; // Account for added <u></u>
      break;
    case 'list':
      const listItems = selectedText.split('\n').map(line => `- ${line}`).join('\n');
      newText = `${text.substring(0, selectionStart)}${listItems}${text.substring(selectionEnd)}`;
      newCursorPos = selectionEnd + listItems.length - selectedText.length;
      break;
    case 'orderedList':
      const orderedItems = selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
      newText = `${text.substring(0, selectionStart)}${orderedItems}${text.substring(selectionEnd)}`;
      newCursorPos = selectionEnd + orderedItems.length - selectedText.length;
      break;
    case 'link':
      const linkText = selectedText.trim() || 'link text';
      newText = `${text.substring(0, selectionStart)}[${linkText}](url)${text.substring(selectionEnd)}`;
      newCursorPos = selectionStart + linkText.length + 3; // Position cursor after link text
      break;
    default:
      return { text, newCursorPos: selectionEnd };
  }

  return { text: newText, newCursorPos };
};

const renderFormattedText = (text: string) => {
  // Simple markdown-like rendering
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
    .replace(/_([^_]+)_/g, '<u>$1</u>') // Underline
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>') // Links
    .replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>') // Unordered list
    .replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>') // Ordered list
    .replace(/<\/li>\n<li>/g, '</li><li>') // Fix list spacing
    .replace(/^(<li>.*<\/li>)$/gm, '<ul class="list-disc pl-5">$1</ul>'); // Wrap lists
};

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
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeFormats, setActiveFormats] = useState<TextFormat[]>([]);

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
      // Select all text for easier editing if no selection
      if (selection.start === selection.end) {
        textareaRef.current.setSelectionRange(0, editedText.length);
        setSelection({ start: 0, end: editedText.length });
      } else {
        textareaRef.current.setSelectionRange(selection.start, selection.end);
      }
    }
  }, [isEditing, editedText.length, selection]);

  const handleTextSelection = () => {
    if (textareaRef.current) {
      setSelection({
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd
      });
    }
  };

  const applyFormat = (format: TextFormat) => {
    if (textareaRef.current) {
      const { text, newCursorPos } = formatText(
        editedText,
        format,
        textareaRef.current.selectionStart,
        textareaRef.current.selectionEnd
      );
      
      setEditedText(text);
      
      // Update cursor position after formatting
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

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
        <div 
          className="text-xs text-gray-800 break-words whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: renderFormattedText(editedText) }}
        />
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
      <div className="mb-2 border rounded-md overflow-hidden">
        <div className="border-b p-1 bg-gray-50 flex items-center space-x-1">
          <ToggleGroup type="multiple" className="space-x-1">
            <Toggle 
              size="sm" 
              variant="outline" 
              aria-label="Bold"
              onClick={() => applyFormat('bold')}
              className="h-7 w-7 p-0"
            >
              <Bold className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle 
              size="sm" 
              variant="outline" 
              aria-label="Italic"
              onClick={() => applyFormat('italic')}
              className="h-7 w-7 p-0"
            >
              <Italic className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle 
              size="sm" 
              variant="outline" 
              aria-label="Underline"
              onClick={() => applyFormat('underline')}
              className="h-7 w-7 p-0"
            >
              <Underline className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle 
              size="sm" 
              variant="outline" 
              aria-label="Bullet List"
              onClick={() => applyFormat('list')}
              className="h-7 w-7 p-0"
            >
              <List className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle 
              size="sm" 
              variant="outline" 
              aria-label="Numbered List"
              onClick={() => applyFormat('orderedList')}
              className="h-7 w-7 p-0"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle 
              size="sm" 
              variant="outline" 
              aria-label="Add Link"
              onClick={() => applyFormat('link')}
              className="h-7 w-7 p-0"
            >
              <Link className="h-3.5 w-3.5" />
            </Toggle>
          </ToggleGroup>
        </div>
        <Textarea
          ref={textareaRef}
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          onSelect={handleTextSelection}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[100px] text-sm p-2 border-0 focus-visible:ring-0"
          autoFocus
        />
      </div>
      <div className="flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          Use markdown-like syntax or the toolbar above to format text
        </div>
        <div className="flex space-x-2">
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
</div>)};
