import React, { useState, useRef, useCallback, useEffect } from "react";
import type { TextBox, FontInfo } from "@/types/pdf-types";
import AdvancedTextLayer from "client/src/features/components/layers/AdvancedTextLayer";
import { loadFonts, isFontAvailable, getAvailableFontNames, getFontPath } from "client/src/lib/loadFonts";
import { usePDFFonts } from "client/src/features/hooks/usePDFFonts";

// Utility for deep copying (undo/redo)
function deepCopyTextBoxes(boxes: TextBox[]): TextBox[] {
  return boxes.map(box => ({ ...box }));
}

interface TextBoxManagerProps {
  initialTextBoxes?: TextBox[];
  onTextBoxesChange?: (boxes: TextBox[]) => void;
  currentPage: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  fontList?: FontInfo[]; // If using FontManager/fontList, import FontInfo type
}

export const TextBoxManager: React.FC<TextBoxManagerProps> = ({
  initialTextBoxes = [],
  onTextBoxesChange,
  currentPage,
  canvasRef,
  fontList = [],
}) => {
  // --- State ---
  const [textBoxes, setTextBoxes] = useState<TextBox[]>(deepCopyTextBoxes(initialTextBoxes));
  const [selectedBoxIds, setSelectedBoxIds] = useState<Set<string>>(new Set());
  const undoStack = useRef<TextBox[][]>([]);
  const redoStack = useRef<TextBox[][]>([]);

  // --- Utility: Push undo ---
  const pushUndo = useCallback((boxes: TextBox[]) => {
    undoStack.current.push(deepCopyTextBoxes(boxes));
    // Clear redo stack on new action
    redoStack.current = [];
  }, []);

  // --- Selection ---
  const selectBox = useCallback((id: string) => {
    setSelectedBoxIds(new Set([id]));
  }, []);

  const multiSelectBox = useCallback((id: string) => {
    setSelectedBoxIds(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedBoxIds(new Set());
  }, []);

  // --- Undo/Redo ---
  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current.pop();
    if (prev) {
      redoStack.current.push(deepCopyTextBoxes(textBoxes));
      setTextBoxes(deepCopyTextBoxes(prev));
      setSelectedBoxIds(new Set());
      if (onTextBoxesChange) onTextBoxesChange(deepCopyTextBoxes(prev));
    }
  }, [textBoxes, onTextBoxesChange]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop();
    if (next) {
      undoStack.current.push(deepCopyTextBoxes(textBoxes));
      setTextBoxes(deepCopyTextBoxes(next));
      setSelectedBoxIds(new Set());
      if (onTextBoxesChange) onTextBoxesChange(deepCopyTextBoxes(next));
    }
  }, [textBoxes, onTextBoxesChange]);

  // --- Box Operations ---
  const addTextBox = useCallback((box: Omit<TextBox, "id">) => {
    const id = `textbox_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newBox: TextBox = { ...box, id };
    const newBoxes = [...textBoxes, newBox];
    pushUndo(textBoxes);
    setTextBoxes(newBoxes);
    setSelectedBoxIds(new Set([id]));
    if (onTextBoxesChange) onTextBoxesChange(newBoxes);
  }, [textBoxes, pushUndo, onTextBoxesChange]);

  const updateTextBox = useCallback((id: string, updates: Partial<TextBox>) => {
    const idx = textBoxes.findIndex(box => box.id === id);
    if (idx === -1) return;
    const updatedBoxes = textBoxes.map(box =>
      box.id === id ? { ...box, ...updates } : box
    );
    pushUndo(textBoxes);
    setTextBoxes(updatedBoxes);
    if (onTextBoxesChange) onTextBoxesChange(updatedBoxes);
  }, [textBoxes, pushUndo, onTextBoxesChange]);

  const removeTextBox = useCallback((id: string) => {
    const updatedBoxes = textBoxes.filter(box => box.id !== id);
    pushUndo(textBoxes);
    setTextBoxes(updatedBoxes);
    setSelectedBoxIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    if (onTextBoxesChange) onTextBoxesChange(updatedBoxes);
  }, [textBoxes, pushUndo, onTextBoxesChange]);

  const duplicateTextBox = useCallback((id: string) => {
    const box = textBoxes.find(box => box.id === id);
    if (!box) return;
    const idNew = `textbox_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newBox: TextBox = {
      ...box,
      id: idNew,
      x: box.x + 24,
      y: box.y + 24,
    };
    const newBoxes = [...textBoxes, newBox];
    pushUndo(textBoxes);
    setTextBoxes(newBoxes);
    setSelectedBoxIds(new Set([idNew]));
    if (onTextBoxesChange) onTextBoxesChange(newBoxes);
  }, [textBoxes, pushUndo, onTextBoxesChange]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.activeElement && (document.activeElement.tagName === "TEXTAREA" || document.activeElement.tagName === "INPUT")) {
        // Don't trigger hotkeys while typing in input/textarea
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d" && selectedBoxIds.size === 1) {
        e.preventDefault();
        duplicateTextBox(Array.from(selectedBoxIds)[0]);
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedBoxIds.size > 0) {
        e.preventDefault();
        selectedBoxIds.forEach(id => removeTextBox(id));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedBoxIds, undo, redo, duplicateTextBox, removeTextBox]);

  // --- Sync external changes to initialTextBoxes (if any) ---
  useEffect(() => {
    setTextBoxes(deepCopyTextBoxes(initialTextBoxes));
    setSelectedBoxIds(new Set());
  }, [initialTextBoxes]);

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
      fontList={fontList}
    />
  );
};
