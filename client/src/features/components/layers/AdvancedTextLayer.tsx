import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { TextElement, PDFEditorAction } from '@/types/pdf-types';

interface AdvancedTextLayerProps {
  textElements: TextElement[];
  selectedElementId: string | null;
  scale: number;
  page: number;
  dispatch: React.Dispatch<PDFEditorAction>;
}

export default function AdvancedTextLayer({ textElements, selectedElementId, scale, page, dispatch }: AdvancedTextLayerProps) {
  const handleUpdate = (id: string, updates: Partial<TextElement>) => {
    dispatch({ type: 'UPDATE_TEXT_ELEMENT', payload: { page, id, updates } });
  };

  const handleSelect = (id: string) => {
    dispatch({ type: 'SET_SELECTED_ELEMENT', payload: { id, type: 'text' } });
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {textElements.map(element => (
        <TextBox
          key={element.id}
          element={element}
          isSelected={selectedElementId === element.id}
          onUpdate={handleUpdate}
          onSelect={handleSelect}
          onSaveHistory={() => dispatch({ type: 'SAVE_TO_HISTORY' })}
          scale={scale}
        />
      ))}
    </div>
  );
}

// Inner component for individual text boxes
interface TextBoxProps {
  element: TextElement;
  isSelected: boolean;
  onUpdate: (id: string, updates: Partial<TextElement>) => void;
  onSelect: (id: string) => void;
  onSaveHistory: () => void;
  scale: number;
}

const TextBox: React.FC<TextBoxProps> = ({ element, isSelected, onUpdate, onSelect, onSaveHistory, scale }) => {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onSaveHistory();
  };
  
  const textStyle: React.CSSProperties = {
    fontFamily: element.fontFamily,
    fontSize: element.fontSize * scale,
    color: element.color,
    fontWeight: element.bold ? 'bold' : 'normal',
    fontStyle: element.italic ? 'italic' : 'normal',
    textDecoration: element.underline ? 'underline' : 'none',
    textAlign: element.textAlign,
    lineHeight: element.lineHeight,
  };

  return (
    <Draggable
      position={{ x: element.x * scale, y: element.y * scale }}
      onStop={(_, data) => {
          onUpdate(element.id, { x: data.x / scale, y: data.y / scale });
          onSaveHistory();
      }}
      scale={1}
      disabled={isEditing}
    >
      <div
        className={`absolute pointer-events-auto cursor-move ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
        style={{
          width: element.width * scale,
          height: element.height * scale,
          transform: `rotate(${element.rotation}deg)`,
        }}
        onClick={(e) => { e.stopPropagation(); onSelect(element.id); }}
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={element.text}
            onChange={(e) => onUpdate(element.id, { text: e.target.value })}
            onBlur={handleBlur}
            className="w-full h-full bg-white/80 resize-none outline-none border-none p-0"
            style={textStyle}
          />
        ) : (
          <div className="w-full h-full overflow-hidden whitespace-pre-wrap select-none" style={textStyle}>
            {element.text}
          </div>
        )}
      </div>
    </Draggable>
  );
};