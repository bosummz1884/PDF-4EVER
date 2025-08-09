// src/features/pdf-editor/PDFEditorContainer.tsx

import React, { useCallback, useEffect, useState, useRef } from "react"; // Added useRef
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Upload } from "lucide-react";
import { usePDFEditor } from "./PDFEditorContext";
import { useKeyboardShortcuts } from "@/features/hooks/useKeyboardShortcuts";
import PDFSidebar from "../../features/components/PDFSidebar";
import ToolPanel from "./ToolPanel";
import AdvancedTextLayer from "../components/layers/AdvancedTextLayer";
import { Annotation, WhiteoutBlock, ToolType, ImageElement, TextElement } from "@/types/pdf-types";
import ImageLayer from "../components/layers/ImageLayer";

export default function PDFEditorContainer() {
  const {
    state,
    dispatch,
    canvasRef,
    fileInputRef,
    renderPage,
    loadPDF,
    savePDF,
  } = usePDFEditor();
  const {
    currentPage,
    currentTool,
    toolSettings,
    scale,
    selectedElementId,
    selectedElementType,
  } = state;

  const [drawingShape, setDrawingShape] = useState<Partial<Annotation> | null>(
    null,
  );
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null,
  );
  
  // ADDED: Ref for the hidden image input
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.pdfDocument) {
      renderPage();
    }
  }, [state.pdfDocument, currentPage, scale, state.rotation, renderPage]);

  const getCanvasCoordinates = (
    event: React.MouseEvent,
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / scale,
      y: (event.clientY - rect.top) / scale,
    };
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // UPDATED: Prevent interactions on other layers like images
      if ((e.target as HTMLElement).closest(".draggable-text-box, .react-rnd")) return;
      
      // ADDED: Trigger image upload if image tool is active
      if (currentTool === 'image') {
          imageInputRef.current?.click();
          return; // Stop further processing for the image tool
      }

      // Prevent drawing when interacting with the text layer
      if ((e.target as HTMLElement).closest(".draggable-text-box")) return;

      const coords = getCanvasCoordinates(e);
      setStartPoint(coords);
      const settings = toolSettings[currentTool];

      if (
        ["rectangle", "circle", "highlight", "whiteout", "line"].includes(
          currentTool,
        )
      ) {
        setDrawingShape({
          type: currentTool,
          page: currentPage,
          x: coords.x,
          y: coords.y,
          width: 0,
          height: 0,
          ...settings,
        });
      }
    },
    // UPDATED: Added currentTool to dependency array
    [currentPage, currentTool, toolSettings, scale],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!startPoint) return;
      const coords = getCanvasCoordinates(e);

      // ERASER TOOL LOGIC
      if (currentTool === 'eraser') {
        const eraserSize = toolSettings.eraser?.size || 20;
        const eraserRect = {
          x: coords.x - eraserSize / 2,
          y: coords.y - eraserSize / 2,
          width: eraserSize,
          height: eraserSize,
        };

        // Check for intersections with annotations
        const pageAnnotations = state.annotations[currentPage] || [];
        for (const ann of pageAnnotations) {
          const annRect = { x: ann.x, y: ann.y, width: ann.width, height: ann.height };
          if (
            eraserRect.x < annRect.x + annRect.width &&
            eraserRect.x + eraserRect.width > annRect.x &&
            eraserRect.y < annRect.y + annRect.height &&
            eraserRect.y + eraserRect.height > annRect.y
          ) {
            dispatch({ type: 'DELETE_ANNOTATION', payload: { page: currentPage, id: ann.id } });
          }
        }
        
        // Check for intersections with text elements
        const pageTextElements = state.textElements[currentPage] || [];
        for (const text of pageTextElements) {
          const textRect = { x: text.x, y: text.y, width: text.width, height: text.height };
           if (
            eraserRect.x < textRect.x + textRect.width &&
            eraserRect.x + eraserRect.width > textRect.x &&
            eraserRect.y < textRect.y + textRect.height &&
            eraserRect.y + eraserRect.height > textRect.y
          ) {
            dispatch({ type: 'DELETE_TEXT_ELEMENT', payload: { page: currentPage, id: text.id } });
          }
        }

        // Add logic for other element types (whiteout, etc.) here in the future

      } 
      // SHAPE DRAWING LOGIC (remains the same)
      else if (drawingShape) {
        if (drawingShape.type === "line") {
          setDrawingShape({
            ...drawingShape,
            width: coords.x - startPoint.x,
            height: coords.y - startPoint.y,
          });
        } else {
          setDrawingShape({
            ...drawingShape,
            x: Math.min(startPoint.x, coords.x),
            y: Math.min(startPoint.y, coords.y),
            width: Math.abs(startPoint.x - coords.x),
            height: Math.abs(startPoint.y - coords.y),
          });
        }
      }
    },
    [startPoint, drawingShape, scale, currentTool, toolSettings, state.annotations, state.textElements, currentPage, dispatch],
  );

  const handleMouseUp = useCallback(() => {
    // UPDATED: Merged text tool logic with shape drawing logic
    if (currentTool === "text" && startPoint) {
      if (drawingShape?.width === 0 && drawingShape?.height === 0) {
        const settings = toolSettings[currentTool];
        const newTextElement: TextElement = {
          id: `text-${Date.now()}`,
          page: currentPage,
          text: "New Text Box",
          x: startPoint.x,
          y: startPoint.y,
          width: 200,
          height: 20,
          fontFamily: settings.fontFamily || 'Helvetica',
          fontSize: settings.fontSize || 16,
          color: settings.color || '#000000',
          bold: !!settings.bold,
          italic: !!settings.italic,
          underline: !!settings.underline,
          textAlign: settings.textAlign || 'left',
          lineHeight: settings.lineHeight || 1.2,
          rotation: 0,
        };

        dispatch({ type: 'ADD_TEXT_ELEMENT', payload: { page: currentPage, element: newTextElement } });
        dispatch({ type: 'SET_SELECTED_ELEMENT', payload: { id: newTextElement.id, type: 'text' } });
        dispatch({ type: "SAVE_TO_HISTORY" });
      }
    } else if (
      drawingShape &&
      startPoint &&
      (drawingShape.width !== 0 || drawingShape.height !== 0)
    ) {
      const finalShape = {
        ...drawingShape,
        id: `${drawingShape.type}-${Date.now()}`,
      };

      if (finalShape.type === "whiteout") {
        dispatch({
          type: "ADD_WHITEOUT_BLOCK",
          payload: { page: currentPage, block: finalShape as WhiteoutBlock },
        });
      } else {
        dispatch({
          type: "ADD_ANNOTATION",
          payload: { page: currentPage, annotation: finalShape as Annotation },
        });
      }
      dispatch({ type: "SAVE_TO_HISTORY" });
    }
    setDrawingShape(null);
    setStartPoint(null);
  }, [drawingShape, startPoint, dispatch, currentPage, currentTool, toolSettings]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) await loadPDF(file);
    },
    [loadPDF],
  );
  
  // ADDED: New handler for image uploads
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const src = event.target?.result as string;
          
          const img = new Image();
          img.onload = () => {
              const newImageElement: ImageElement = {
                  id: `image-${Date.now()}`,
                  page: currentPage,
                  src,
                  x: 100, // Default placement
                  y: 100,
                  width: img.width > 200 ? 200 : img.width,
                  height: img.width > 200 ? (img.height * 200 / img.width) : img.height,
                  rotation: 0,
              };
              dispatch({ type: 'ADD_IMAGE_ELEMENT', payload: { page: currentPage, element: newImageElement } });
              dispatch({ type: 'SAVE_TO_HISTORY' });
          }
          img.src = src;
      };
      reader.readAsDataURL(file);

      e.target.value = "";
  }, [currentPage, dispatch]);

  useKeyboardShortcuts({
    onUndo: () => dispatch({ type: "UNDO" }),
    onRedo: () => dispatch({ type: "REDO" }),
    onSave: savePDF,
    onDelete: () => {
      if (selectedElementId && selectedElementType) {
        // UPDATED: Added DELETE_IMAGE_ELEMENT
        const actionType =
          `DELETE_${selectedElementType.toUpperCase()}_ELEMENT` as
            | "DELETE_ANNOTATION"
            | "DELETE_TEXT_ELEMENT"
            | "DELETE_IMAGE_ELEMENT";
        if (
          actionType === "DELETE_ANNOTATION" ||
          actionType === "DELETE_TEXT_ELEMENT" ||
          actionType === "DELETE_IMAGE_ELEMENT"
        ) {
          dispatch({
            type: actionType,
            payload: { page: currentPage, id: selectedElementId },
          });
        }
      }
    },
    onZoomIn: () => dispatch({ type: "SET_SCALE", payload: scale * 1.2 }),
    onZoomOut: () => dispatch({ type: "SET_SCALE", payload: scale / 1.2 }),
    setCurrentTool: (tool: ToolType) =>
      dispatch({ type: "SET_CURRENT_TOOL", payload: tool }),
  });

  const currentPageAnnotations = state.annotations[currentPage] || [];
  const currentPageTextElements = state.textElements[currentPage] || [];
  const currentPageWhiteoutBlocks = state.whiteoutBlocks[currentPage] || [];
  // ADDED: Get current page image elements from state
  const currentPageImageElements = state.imageElements?.[currentPage] || [];

  return (
    <div
      className="h-full w-full bg-gray-200 flex flex-col font-sans"
    >
      <header
        className="bg-white border-b p-2 flex items-center justify-between flex-shrink-0"
      >
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload PDF
          </Button>
          {/* ADDED: Hidden input for image uploads */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png, image/jpeg"
            className="hidden"
            onChange={handleImageUpload}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
        {state.fileName && (
          <span
            className="text-sm font-medium text-gray-600 truncate max-w-xs"
          >
            {state.fileName}
          </span>
        )}
        <div>
          {/* Placeholder for other header items like User Menu */}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <PDFSidebar />
        <main
          className="flex-1 flex items-center justify-center overflow-auto p-8 bg-gray-300 dark:bg-gray-800"
        >
          {state.pdfDocument ? (
            <div
              className="relative shadow-lg"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ transform: `rotate(${state.rotation}deg)` }}
            >
              <canvas ref={canvasRef} className="block" />
              <div className="absolute inset-0">
                {" "}
                {/* Render non-interactive elements */}
                <div
                  className="absolute inset-0 pointer-events-none"
                >
                  {currentPageAnnotations.map((ann) => (
                    <div
                      key={ann.id}
                      style={{
                        position: "absolute",
                        left: ann.x * scale,
                        top: ann.y * scale,
                        width: ann.width! * scale,
                        height: ann.height! * scale,
                        border: `${ann.strokeWidth || 2}px solid ${ann.strokeColor || ann.color}`,
                        backgroundColor:
                          ann.fillColor ||
                          (ann.type === "highlight"
                            ? `${ann.color}80`
                            : "transparent"),
                        borderRadius:
                          ann.type === "circle"
                            ? "50%"
                            : `${ann.cornerRadius || 0}px`,
                        opacity: ann.opacity || 1,
                      }}
                    />
                  ))}
                  {currentPageWhiteoutBlocks.map((block) => (
                    <div
                      key={block.id}
                      style={{
                        position: "absolute",
                        left: block.x * scale,
                        top: block.y * scale,
                        width: block.width * scale,
                        height: block.height * scale,
                        backgroundColor: block.color || "#FFFFFF",
                      }}
                    />
                  ))}
                  {drawingShape && (
                    <div
                      style={{
                        position: "absolute",
                        left: drawingShape.x! * scale,
                        top: drawingShape.y! * scale,
                        width: drawingShape.width! * scale,
                        height: drawingShape.height! * scale,
                        border: `${drawingShape.strokeWidth || 2}px dashed #3B82F6`,
                        backgroundColor: `${drawingShape.fillColor || drawingShape.color || "#3B82F6"}30`,
                        borderRadius:
                          drawingShape.type === "circle"
                            ? "50%"
                            : `${drawingShape.cornerRadius || 0}px`,
                      }}
                    />
                  )}
                </div>
                {/* Render interactive text layer on top */}
                <AdvancedTextLayer
                  textElements={currentPageTextElements}
                  selectedElementId={selectedElementId}
                  scale={scale}
                  page={currentPage}
                  dispatch={dispatch}
                />
                {/* ADDED: Render interactive image layer */}
                <ImageLayer
                  imageElements={currentPageImageElements}
                  selectedElementId={selectedElementId}
                  scale={scale}
                  page={currentPage}
                  dispatch={dispatch}
                />
              </div>
            </div>
          ) : (
            <div
              className="text-center text-muted-foreground"
            >
              <h2 className="text-xl font-semibold mb-2">
                Welcome to the Editor
              </h2>
              <p>
                Click &quot;Upload PDF&quot; in the header to begin.
              </p>
            </div>
          )}
        </main>
        <ToolPanel />
      </div>
    </div>
  );
}