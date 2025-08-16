// src/features/components/layers/AnnotationLayer.tsx

import React from "react";
import { Rnd, DraggableData } from "react-rnd";
import { DraggableEvent } from "react-draggable";
import { Annotation, PDFEditorAction } from "@/types/pdf-types";

interface AnnotationLayerProps {
  annotations: Annotation[];
  selectedElementId: string | null;
  selectedElementIds: string[];
  scale: number;
  page: number;
  dispatch: React.Dispatch<PDFEditorAction>;
  currentTool: string;
}

export default function AnnotationLayer({
  annotations,
  selectedElementId,
  selectedElementIds,
  scale,
  page,
  dispatch,
  currentTool,
}: AnnotationLayerProps) {

  const handleUpdate = (id: string, updates: Partial<Annotation>) => {
    dispatch({ type: "UPDATE_ANNOTATION", payload: { page, id, updates } });
  };
  
  const handleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Only allow selection when using select tool
    if (currentTool === 'select') {
      const isCtrl = e.ctrlKey || e.metaKey;
      
      if (isCtrl) {
        // Multi-select: add/remove from selection
        dispatch({ type: "ADD_TO_SELECTION", payload: { id, type: "annotation" } });
      } else {
        // Single select: replace selection
        dispatch({ type: "SET_SELECTED_ELEMENT", payload: { id, type: "annotation" } });
      }
    }
  };

  const handleSaveHistory = () => {
    dispatch({ type: "SAVE_TO_HISTORY" });
  };

  const handleDelete = (id: string) => {
    dispatch({ type: "DELETE_ANNOTATION", payload: { page, id } });
    dispatch({ type: "SET_SELECTED_ELEMENT", payload: { id: null, type: null } });
    handleSaveHistory();
  };

  // Handle keyboard events for selected elements
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedElementId && e.key === 'Delete') {
        const selectedAnnotation = annotations.find(ann => ann.id === selectedElementId);
        if (selectedAnnotation) {
          handleDelete(selectedElementId);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, annotations]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {annotations.map((annotation) => {
        const isSelected = selectedElementIds.includes(annotation.id);
        const isSelectable = currentTool === 'select';

        // For non-selectable annotations or when not using select tool, render as static
        if (!isSelectable && !isSelected) {
          return (
            <div
              key={annotation.id}
              className="absolute"
              style={{
                left: annotation.x * scale,
                top: annotation.y * scale,
                width: (annotation.width || 0) * scale,
                height: (annotation.height || 0) * scale,
                border: annotation.type === 'highlight' ? 'none' : `${annotation.strokeWidth || 1}px solid ${annotation.strokeColor || annotation.color}`,
                backgroundColor: annotation.type === 'highlight' ? annotation.color : annotation.fillColor,
                opacity: annotation.opacity || 1,
                borderRadius: annotation.type === 'circle' ? '50%' : `${annotation.cornerRadius || 0}px`,
                borderStyle: annotation.strokeStyle || 'solid',
                mixBlendMode: annotation.blendMode || (annotation.type === 'highlight' ? 'multiply' : 'normal'),
                pointerEvents: 'none'
              }}
            />
          );
        }

        // For selectable annotations, use Rnd for manipulation
        return (
          <Rnd
            key={annotation.id}
            className={`absolute ${isSelectable ? 'pointer-events-auto' : 'pointer-events-none'} ${
              isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""
            } ${selectedElementIds.length > 1 && isSelected ? "ring-offset-0" : ""}`}
            size={{ 
              width: (annotation.width || 0) * scale, 
              height: (annotation.height || 0) * scale 
            }}
            position={{ 
              x: annotation.x * scale, 
              y: annotation.y * scale 
            }}
            onDragStop={(e: DraggableEvent, d: DraggableData) => {
              handleUpdate(annotation.id, { x: d.x / scale, y: d.y / scale });
              handleSaveHistory();
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              handleUpdate(annotation.id, {
                width: ref.offsetWidth / scale,
                height: ref.offsetHeight / scale,
                x: position.x / scale,
                y: position.y / scale,
              });
              handleSaveHistory();
            }}
            onClick={(e: React.MouseEvent) => handleSelect(annotation.id, e)}
            // Disable manipulation when not selected or not using select tool
            disableDragging={!isSelected || currentTool !== 'select'}
            enableResizing={isSelected && currentTool === 'select'}
            // Hide resize handles when not selected
            disableResizing={!isSelected || currentTool !== 'select'}
          >
            <div
              className="w-full h-full"
              style={{
                border: annotation.type === 'highlight' ? 'none' : `${annotation.strokeWidth || 1}px solid ${annotation.strokeColor || annotation.color}`,
                backgroundColor: annotation.type === 'highlight' ? annotation.color : annotation.fillColor,
                opacity: annotation.opacity || 1,
                borderRadius: annotation.type === 'circle' ? '50%' : `${annotation.cornerRadius || 0}px`,
                borderStyle: annotation.strokeStyle || 'solid',
                mixBlendMode: annotation.blendMode || (annotation.type === 'highlight' ? 'multiply' : 'normal'),
                cursor: isSelectable ? 'pointer' : 'default'
              }}
            />
          </Rnd>
        );
      })}
    </div>
  );
}
