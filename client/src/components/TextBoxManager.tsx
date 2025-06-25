import React, { useState, useRef, useCallback } from "react";
import type { TextBox } from "@/types/pdf-types";
import { AdvancedTextLayer } from "./AdvancedTextLayer";

interface TextBoxManagerProps {
  initialTextBoxes?: TextBox[];
  onTextBoxesChange?: (boxes: TextBox[]) => void;
  currentPage: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const TextBoxManager: React.FC<TextBoxManagerProps> = ({
  initialTextBoxes = [],
  onTextBoxesChange,
  currentPage,
  canvasRef,
}) => {
  // --- State ---
  const [textBoxes, setTextBoxes] = useState<TextBox[]>(initialTextBoxes);
  const [selectedBoxIds, setSelectedBoxIds] = useState<Set<string>>(new Set());
  const undoStack = useRef<TextBox[][]>([]);
  const redoStack = useRef<TextBox[][]>([]);

  // --- Selection ---
  const selectBox = useCallback((id: string) => {
    setSelectedBoxIds(new Set([id]));
  }, []);

  const multiSelectBox = useCallback((id: string) => {
    setSelectedBoxIds(prev => new Set(prev).add(id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedBoxIds(new Set());
  }, []);

  // --- Undo/Redo ---
  const pushUndo = (boxes: TextBox[]) => {
    undoStack.current.push([...boxes]);
    redoStack.current = [];
  };

  const undo = () => {
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current.pop();
    if (prev) {
      redoStack.current.push(textBoxes);
      setTextBoxes(prev);
      if (onTextBoxesChange) onTextBoxesChange(prev);
    }
  };

  const redo = () => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop();
    if (next) {
      undoStack.current.push(textBoxes);
      setTextBoxes(next);
      if (onTextBoxesChange) onTextBoxesChange(next);
    }
  };

  // --- Box Operations ---
  const addTextBox = (box: Omit<TextBox, "id">) => {
    const id = `textbox_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newBox: TextBox = { ...box, id };
    const newBoxes = [...textBoxes, newBox];
    pushUndo(textBoxes);
    setTextBoxes(newBoxes);
    if (onTextBoxesChange) onTextBoxesChange(newBoxes);
    setSelectedBoxIds(new Set([id]));
  };

  const updateTextBox = (id: string, updates: Partial<TextBox>) => {
    const idx = textBoxes.findIndex(box => box.id === id);
    if (idx === -1) return;
    const updatedBoxes = textBoxes.map(box =>
      box.id === id ? { ...box, ...updates } : box
    );
    pushUndo(textBoxes);
    setTextBoxes(updatedBoxes);
    if (onTextBoxesChange) onTextBoxesChange(updatedBoxes);
  };

  const removeTextBox = (id: string) => {
    const updatedBoxes = textBoxes.filter(box => box.id !== id);
    pushUndo(textBoxes);
    setTextBoxes(updatedBoxes);
    if (onTextBoxesChange) onTextBoxesChange(updatedBoxes);
    setSelectedBoxIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const duplicateTextBox = (id: string) => {
    const box = textBoxes.find(box => box.id === id);
    if (!box) return;
    const newBox: TextBox = {
      ...box,
      id: `textbox_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      x: box.x + 20,
      y: box.y + 20,
    };
    addTextBox(newBox);
  };

  // --- Keyboard Shortcuts ---
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          undo();
        } else if (e.key === "y") {
          e.preventDefault();
          redo();
        } else if (e.key === "d" && selectedBoxIds.size === 1) {
          e.preventDefault();
          duplicateTextBox(Array.from(selectedBoxIds)[0]);
        }
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedBoxIds.size > 0) {
        e.preventDefault();
        selectedBoxIds.forEach(id => removeTextBox(id));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoxIds, textBoxes]);

  // --- Render ---
  return (
    <AdvancedTextLayer
      textBoxes={textBoxes}
      selectedBoxIds={selectedBoxIds}
      onSelect={selectBox}
      onMultiSelect={multiSelectBox}
      onClearSelection={clearSelection}
      onUpdate={updateTextBox}
      onRemove={removeTextBox}
      onAdd={addTextBox}
      currentPage={currentPage}
      canvasRef={canvasRef}
    />
  );
};
