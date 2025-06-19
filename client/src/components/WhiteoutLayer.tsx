import React, { useState } from "react";
import { Rnd } from "react-rnd";
import { HexColorPicker } from "react-colorful";
import { nanoid } from "nanoid";

type WhiteoutBlock = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

type WhiteoutLayerProps = {
  isActive: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  scale?: number;
  onBlocksChange?: (blocks: WhiteoutBlock[]) => void;
};

export default function WhiteoutLayer({
  isActive,
  canvasRef,
  scale = 1,
  onBlocksChange,
}: WhiteoutLayerProps): JSX.Element {
  const [blocks, setBlocks] = useState<WhiteoutBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingBlock, setDrawingBlock] = useState<WhiteoutBlock | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null,
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive) return;

    // Prevent creating blocks when clicking on existing blocks
    const target = e.target as HTMLElement;
    if (target.closest("[data-rnd]")) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setStartPoint({ x, y });
    setIsDrawing(true);

    const newBlock: WhiteoutBlock = {
      id: nanoid(),
      x,
      y,
      width: 1,
      height: 1,
      color: "#ffffff",
    };

    setDrawingBlock(newBlock);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive || !isDrawing || !startPoint || !drawingBlock) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = (e.clientX - rect.left) / scale;
    const currentY = (e.clientY - rect.top) / scale;

    const width = Math.abs(currentX - startPoint.x);
    const height = Math.abs(currentY - startPoint.y);
    const x = Math.min(startPoint.x, currentX);
    const y = Math.min(startPoint.y, currentY);

    setDrawingBlock({
      ...drawingBlock,
      x,
      y,
      width: Math.max(width, 5),
      height: Math.max(height, 5),
    });
  };

  const handleMouseUp = () => {
    if (!isActive || !isDrawing || !drawingBlock) return;

    if (drawingBlock.width > 5 && drawingBlock.height > 5) {
      const updatedBlocks = [...blocks, drawingBlock];
      setBlocks(updatedBlocks);
      onBlocksChange?.(updatedBlocks);
    }

    setIsDrawing(false);
    setDrawingBlock(null);
    setStartPoint(null);
  };

  const updateBlock = (id: string, updates: Partial<WhiteoutBlock>) => {
    const updatedBlocks = blocks.map((block) =>
      block.id === id ? { ...block, ...updates } : block,
    );
    setBlocks(updatedBlocks);
    onBlocksChange?.(updatedBlocks);
  };

  const removeBlock = (id: string) => {
    const updatedBlocks = blocks.filter((b) => b.id !== id);
    setBlocks(updatedBlocks);
    setSelectedBlockId(null);
    onBlocksChange?.(updatedBlocks);
  };

  const handleBlockClick = (e: any, blockId: string) => {
    e.stopPropagation();
    setSelectedBlockId(selectedBlockId === blockId ? null : blockId);
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
        cursor: isActive ? "crosshair" : "default",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Render drawing block while dragging */}
      {drawingBlock && (
        <div
          style={{
            position: "absolute",
            left: drawingBlock.x * scale,
            top: drawingBlock.y * scale,
            width: drawingBlock.width * scale,
            height: drawingBlock.height * scale,
            backgroundColor: "#ffffff",
            opacity: 0.8,
            pointerEvents: "none",
            zIndex: 25,
          }}
        />
      )}

      {blocks.map((block) => (
        <Rnd
          key={block.id}
          data-rnd="true"
          size={{ width: block.width * scale, height: block.height * scale }}
          position={{ x: block.x * scale, y: block.y * scale }}
          bounds="parent"
          onDragStop={(_, d) =>
            updateBlock(block.id, {
              x: d.x / scale,
              y: d.y / scale,
            })
          }
          onResizeStop={(_, __, ref, ____, pos) =>
            updateBlock(block.id, {
              width: parseInt(ref.style.width, 10) / scale,
              height: parseInt(ref.style.height, 10) / scale,
              x: pos.x / scale,
              y: pos.y / scale,
            })
          }
          onClick={(e: any) => handleBlockClick(e, block.id)}
          style={{
            zIndex: selectedBlockId === block.id ? 50 : 30,
            position: "absolute",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#ffffff",
              border:
                selectedBlockId === block.id ? "2px dashed #007acc" : "none",
              boxSizing: "border-box",
              position: "relative",
              cursor: isActive ? "move" : "default",
            }}
          >
            {selectedBlockId === block.id && (
              <div
                style={{
                  position: "absolute",
                  top: "-160px",
                  right: 0,
                  background: "#fff",
                  padding: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  borderRadius: "4px",
                  zIndex: 20,
                  minWidth: "200px",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    marginBottom: "8px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  Whiteout Color
                </div>
                <HexColorPicker
                  color={block.color}
                  onChange={(color) => updateBlock(block.id, { color })}
                  style={{ width: "100%", height: "120px" }}
                />

                <button
                  style={{
                    marginTop: "8px",
                    width: "100%",
                    fontSize: "12px",
                    padding: "6px",
                    backgroundColor: "#ff4444",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBlock(block.id);
                  }}
                >
                  Delete Block
                </button>
              </div>
            )}
          </div>
        </Rnd>
      ))}
    </div>
  );
}

export type { WhiteoutBlock };
