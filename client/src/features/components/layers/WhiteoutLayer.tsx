// src/features/components/layers/WhiteoutLayer.tsx

import React from "react";
import { Rnd, DraggableData } from "react-rnd";
import { DraggableEvent } from "react-draggable";
import { WhiteoutBlock, PDFEditorAction } from "@/types/pdf-types";

interface WhiteoutLayerProps {
  whiteoutBlocks: WhiteoutBlock[];
  selectedElementId: string | null;
  selectedElementIds: string[];
  scale: number;
  page: number;
  dispatch: React.Dispatch<PDFEditorAction>;
  currentTool: string;
}

export default function WhiteoutLayer({
  whiteoutBlocks,
  selectedElementId,
  selectedElementIds,
  scale,
  page,
  dispatch,
  currentTool,
}: WhiteoutLayerProps) {

  const handleUpdate = (id: string, updates: Partial<WhiteoutBlock>) => {
    dispatch({ type: "UPDATE_WHITEOUT_BLOCK", payload: { page, id, updates } });
  };
  
  const handleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Only allow selection when using select tool
    if (currentTool === 'select') {
      const isCtrl = e.ctrlKey || e.metaKey;
      
      if (isCtrl) {
        // Multi-select: add/remove from selection
        dispatch({ type: "ADD_TO_SELECTION", payload: { id, type: "whiteout" } });
      } else {
        // Single select: replace selection
        dispatch({ type: "SET_SELECTED_ELEMENT", payload: { id, type: "whiteout" } });
      }
    }
  };

  const handleSaveHistory = () => {
    dispatch({ type: "SAVE_TO_HISTORY" });
  };

  const handleDelete = (id: string) => {
    dispatch({ type: "DELETE_WHITEOUT_BLOCK", payload: { page, id } });
    dispatch({ type: "SET_SELECTED_ELEMENT", payload: { id: null, type: null } });
    handleSaveHistory();
  };

  // Handle keyboard events for selected elements
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedElementId && e.key === 'Delete') {
        const selectedBlock = whiteoutBlocks.find(block => block.id === selectedElementId);
        if (selectedBlock) {
          handleDelete(selectedElementId);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, whiteoutBlocks]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {whiteoutBlocks.map((block) => {
        const isSelected = selectedElementIds.includes(block.id);
        const isSelectable = currentTool === 'select';

        // For non-selectable blocks or when not using select tool, render as static
        if (!isSelectable && !isSelected) {
          return (
            <div
              key={block.id}
              className="absolute"
              style={{
                left: block.x * scale,
                top: block.y * scale,
                width: block.width * scale,
                height: block.height * scale,
                backgroundColor: block.color || '#FFFFFF',
                pointerEvents: 'none'
              }}
            />
          );
        }

        // For selectable blocks, use Rnd for manipulation
        return (
          <Rnd
            key={block.id}
            className={`absolute ${isSelectable ? 'pointer-events-auto' : 'pointer-events-none'} ${
              isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""
            } ${selectedElementIds.length > 1 && isSelected ? "ring-offset-0" : ""}`}
            size={{ 
              width: block.width * scale, 
              height: block.height * scale 
            }}
            position={{ 
              x: block.x * scale, 
              y: block.y * scale 
            }}
            onDragStop={(e: DraggableEvent, d: DraggableData) => {
              handleUpdate(block.id, { x: d.x / scale, y: d.y / scale });
              handleSaveHistory();
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              handleUpdate(block.id, {
                width: ref.offsetWidth / scale,
                height: ref.offsetHeight / scale,
                x: position.x / scale,
                y: position.y / scale,
              });
              handleSaveHistory();
            }}
            onClick={(e: React.MouseEvent) => handleSelect(block.id, e)}
            // Disable manipulation when not selected or not using select tool
            disableDragging={!isSelected || currentTool !== 'select'}
            enableResizing={isSelected && currentTool === 'select'}
            // Hide resize handles when not selected
            disableResizing={!isSelected || currentTool !== 'select'}
          >
            <div
              className="w-full h-full"
              style={{
                backgroundColor: block.color || '#FFFFFF',
                cursor: isSelectable ? 'pointer' : 'default',
                // Add a subtle border when selected to make it visible
                border: isSelected ? '1px dashed #3B82F6' : 'none'
              }}
            />
          </Rnd>
        );
      })}
    </div>
  );
}
