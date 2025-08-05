import { useEffect, useCallback } from "react";
import { toolRegistry } from "@/features/pdf-editor/toolRegistry";
import { ToolType } from "@/types/pdf-types";

interface KeyboardShortcutsProps {
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onDelete: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  setCurrentTool: (tool: ToolType) => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onSave,
  onDelete,
  onZoomIn,
  onZoomOut,
  setCurrentTool,
  enabled = true,
}: KeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const target = event.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable
      ) {
        return;
      }

      const { key, ctrlKey, metaKey, shiftKey } = event;
      const isModifierPressed = ctrlKey || metaKey;

      if (isModifierPressed) {
        event.preventDefault();
        switch (key.toLowerCase()) {
          case "z":
            (shiftKey ? onRedo : onUndo)();
            break;
          case "y":
            onRedo();
            break;
          case "s":
            onSave();
            break;
          case "=":
          case "+":
            onZoomIn();
            break;
          case "-":
            onZoomOut();
            break;
        }
      } else {
        let toolToSelect: ToolType | null = null;
        for (const tool of Object.values(toolRegistry)) {
          if (tool.shortcut?.toLowerCase() === key.toLowerCase()) {
            toolToSelect = tool.name;
            break;
          }
        }
        if (toolToSelect) {
          event.preventDefault();
          setCurrentTool(toolToSelect);
        }

        switch (event.key) {
          case "Delete":
          case "Backspace":
            event.preventDefault();
            onDelete();
            break;
          case "Escape":
            event.preventDefault();
            setCurrentTool("select");
            break;
        }
      }
    },
    [
      enabled,
      onUndo,
      onRedo,
      onSave,
      onDelete,
      onZoomIn,
      onZoomOut,
      setCurrentTool,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}
