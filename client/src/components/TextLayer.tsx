import React, { useState, useRef } from "react";
import { Rnd } from "react-rnd";
import { HexColorPicker } from "react-colorful";
import { nanoid } from "nanoid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, Bold, Italic } from 'lucide-react';

type TextElement = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
};

type TextLayerProps = {
  isActive: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  scale?: number;
  onTextElementsChange?: (elements: TextElement[]) => void;
};

const availableFonts = [
  'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 
  'Verdana', 'Trebuchet MS', 'Arial Black', 'Impact', 'Comic Sans MS',
  'Palatino', 'Garamond', 'Bookman', 'Tahoma', 'Lucida Console'
];

export default function TextLayer({ 
  isActive, 
  canvasRef, 
  scale = 1,
  onTextElementsChange 
}: TextLayerProps): JSX.Element {
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive) return;

    // Prevent creating text boxes when clicking on existing ones
    const target = e.target as HTMLElement;
    if (target.closest('[data-rnd]') || target.closest('[data-text-controls]')) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const newTextElement: TextElement = {
      id: nanoid(),
      x,
      y,
      width: 200,
      height: 35,
      text: "",
      fontSize: 14,
      fontFamily: 'Arial',
      color: "#000000",
      fontWeight: 'normal',
      fontStyle: 'normal'
    };

    const updatedElements = [...textElements, newTextElement];
    setTextElements(updatedElements);
    setSelectedElementId(newTextElement.id);
    onTextElementsChange?.(updatedElements);

    // Focus the text input after a short delay
    setTimeout(() => {
      const input = document.querySelector(`[data-text-id="${newTextElement.id}"] input`) as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 100);
  };

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    const updatedElements = textElements.map((element) => 
      element.id === id ? { ...element, ...updates } : element
    );
    setTextElements(updatedElements);
    onTextElementsChange?.(updatedElements);
  };

  const deleteTextElement = (id: string) => {
    const updatedElements = textElements.filter((element) => element.id !== id);
    setTextElements(updatedElements);
    setSelectedElementId(null);
    onTextElementsChange?.(updatedElements);
  };

  const handleElementClick = (e: any, elementId: string) => {
    e.stopPropagation();
    setSelectedElementId(selectedElementId === elementId ? null : elementId);
  };

  return (
    <div
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        pointerEvents: isActive ? "auto" : "none",
        zIndex: isActive ? 10 : 1,
        cursor: isActive ? "text" : "default"
      }}
      onClick={handleCanvasClick}
    >
      {textElements.map((element) => (
        <Rnd
          key={element.id}
          data-rnd="true"
          data-text-id={element.id}
          size={{ width: element.width * scale, height: element.height * scale }}
          position={{ x: element.x * scale, y: element.y * scale }}
          bounds="parent"
          onDragStop={(_, d) => updateTextElement(element.id, { 
            x: d.x / scale, 
            y: d.y / scale 
          })}
          onResizeStop={(_, __, ref, ____, pos) =>
            updateTextElement(element.id, {
              width: parseInt(ref.style.width, 10) / scale,
              height: parseInt(ref.style.height, 10) / scale,
              x: pos.x / scale,
              y: pos.y / scale
            })
          }
          onClick={(e: any) => handleElementClick(e, element.id)}
          style={{ 
            zIndex: selectedElementId === element.id ? 50 : 30,
            position: "absolute"
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              boxSizing: "border-box",
              position: "relative",
              cursor: "text",
              display: "flex",
              alignItems: "center",
              background: "transparent",
              borderRadius: "3px"
            }}
          >
            {/* Floating toolbar above text field */}
            {selectedElementId === element.id && (
              <div
                data-text-controls="true"
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: "0",
                  background: "#4FC3F7",
                  padding: "8px 12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  borderRadius: "4px 4px 0 0",
                  zIndex: 100,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  minWidth: "320px",
                  color: "white",
                  fontSize: "12px"
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <span style={{ fontWeight: "bold", marginRight: "8px" }}>Format Text:</span>
                
                {/* Font Selection */}
                <select
                  value={element.fontFamily}
                  onChange={(e) => updateTextElement(element.id, { fontFamily: e.target.value })}
                  style={{
                    width: "120px",
                    height: "24px",
                    fontSize: "11px",
                    background: "white",
                    color: "black",
                    border: "1px solid #ddd",
                    borderRadius: "3px",
                    padding: "2px 4px"
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {availableFonts.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>

                {/* Font Size */}
                <input
                  type="number"
                  value={element.fontSize}
                  onChange={(e) => {
                    const newSize = Math.max(8, Math.min(72, parseInt(e.target.value) || 16));
                    updateTextElement(element.id, { fontSize: newSize });
                  }}
                  style={{ 
                    width: "50px", 
                    height: "24px",
                    padding: "2px 4px", 
                    border: "1px solid #ddd", 
                    borderRadius: "3px",
                    fontSize: "11px",
                    background: "white",
                    color: "black"
                  }}
                  min="8"
                  max="72"
                  onClick={(e) => e.stopPropagation()}
                />
                
                {/* Style buttons */}
                <Button
                  variant={element.fontWeight === 'bold' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateTextElement(element.id, { 
                    fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold' 
                  })}
                  style={{ height: "24px", padding: "0 8px" }}
                >
                  <Bold className="h-3 w-3" />
                </Button>
                <Button
                  variant={element.fontStyle === 'italic' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateTextElement(element.id, { 
                    fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' 
                  })}
                  style={{ height: "24px", padding: "0 8px" }}
                >
                  <Italic className="h-3 w-3" />
                </Button>

                {/* Color picker */}
                <div style={{ position: "relative" }}>
                  <div 
                    style={{ 
                      width: "20px", 
                      height: "20px", 
                      backgroundColor: element.color,
                      border: "2px solid white",
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                    onClick={() => {
                      const colorPicker = document.querySelector(`[data-color-picker="${element.id}"]`) as HTMLElement;
                      if (colorPicker) {
                        colorPicker.style.display = colorPicker.style.display === 'none' ? 'block' : 'none';
                      }
                    }}
                    title="Click to change color"
                  />
                  <div
                    data-color-picker={element.id}
                    style={{
                      position: "absolute",
                      top: "25px",
                      right: "0",
                      display: "none",
                      zIndex: 1000
                    }}
                  >
                    <HexColorPicker
                      color={element.color}
                      onChange={(color) => updateTextElement(element.id, { color })}
                      style={{ width: "150px", height: "100px" }}
                    />
                  </div>
                </div>

                {/* Delete button */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteTextElement(element.id)}
                  style={{ height: "24px", padding: "0 8px", marginLeft: "8px" }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}

            <input
              type="text"
              value={element.text}
              onChange={(e) => updateTextElement(element.id, { text: e.target.value })}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: `${element.fontSize}px`,
                fontFamily: element.fontFamily,
                color: element.color,
                fontWeight: element.fontWeight,
                fontStyle: element.fontStyle,
                padding: "4px 8px",
                margin: "0",
                lineHeight: "1.2"
              }}
              placeholder="Type your text"
            />

          </div>
        </Rnd>
      ))}
    </div>
  );
}