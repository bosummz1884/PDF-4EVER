// src/features/components/layers/AdvancedTextLayer.tsx

import React, { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import { TextElement, PDFEditorAction } from "@/types/pdf-types";

interface AdvancedTextLayerProps {
  textElements: TextElement[];
  selectedElementId: string | null;
  scale: number;
  page: number;
  dispatch: React.Dispatch<PDFEditorAction>;
}

export default function AdvancedTextLayer({
  textElements,
  selectedElementId,
  scale,
  page,
  dispatch,
}: AdvancedTextLayerProps) {
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  const handleUpdate = (id: string, updates: Partial<TextElement>) => {
    dispatch({ type: "UPDATE_TEXT_ELEMENT", payload: { page, id, updates } });
  };

  const handleSelect = (id: string) => {
    dispatch({ type: "SET_SELECTED_ELEMENT", payload: { id, type: "text" } });
  };

  // Automatically enter edit mode for a newly created element
  useEffect(() => {
    const isNew = textElements.find(el => el.id === selectedElementId && el.text === "New Text Box");
    if (isNew) {
      setEditingElementId(selectedElementId);
    }
  }, [selectedElementId, textElements]);


  return (
    <div className="absolute inset-0 pointer-events-none">
      {textElements.map((element) => (
        <TextBox
          key={element.id}
          element={element}
          isSelected={selectedElementId === element.id}
          isEditing={editingElementId === element.id}
          onUpdate={handleUpdate}
          onSelect={handleSelect}
          onSetEditing={setEditingElementId}
          onSaveHistory={() => dispatch({ type: "SAVE_TO_HISTORY" })}
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
  isEditing: boolean;
  onUpdate: (id: string, updates: Partial<TextElement>) => void;
  onSelect: (id: string) => void;
  onSetEditing: (id: string | null) => void;
  onSaveHistory: () => void;
  scale: number;
}

const TextBox: React.FC<TextBoxProps> = ({
  element,
  isSelected,
  isEditing,
  onUpdate,
  onSelect,
  onSetEditing,
  onSaveHistory,
  scale,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef(null); // Ref for the Draggable component

  // Auto-resize the textarea to fit content
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
      onUpdate(element.id, { height: el.scrollHeight / scale });
    }
  }, [element.text, isEditing, scale, onUpdate, element.id]);
  
  // Focus and select text when editing begins
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSetEditing(element.id);
  };

  const handleBlur = () => {
    onSetEditing(null);
    onSaveHistory();
  };

  const textStyle: React.CSSProperties = {
    fontFamily: element.fontFamily,
    fontSize: element.fontSize * scale,
    color: element.color,
    fontWeight: element.bold ? "bold" : "normal",
    fontStyle: element.italic ? "italic" : "normal",
    textDecoration: element.underline ? "underline" : "none",
    textAlign: element.textAlign as React.CSSProperties["textAlign"],
    lineHeight: element.lineHeight,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    resize: 'none',
    padding: 0,
    margin: 0,
    overflow: 'hidden'
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x: element.x * scale, y: element.y * scale }}
      onStop={(_, data) => {
        onUpdate(element.id, { x: data.x / scale, y: data.y / scale });
        onSaveHistory();
      }}
      scale={1}
      disabled={isEditing}
    >
      <div
        ref={nodeRef}
        className={`absolute pointer-events-auto cursor-move ${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
        style={{
          width: element.width * scale,
          minHeight: element.height * scale,
          transform: `rotate(${element.rotation}deg)`,
          // Add a subtle border when editing to indicate the text box bounds
          border: isEditing ? '1px dashed #3B82F6' : '1px solid transparent',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(element.id);
        }}
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={element.text}
            onChange={(e) => {
                onUpdate(element.id, { text: e.target.value });
            }}
            onBlur={handleBlur}
            style={textStyle}
            // Prevent Draggable from capturing textarea events
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="w-full h-full overflow-hidden whitespace-pre-wrap select-none"
            style={textStyle}
          >
            {element.text}
          </div>
        )}
      </div>
    </Draggable>
  );
};