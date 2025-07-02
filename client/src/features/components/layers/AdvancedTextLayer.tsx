import React, { useState, useRef, useEffect } from "react";
import type { TextBox } from "@/types/pdf-types";

export interface AdvancedTextLayerProps {
  textBoxes: TextBox[];
  textLayerElements: any[];
  selectedBoxIds: Set<string>;
  onSelect: (id: string) => void;
  onMultiSelect: (id: string) => void;
  onClearSelection: () => void;
  onUpdate: (id: string, updates: Partial<TextBox>) => void;
  onRemove: (id: string) => void;
  onAdd: (box: Omit<TextBox, "id">) => void;
  currentPage: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  fontList?: any[];
}

const AdvancedTextLayer: React.FC<AdvancedTextLayerProps> = ({
  textBoxes,
  selectedBoxIds,
  onSelect,
  onMultiSelect,
  onClearSelection,
  onUpdate,
  onRemove,
  onAdd,
  currentPage,
  canvasRef,
  fontList = [],
}) => {
  // Filter text boxes for current page
  const currentPageTextBoxes = textBoxes.filter(box => box.page === currentPage);

  // Handle click on empty area to clear selection
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClearSelection();
    }
  };

  // Add new text box on double click
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onAdd({
      text: "Double-click to edit",
      x,
      y,
      width: 200,
      height: 30,
      fontSize: 16,
      fontFamily: "Arial",
      color: "#000000",
      page: currentPage,
      rotation: 0,
      align: "left",
      font: "Arial",
      size: 16,
    });
  };

  return (
    <div 
      className="relative w-full h-full"
      onClick={handleBackgroundClick}
      onDoubleClick={handleDoubleClick}
    >
      {currentPageTextBoxes.map(box => (
        <TextBoxElement
          key={box.id}
          box={box}
          isSelected={selectedBoxIds.has(box.id)}
          onSelect={onSelect}
          onMultiSelect={onMultiSelect}
          onUpdate={onUpdate}
          onRemove={onRemove}
          fontList={fontList}
        />
      ))}
    </div>
  );
}; // <- This closing brace was missing

// TextBoxElement component to render individual text boxes
interface TextBoxElementProps {
  box: TextBox;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMultiSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<TextBox>) => void;
  onRemove: (id: string) => void;
  fontList: any[];
}

const TextBoxElement: React.FC<TextBoxElementProps> = ({
  box,
  isSelected,
  onSelect,
  onMultiSelect,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      onMultiSelect(box.id);
    } else {
      onSelect(box.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(box.id, { text: e.target.value });
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsEditing(false);
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`absolute transform ${isSelected ? "ring-2 ring-blue-500" : ""}`}
      style={{
        left: `${box.x}px`,
        top: `${box.y}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
        transform: `rotate(${box.rotation || 0}deg)`,
        cursor: isSelected ? "move" : "pointer",
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="w-full h-full p-0 m-0 bg-transparent resize-none outline-none"
          value={box.text}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            fontFamily: box.fontFamily || "Arial",
            fontSize: `${box.fontSize || 16}px`,
            color: box.color || "#000000",
            fontWeight: box.fontWeight || "normal",
            fontStyle: box.fontStyle || "normal",
            textAlign: box.align || "left",
          }}
        />
      ) : (
        <div
          className="w-full h-full overflow-hidden"
          style={{
            fontFamily: box.fontFamily || "Arial",
            fontSize: `${box.fontSize || 16}px`,
            color: box.color || "#000000",
            fontWeight: box.fontWeight || "normal",
            fontStyle: box.fontStyle || "normal",
            textAlign: box.align || "left",
            whiteSpace: "pre-wrap",
          }}
        >
          {box.text}
        </div>
      )}
    </div>
  );
};

export default AdvancedTextLayer;