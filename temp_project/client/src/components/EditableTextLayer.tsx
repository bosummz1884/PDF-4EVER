import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pdfjsLib } from "@/lib/pdfWorker";

interface FontOptions {
  size?: number;
  color?: string;
  family?: string;
}

interface EditableTextLayerProps {
  items: any[];
  onSubmit: (text: string, position: { x: number; y: number }) => void;
  viewport: pdfjsLib.PageViewport;
  fontOptions?: FontOptions;
}

const EditableTextLayer: React.FC<EditableTextLayerProps> = ({
  items,
  onSubmit,
  viewport,
  fontOptions = {},
}) => {
  const [editingText, setEditingText] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = viewport.width / rect.width;
    const scaleY = viewport.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setEditingText({ x, y, text: "" });
  };

  const handleTextSubmit = () => {
    if (editingText && editingText.text.trim()) {
      onSubmit(editingText.text, { x: editingText.x, y: editingText.y });
    }
    setEditingText(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTextSubmit();
    } else if (e.key === "Escape") {
      setEditingText(null);
    }
  };

  return (
    <div
      className="absolute top-0 left-0 w-full h-full pointer-events-auto cursor-text"
      style={{ zIndex: 5 }}
      onClick={handleCanvasClick}
    >
      {editingText && (
        <div
          className="absolute bg-white border border-primary rounded p-2 shadow-lg"
          style={{
            left: `${(editingText.x / viewport.width) * 100}%`,
            top: `${(editingText.y / viewport.height) * 100}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 20,
          }}
        >
          <Input
            type="text"
            value={editingText.text}
            onChange={(e) =>
              setEditingText((prev) =>
                prev ? { ...prev, text: e.target.value } : null
              )
            }
            onKeyDown={handleKeyDown}
            placeholder="Enter text..."
            className="mb-2 min-w-[200px]"
            autoFocus
            style={{
              fontSize: `${fontOptions.size || 14}px`,
              color: fontOptions.color || "#000000",
              fontFamily: fontOptions.family || "Helvetica",
            }}
          />
          <div className="flex gap-2">
            <Button onClick={handleTextSubmit} size="sm">
              Add
            </Button>
            <Button 
              onClick={() => setEditingText(null)} 
              variant="outline" 
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableTextLayer;