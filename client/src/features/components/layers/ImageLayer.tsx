// src/features/components/layers/ImageLayer.tsx

import React from "react";
import Draggable from "react-draggable";
import { ImageElement, PDFEditorAction } from "@/types/pdf-types";
import { Rnd } from "react-rnd"; // A library for Resizable and Draggable

interface ImageLayerProps {
  imageElements: ImageElement[];
  selectedElementId: string | null;
  scale: number;
  page: number;
  dispatch: React.Dispatch<PDFEditorAction>;
}

export default function ImageLayer({
  imageElements,
  selectedElementId,
  scale,
  page,
  dispatch,
}: ImageLayerProps) {

  const handleUpdate = (id: string, updates: Partial<ImageElement>) => {
    dispatch({ type: "UPDATE_IMAGE_ELEMENT", payload: { page, id, updates } });
  };
  
  const handleSelect = (id: string) => {
    dispatch({ type: "SET_SELECTED_ELEMENT", payload: { id, type: "image" } });
  };

  const handleSaveHistory = () => {
    dispatch({ type: "SAVE_TO_HISTORY" });
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {imageElements.map((element) => (
        <Rnd
          key={element.id}
          className={`absolute pointer-events-auto ${selectedElementId === element.id ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
          size={{ width: element.width * scale, height: element.height * scale }}
          position={{ x: element.x * scale, y: element.y * scale }}
          onDragStop={(e, d) => {
            handleUpdate(element.id, { x: d.x / scale, y: d.y / scale });
            handleSaveHistory();
          }}
          onResizeStop={(e, direction, ref, delta, position) => {
            handleUpdate(element.id, {
              width: ref.offsetWidth / scale,
              height: ref.offsetHeight / scale,
              ...position,
            });
            handleSaveHistory();
          }}
          onClick={(e) => {
              e.stopPropagation();
              handleSelect(element.id);
          }}
          lockAspectRatio
        >
          <img
            src={element.src}
            alt="User uploaded content"
            className="w-full h-full"
            style={{ transform: `rotate(${element.rotation}deg)` }}
            // Prevent default browser drag behavior
            onDragStart={(e) => e.preventDefault()}
          />
        </Rnd>
      ))}
    </div>
  );
}