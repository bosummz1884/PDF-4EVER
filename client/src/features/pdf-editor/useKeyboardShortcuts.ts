import { useEffect } from "react";
import { useToolRegistry } from "./useToolRegistry";
import { ToolType } from "../toolRegistry";

interface UseKeyboardShortcutsProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onSelectAll?: () => void;
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onUndo,
  onRedo,
  onSave,
  onCopy,
  onPaste,
  onDelete,
  onSelectAll,
  enabled = true,
}: UseKeyboardShortcutsProps) => {
  const { tools, setCurrentTool } = useToolRegistry();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      const isModifierPressed = ctrlKey || metaKey;

      // Prevent default for handled shortcuts
      const preventDefault = () => {
        event.preventDefault();
        event.stopPropagation();
      };

      // Standard shortcuts
      if (isModifierPressed) {
        switch (key.toLowerCase()) {
          case "z":
            if (shiftKey) {
              onRedo?.();
            } else {
              onUndo?.();
            }
            preventDefault();
            break;
          case "y":
            onRedo?.();
            preventDefault();
            break;
          case "s":
            onSave?.();
            preventDefault();
            break;
          case "c":
            onCopy?.();
            preventDefault();
            break;
          case "v":
            onPaste?.();
            preventDefault();
            break;
          case "a":
            onSelectAll?.();
            preventDefault();
            break;
        }
        return;
      }

      // Tool shortcuts
      const toolShortcuts: Record<string, ToolType> = {
        v: "select",
        t: "text",
        h: "highlight",
        r: "rectangle",
        c: "circle",
        f: "freeform",
        s: "signature",
        e: "eraser",
        i: "image",
        l: "line",
        w: "whiteout",
        o: "ocr",
      };

      // Handle shift combinations
      if (shiftKey) {
        switch (key.toLowerCase()) {
          case "c":
            setCurrentTool("checkmark");
            preventDefault();
            break;
          case "f":
            setCurrentTool("form");
            preventDefault();
            break;
          case "e":
            setCurrentTool("inlineEdit");
            preventDefault();
            break;
        }
        return;
      }

      // Handle single key shortcuts
      const toolName = toolShortcuts[key.toLowerCase()];
      if (toolName && tools[toolName]) {
        setCurrentTool(toolName);
        preventDefault();
      }

      // Special keys
      switch (key) {
        case "Delete":
        case "Backspace":
          onDelete?.();
          preventDefault();
          break;
        case "Escape":
          setCurrentTool("select");
          preventDefault();
          break;
        case "x":
          if (!isModifierPressed) {
            setCurrentTool("x-mark");
            preventDefault();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    tools,
    setCurrentTool,
    onUndo,
    onRedo,
    onSave,
    onCopy,
    onPaste,
    onDelete,
    onSelectAll,
  ]);
};

export default useKeyboardShortcuts;
