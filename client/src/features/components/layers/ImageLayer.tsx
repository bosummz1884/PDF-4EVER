// src/features/components/layers/ImageLayer.tsx

import React from "react";
import { ImageElement, PDFEditorAction } from "@/types/pdf-types";

// CORRECTED: Import the correct, EXPORTED types from the libraries.
// react-rnd re-exports the necessary types from react-draggable.
import { Rnd, DraggableData } from "react-rnd";
import { DraggableEvent } from "react-draggable";

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
          // CORRECTED: The event `e` is a DraggableEvent, and `d` is DraggableData. These are correctly exported.
          onDragStop={(e: DraggableEvent, d: DraggableData) => {
            handleUpdate(element.id, { x: d.x / scale, y: d.y / scale });
            handleSaveHistory();
          }}
          // CORRECTED: The third parameter `ref` is an HTMLElement, which is the correct superclass.
          // The `position` parameter provides the final x/y coordinates after resizing.
          onResizeStop={(e, direction, ref, delta, position) => {
            handleUpdate(element.id, {
              width: ref.offsetWidth / scale,
              height: ref.offsetHeight / scale,
              x: position.x / scale,
              y: position.y / scale,
            });
            handleSaveHistory();
          }}
          onClick={(e: React.MouseEvent) => {
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
            onDragStart={(e) => e.preventDefault()}
          />
        </Rnd>
      ))}
    </div>
  );
}