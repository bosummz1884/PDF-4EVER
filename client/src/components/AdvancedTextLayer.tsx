import React, { useState, useRef } from "react";
import { Rnd } from "react-rnd";
import { nanoid } from "nanoid";

type TextBox = {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  font: string;
  size: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
};

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  page: number;
  addTextBox?: boolean;
  onTextBoxesChange?: (textBoxes: TextBox[]) => void;
};

export default function AdvancedTextLayer({ canvasRef, page, onTextBoxesChange }: Props) {
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [selectedFont, setSelectedFont] = useState("Helvetica");
  const [fontSize, setFontSize] = useState(16);
  const [fontColor, setFontColor] = useState("#000000");
  const [isAddMode, setIsAddMode] = useState(false);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only create new text box if in add mode and clicking on empty area
    if (isAddMode && e.target === e.currentTarget) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newBox: TextBox = {
        id: nanoid(),
        page,
        x,
        y,
        width: 200,
        height: 50,
        value: "Edit me",
        font: selectedFont,
        size: fontSize,
        color: fontColor,
        bold: false,
        italic: false,
        underline: false
      };

      const updatedBoxes = [...textBoxes, newBox];
      setTextBoxes(updatedBoxes);
      onTextBoxesChange?.(updatedBoxes);
      setIsAddMode(false); // Turn off add mode after creating a text box
    }
  };

  const updateText = (id: string, value: string) => {
    const updatedBoxes = textBoxes.map((tb) => (tb.id === id ? { ...tb, value } : tb));
    setTextBoxes(updatedBoxes);
    onTextBoxesChange?.(updatedBoxes);
  };

  const updateBox = (id: string, props: Partial<TextBox>) => {
    const updatedBoxes = textBoxes.map((tb) => (tb.id === id ? { ...tb, ...props } : tb));
    setTextBoxes(updatedBoxes);
    onTextBoxesChange?.(updatedBoxes);
  };

  const deleteTextBox = (id: string) => {
    const updatedBoxes = textBoxes.filter((tb) => tb.id !== id);
    setTextBoxes(updatedBoxes);
    onTextBoxesChange?.(updatedBoxes);
  };

  const toggleStyle = (id: string, style: 'bold' | 'italic' | 'underline') => {
    const updatedBoxes = textBoxes.map((tb) => 
      tb.id === id ? { ...tb, [style]: !tb[style] } : tb
    );
    setTextBoxes(updatedBoxes);
    onTextBoxesChange?.(updatedBoxes);
  };

  return (
    <>
      <div style={{ marginBottom: "0.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
        <button
          onClick={() => setIsAddMode(!isAddMode)}
          style={{
            padding: "4px 8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: isAddMode ? "#3b82f6" : "#f8f9fa",
            color: isAddMode ? "white" : "#333",
            cursor: "pointer",
            fontSize: "12px"
          }}
        >
          {isAddMode ? "Cancel" : "Add Text"}
        </button>
        
        <select
          value={selectedFont}
          onChange={(e) => setSelectedFont(e.target.value)}
          style={{ padding: "4px", borderRadius: "4px", border: "1px solid #ccc" }}
        >
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
        </select>

        <input
          type="number"
          min={8}
          max={72}
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
          style={{ width: "60px", padding: "4px", borderRadius: "4px", border: "1px solid #ccc" }}
        />

        <input
          type="color"
          value={fontColor}
          onChange={(e) => setFontColor(e.target.value)}
          style={{ width: "40px", height: "32px", borderRadius: "4px", border: "1px solid #ccc", cursor: "pointer" }}
        />
      </div>

      <div
        style={{
          position: "relative",
          width: canvasRef.current?.width,
          height: canvasRef.current?.height,
          cursor: isAddMode ? "crosshair" : "default"
        }}
        onClick={handleCanvasClick}
      >
        {textBoxes
          .filter(box => box.page === page)
          .map((box) => (
          <Rnd
            key={box.id}
            size={{ width: box.width, height: box.height }}
            position={{ x: box.x, y: box.y }}
            bounds="parent"
            onDragStop={(_, d) =>
              updateBox(box.id, { x: d.x, y: d.y })
            }
            onResizeStop={(_, __, ref, ____, pos) =>
              updateBox(box.id, {
                width: parseInt(ref.style.width, 10),
                height: parseInt(ref.style.height, 10),
                x: pos.x,
                y: pos.y
              })
            }
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="group relative">
              {/* Hover Controls */}
              <div className="absolute -top-8 left-0 hidden group-hover:flex gap-1 bg-white border rounded p-1 shadow-lg z-20">
                <button
                  onClick={() => toggleStyle(box.id, 'bold')}
                  className={`px-2 py-1 text-xs font-bold rounded ${box.bold ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  title="Bold"
                >
                  B
                </button>
                <button
                  onClick={() => toggleStyle(box.id, 'italic')}
                  className={`px-2 py-1 text-xs italic rounded ${box.italic ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  title="Italic"
                >
                  I
                </button>
                <button
                  onClick={() => toggleStyle(box.id, 'underline')}
                  className={`px-2 py-1 text-xs underline rounded ${box.underline ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  title="Underline"
                >
                  U
                </button>
                <button
                  onClick={() => deleteTextBox(box.id)}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  title="Delete"
                >
                  ×
                </button>
              </div>

              <div
                contentEditable
                suppressContentEditableWarning
                style={{
                  width: "100%",
                  height: "100%",
                  fontFamily: box.font,
                  fontSize: box.size,
                  color: box.color,
                  fontWeight: box.bold ? "bold" : "normal",
                  fontStyle: box.italic ? "italic" : "normal",
                  textDecoration: box.underline ? "underline" : "none",
                  background: "rgba(255,255,255,0.8)",
                  padding: "6px",
                  outline: "2px solid rgba(59, 130, 246, 0.3)",
                  borderRadius: "3px",
                  overflow: "hidden",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  boxSizing: "border-box",
                  cursor: "text"
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.currentTarget.focus();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onBlur={(e) =>
                  updateText(box.id, e.currentTarget.innerText)
                }
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
              >
                {box.value}
              </div>
            </div>
          </Rnd>
        ))}
      </div>
    </>
  );
}

export type { TextBox };