// src/features/components/KeyboardHandler.tsx

import { useEffect, useRef } from "react";
import { usePDFEditor } from "@/features/pdf-editor/PDFEditorContext";
import { Annotation, TextElement, ImageElement, WhiteoutBlock } from "@/types/pdf-types";

interface KeyboardHandlerProps {
  children: React.ReactNode;
}

export const KeyboardHandler: React.FC<KeyboardHandlerProps> = ({ children }) => {
  const { state, dispatch } = usePDFEditor();
  const { 
    selectedElementIds, 
    selectedElementType, 
    currentPage, 
    annotations, 
    textElements, 
    imageElements, 
    whiteoutBlocks,
    currentTool 
  } = state;

  // Clipboard state for copy/paste functionality
  const clipboardRef = useRef<{
    elements: (Annotation | TextElement | ImageElement | WhiteoutBlock)[];
    type: string;
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input fields
      if ((e.target as HTMLElement).tagName === 'INPUT' || 
          (e.target as HTMLElement).tagName === 'TEXTAREA' ||
          (e.target as HTMLElement).contentEditable === 'true') {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          handleDelete();
          break;

        case 'a':
        case 'A':
          if (isCtrl) {
            e.preventDefault();
            handleSelectAll();
          }
          break;

        case 'c':
        case 'C':
          if (isCtrl) {
            e.preventDefault();
            handleCopy();
          }
          break;

        case 'v':
        case 'V':
          if (isCtrl) {
            e.preventDefault();
            handlePaste();
          }
          break;

        case 'd':
        case 'D':
          if (isCtrl) {
            e.preventDefault();
            handleDuplicate();
          }
          break;

        case 'z':
        case 'Z':
          if (isCtrl && !isShift) {
            e.preventDefault();
            dispatch({ type: 'UNDO' });
          } else if (isCtrl && isShift) {
            e.preventDefault();
            dispatch({ type: 'REDO' });
          }
          break;

        case 'y':
        case 'Y':
          if (isCtrl) {
            e.preventDefault();
            dispatch({ type: 'REDO' });
          }
          break;

        case 'Escape':
          e.preventDefault();
          dispatch({ type: 'CLEAR_SELECTION' });
          break;

        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, selectedElementType, currentPage, currentTool]);

  const handleDelete = () => {
    if (selectedElementIds.length === 0) return;

    selectedElementIds.forEach(id => {
      if (selectedElementType === 'annotation') {
        dispatch({ type: 'DELETE_ANNOTATION', payload: { page: currentPage, id } });
      } else if (selectedElementType === 'text') {
        dispatch({ type: 'DELETE_TEXT_ELEMENT', payload: { page: currentPage, id } });
      } else if (selectedElementType === 'image') {
        dispatch({ type: 'DELETE_IMAGE_ELEMENT', payload: { page: currentPage, id } });
      } else if (selectedElementType === 'whiteout') {
        dispatch({ type: 'DELETE_WHITEOUT_BLOCK', payload: { page: currentPage, id } });
      }
    });

    dispatch({ type: 'CLEAR_SELECTION' });
    dispatch({ type: 'SAVE_TO_HISTORY' });
  };

  const handleSelectAll = () => {
    if (currentTool !== 'select') return;

    const currentPageAnnotations = annotations[currentPage] || [];
    const currentPageTextElements = textElements[currentPage] || [];
    const currentPageImageElements = imageElements[currentPage] || [];
    const currentPageWhiteoutBlocks = whiteoutBlocks[currentPage] || [];

    const allElements = [
      ...currentPageAnnotations.map(el => ({ ...el, elementType: 'annotation' })),
      ...currentPageTextElements.map(el => ({ ...el, elementType: 'text' })),
      ...currentPageImageElements.map(el => ({ ...el, elementType: 'image' })),
      ...currentPageWhiteoutBlocks.map(el => ({ ...el, elementType: 'whiteout' })),
    ];

    if (allElements.length > 0) {
      const allIds = allElements.map(el => el.id);
      dispatch({ 
        type: 'SET_SELECTED_ELEMENTS', 
        payload: { 
          ids: allIds, 
          type: allElements.length === 1 ? allElements[0].elementType as any : null 
        } 
      });
    }
  };

  const handleCopy = () => {
    if (selectedElementIds.length === 0 || !selectedElementType) return;

    const elements: (Annotation | TextElement | ImageElement | WhiteoutBlock)[] = [];

    selectedElementIds.forEach(id => {
      let element;
      if (selectedElementType === 'annotation') {
        element = Object.values(annotations).flat().find(el => el.id === id);
      } else if (selectedElementType === 'text') {
        element = Object.values(textElements).flat().find(el => el.id === id);
      } else if (selectedElementType === 'image') {
        element = Object.values(imageElements).flat().find(el => el.id === id);
      } else if (selectedElementType === 'whiteout') {
        element = Object.values(whiteoutBlocks).flat().find(el => el.id === id);
      }
      
      if (element) {
        elements.push(element);
      }
    });

    clipboardRef.current = {
      elements,
      type: selectedElementType
    };
  };

  const handlePaste = () => {
    if (!clipboardRef.current || clipboardRef.current.elements.length === 0) return;

    const offset = 20; // Offset for pasted elements
    const newIds: string[] = [];

    clipboardRef.current.elements.forEach((element, index) => {
      const newId = `${clipboardRef.current!.type}-${Date.now()}-${index}`;
      const newElement = {
        ...element,
        id: newId,
        x: element.x + offset,
        y: element.y + offset,
      };

      newIds.push(newId);

      if (clipboardRef.current!.type === 'annotation') {
        dispatch({ 
          type: 'ADD_ANNOTATION', 
          payload: { page: currentPage, annotation: newElement as Annotation } 
        });
      } else if (clipboardRef.current!.type === 'text') {
        dispatch({ 
          type: 'ADD_TEXT_ELEMENT', 
          payload: { page: currentPage, element: newElement as TextElement } 
        });
      } else if (clipboardRef.current!.type === 'image') {
        dispatch({ 
          type: 'ADD_IMAGE_ELEMENT', 
          payload: { page: currentPage, element: newElement as ImageElement } 
        });
      } else if (clipboardRef.current!.type === 'whiteout') {
        dispatch({ 
          type: 'ADD_WHITEOUT_BLOCK', 
          payload: { page: currentPage, block: newElement as WhiteoutBlock } 
        });
      }
    });

    // Select the newly pasted elements
    dispatch({ 
      type: 'SET_SELECTED_ELEMENTS', 
      payload: { 
        ids: newIds, 
        type: clipboardRef.current.type as any 
      } 
    });

    dispatch({ type: 'SAVE_TO_HISTORY' });
  };

  const handleDuplicate = () => {
    if (selectedElementIds.length === 0 || !selectedElementType) return;

    const offset = 20;
    const newIds: string[] = [];

    selectedElementIds.forEach((id, index) => {
      let element;
      if (selectedElementType === 'annotation') {
        element = Object.values(annotations).flat().find(el => el.id === id);
      } else if (selectedElementType === 'text') {
        element = Object.values(textElements).flat().find(el => el.id === id);
      } else if (selectedElementType === 'image') {
        element = Object.values(imageElements).flat().find(el => el.id === id);
      } else if (selectedElementType === 'whiteout') {
        element = Object.values(whiteoutBlocks).flat().find(el => el.id === id);
      }

      if (element) {
        const newId = `${selectedElementType}-${Date.now()}-${index}`;
        const newElement = {
          ...element,
          id: newId,
          x: element.x + offset,
          y: element.y + offset,
        };

        newIds.push(newId);

        if (selectedElementType === 'annotation') {
          dispatch({ 
            type: 'ADD_ANNOTATION', 
            payload: { page: currentPage, annotation: newElement as Annotation } 
          });
        } else if (selectedElementType === 'text') {
          dispatch({ 
            type: 'ADD_TEXT_ELEMENT', 
            payload: { page: currentPage, element: newElement as TextElement } 
          });
        } else if (selectedElementType === 'image') {
          dispatch({ 
            type: 'ADD_IMAGE_ELEMENT', 
            payload: { page: currentPage, element: newElement as ImageElement } 
          });
        } else if (selectedElementType === 'whiteout') {
          dispatch({ 
            type: 'ADD_WHITEOUT_BLOCK', 
            payload: { page: currentPage, block: newElement as WhiteoutBlock } 
          });
        }
      }
    });

    // Select the duplicated elements
    dispatch({ 
      type: 'SET_SELECTED_ELEMENTS', 
      payload: { 
        ids: newIds, 
        type: selectedElementType 
      } 
    });

    dispatch({ type: 'SAVE_TO_HISTORY' });
  };

  return <>{children}</>;
};
