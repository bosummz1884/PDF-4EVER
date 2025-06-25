import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  MouseEvent,
  ChangeEvent,
  KeyboardEvent,
} from "react";
import type { TextBox, FontInfo } from "@/types/pdf-types";
import { FontManager } from "./FontManager";

// Utility: clamp
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(val, max));
}

interface AdvancedTextLayerProps {
  textBoxes: TextBox[];
  selectedBoxIds: Set<string>;
  onSelect: (id: string) => void;
  onMultiSelect: (id: string) => void;
  onClearSelection: () => void;
  onUpdate: (id: string, updates: Partial<TextBox>) => void;
  onRemove: (id: string) => void;
  onAdd: (box: Omit<TextBox, "id">) => void;
  currentPage: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  fontList?: FontInfo[]; // List of available fonts
}

type ResizeDirection = "right" | "bottom" | "corner" | null;

export const AdvancedTextLayer: React.FC<AdvancedTextLayerProps> = ({
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
  // State for editing
  const [editingBoxId, setEditingBoxId] = useState<string | null>(null);
  const [draggingBoxId, setDraggingBoxId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null
  );
  const [resizingBoxId, setResizingBoxId] = useState<string | null>(null);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);

  // Mouse down position for drag/resize
  const mouseDownRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const originalBoxRef = useRef<TextBox | null>(null);

  // Scale factor for PDF/canvas coordinate mapping
  const getScale = useCallback(() => {
    if (!canvasRef.current) return { x: 1, y: 1 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: canvasRef.current.width / rect.width,
      y: canvasRef.current.height / rect.height,
    };
  }, [canvasRef]);

  // ---- Selection Handlers ----
  const handleSelect = useCallback(
    (id: string, e: MouseEvent) => {
      e.stopPropagation();
      if (e.shiftKey) {
        onMultiSelect(id);
      } else {
        onSelect(id);
      }
    },
    [onSelect, onMultiSelect]
  );

  // ---- Editing Handlers ----
  const handleStartEdit = (id: string) => setEditingBoxId(id);

  const handleEditChange = (
    id: string,
    e: ChangeEvent<HTMLTextAreaElement>
  ) => {
    onUpdate(id, { value: e.target.value, text: e.target.value });
  };

  const handleEditBlur = (id: string) => {
    setEditingBoxId(null);
  };

  // ---- Drag Logic ----
  const handleMouseDown = (
    e: React.MouseEvent,
    box: TextBox
  ) => {
    if (editingBoxId) return;
    setDraggingBoxId(box.id);
    const startX = e.clientX;
    const startY = e.clientY;
    mouseDownRef.current = { x: startX, y: startY };
    originalBoxRef.current = { ...box };
    window.addEventListener("mousemove", handleMouseMove as any);
    window.addEventListener("mouseup", handleMouseUp as any);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingBoxId || !originalBoxRef.current) return;
    const deltaX = e.clientX - mouseDownRef.current.x;
    const deltaY = e.clientY - mouseDownRef.current.y;
    const scale = getScale();
    const box = originalBoxRef.current;
    const newX = clamp(box.x + deltaX * scale.x, 0, (canvasRef.current?.width ?? 9999) - box.width);
    const newY = clamp(box.y + deltaY * scale.y, 0, (canvasRef.current?.height ?? 9999) - box.height);
    onUpdate(draggingBoxId, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setDraggingBoxId(null);
    window.removeEventListener("mousemove", handleMouseMove as any);
    window.removeEventListener("mouseup", handleMouseUp as any);
  };

  // ---- Resize Logic ----
  const handleResizeMouseDown = (
    e: React.MouseEvent,
    box: TextBox,
    direction: ResizeDirection
  ) => {
    e.stopPropagation();
    setResizingBoxId(box.id);
    setResizeDirection(direction);
    mouseDownRef.current = { x: e.clientX, y: e.clientY };
    originalBoxRef.current = { ...box };
    window.addEventListener("mousemove", handleResizeMouseMove as any);
    window.addEventListener("mouseup", handleResizeMouseUp as any);
  };

  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!resizingBoxId || !originalBoxRef.current || !resizeDirection) return;
    const deltaX = e.clientX - mouseDownRef.current.x;
    const deltaY = e.clientY - mouseDownRef.current.y;
    const scale = getScale();
    let newWidth = originalBoxRef.current.width;
    let newHeight = originalBoxRef.current.height;
    if (resizeDirection === "right" || resizeDirection === "corner") {
      newWidth = clamp(originalBoxRef.current.width + deltaX * scale.x, 40, 1500);
    }
    if (resizeDirection === "bottom" || resizeDirection === "corner") {
      newHeight = clamp(originalBoxRef.current.height + deltaY * scale.y, 24, 800);
    }
    onUpdate(resizingBoxId, { width: newWidth, height: newHeight });
  };

  const handleResizeMouseUp = () => {
    setResizingBoxId(null);
    setResizeDirection(null);
    window.removeEventListener("mousemove", handleResizeMouseMove as any);
    window.removeEventListener("mouseup", handleResizeMouseUp as any);
  };

  // ---- Toolbar Logic ----
  // Use your FontManager if available for font/size
  const renderToolbar = (box: TextBox) => (
    <div
      className="textbox-toolbar"
      style={{
        position: "absolute",
        top: -38,
        left: 0,
        background: "white",
        boxShadow: "0 1px 5px rgba(0,0,0,0.15)",
        borderRadius: 6,
        padding: "2px 8px",
        display: "flex",
        gap: 8,
        zIndex: 200,
        alignItems: "center",
      }}
    >
      <FontManager
        selectedFont={box.font}
        onFontChange={(font) => onUpdate(box.id, { font })}
        fontSize={box.fontSize}
        onFontSizeChange={(fontSize) => onUpdate(box.id, { fontSize })}
        fontWeight={box.fontWeight ?? "normal"}
        onFontWeightChange={(fontWeight) => onUpdate(box.id, { fontWeight })}
        fontStyle={box.fontStyle ?? "normal"}
        onFontStyleChange={(fontStyle) => onUpdate(box.id, { fontStyle })}
        showAdvanced
        fontList={fontList}
      />
      <input
        type="color"
        value={box.color}
        onChange={(e) => onUpdate(box.id, { color: e.target.value })}
        title="Font Color"
        style={{ width: 24, height: 24, border: "none", background: "none" }}
      />
      <button
        onClick={() => onUpdate(box.id, { bold: !(box.bold ?? false) })}
        title="Bold"
        style={{
          fontWeight: "bold",
          background: box.bold ? "#eee" : "none",
        }}
        type="button"
      >
        B
      </button>
      <button
        onClick={() => onUpdate(box.id, { italic: !(box.italic ?? false) })}
        title="Italic"
        style={{
          fontStyle: "italic",
          background: box.italic ? "#eee" : "none",
        }}
        type="button"
      >
        I
      </button>
      <button
        onClick={() => onUpdate(box.id, { underline: !(box.underline ?? false) })}
        title="Underline"
        style={{
          textDecoration: "underline",
          background: box.underline ? "#eee" : "none",
        }}
        type="button"
      >
        U
      </button>
      <button
        onClick={() => onRemove(box.id)}
        title="Delete"
        style={{
          color: "#e74c3c",
          background: "none",
          border: "none",
          fontSize: 18,
        }}
        type="button"
      >
        🗑️
      </button>
    </div>
  );

  // ---- Click Outside to Deselect ----
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".pdf-textbox")) return;
      onClearSelection();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClearSelection]);

  // ---- Keyboard Editing (escape to blur) ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingBoxId) {
        setEditingBoxId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingBoxId]);

  // ---- Render ----
  return (
    <div
      className="pdf-text-layer"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      {textBoxes
        .filter((box) => box.page === currentPage)
        .map((box) => {
          const isSelected = selectedBoxIds.has(box.id);
          return (
            <div
              key={box.id}
              className={`pdf-textbox${isSelected ? " selected" : ""}`}
              tabIndex={0}
              style={{
                position: "absolute",
                left: box.x,
                top: box.y,
                width: box.width,
                height: box.height,
                fontFamily: box.font,
                fontSize: box.fontSize,
                color: box.color,
                fontWeight: box.fontWeight ?? (box.bold ? "bold" : "normal"),
                fontStyle: box.fontStyle ?? (box.italic ? "italic" : "normal"),
                textDecoration: box.underline ? "underline" : undefined,
                textAlign: box.textAlign,
                transform: box.rotation ? `rotate(${box.rotation}deg)` : undefined,
                outline: isSelected ? "2px solid #377dff" : undefined,
                background: "transparent",
                pointerEvents: "auto",
                cursor: isSelected ? (draggingBoxId === box.id ? "grabbing" : "move") : "pointer",
                zIndex: isSelected ? 100 : 1,
                userSelect: editingBoxId === box.id ? "text" : "none",
                overflow: "hidden",
                transition: "outline 0.1s",
                boxSizing: "border-box",
              }}
              onClick={(e) => handleSelect(box.id, e)}
              onDoubleClick={() => handleStartEdit(box.id)}
              onMouseDown={(e) => handleMouseDown(e, box)}
            >
              {isSelected && renderToolbar(box)}
              {/* Drag Handles (bottom-right for resize, right for width, bottom for height) */}
              {isSelected && (
                <>
                  <div
                    className="resize-handle-corner"
                    style={{
                      position: "absolute",
                      right: 0,
                      bottom: 0,
                      width: 12,
                      height: 12,
                      background: "#377dff",
                      borderRadius: 2,
                      cursor: "se-resize",
                      zIndex: 110,
                    }}
                    onMouseDown={(e) => handleResizeMouseDown(e, box, "corner")}
                  />
                  <div
                    className="resize-handle-right"
                    style={{
                      position: "absolute",
                      right: 0,
                      bottom: "50%",
                      width: 10,
                      height: 22,
                      background: "#377dff",
                      borderRadius: 2,
                      cursor: "e-resize",
                      zIndex: 110,
                      transform: "translateY(50%)",
                    }}
                    onMouseDown={(e) => handleResizeMouseDown(e, box, "right")}
                  />
                  <div
                    className="resize-handle-bottom"
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: 0,
                      width: 22,
                      height: 10,
                      background: "#377dff",
                      borderRadius: 2,
                      cursor: "s-resize",
                      zIndex: 110,
                      transform: "translateX(-50%)",
                    }}
                    onMouseDown={(e) => handleResizeMouseDown(e, box, "bottom")}
                  />
                </>
              )}
              {/* Inline Editing */}
              {editingBoxId === box.id ? (
                <textarea
                  value={box.value ?? box.text ?? ""}
                  autoFocus
                  style={{
                    width: "100%",
                    height: "100%",
                    fontFamily: box.font,
                    fontSize: box.fontSize,
                    color: box.color,
                    fontWeight: box.fontWeight ?? (box.bold ? "bold" : "normal"),
                    fontStyle: box.fontStyle ?? (box.italic ? "italic" : "normal"),
                    textDecoration: box.underline ? "underline" : undefined,
                    textAlign: box.textAlign,
                    background: "transparent",
                    border: "none",
                    resize: "none",
                    outline: "none",
                    padding: 0,
                  }}
                  onBlur={() => handleEditBlur(box.id)}
                  onChange={(e) => handleEditChange(box.id, e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      setEditingBoxId(null);
                      (e.target as HTMLTextAreaElement).blur();
                    }
                  }}
                />
              ) : (
                <span
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "inline-block",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {box.value ?? box.text ?? ""}
                </span>
              )}
            </div>
          );
        })}
    </div>
  );
};
