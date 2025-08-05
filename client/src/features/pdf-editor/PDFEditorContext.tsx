import React, { createContext, useContext, useReducer, useRef, ReactNode } from 'react';
import { PDFEditorState, PDFEditorAction, ToolType, ToolSettings } from '@/types/pdf-types'; // Import the unified action type
import { getDocument, PDFDocumentProxy } from 'pdfjs-dist';
import { toolRegistry } from './toolRegistry';
import '@/lib/pdfWorker';
import { savePdfWithAnnotations, triggerDownload } from '@/lib/savePdfWithText';

const initialState: PDFEditorState = {
  pdfDocument: null, originalPdfData: null, currentPage: 1, totalPages: 0, scale: 1.0,
  rotation: 0, isLoading: false, fileName: '', annotations: {}, textElements: {},
  formFields: {}, whiteoutBlocks: {}, ocrResults: {}, selectedElementId: null,
  selectedElementType: null, currentTool: 'select',
  toolSettings: Object.values(toolRegistry).reduce((acc, tool) => {
    acc[tool.name] = { ...tool.defaultSettings };
    return acc;
  }, {} as Record<ToolType, ToolSettings>),
  history: [], historyIndex: -1,
};

function pdfEditorReducer(state: PDFEditorState, action: PDFEditorAction): PDFEditorState {
  switch (action.type) {
    case 'LOAD_SUCCESS':
      return { ...initialState, pdfDocument: action.payload.doc, originalPdfData: action.payload.data, totalPages: action.payload.doc.numPages, fileName: action.payload.file.name, history: [{ ...initialState }], historyIndex: 0 };
    case 'SET_LOADING': return { ...state, isLoading: action.payload };
    case 'SET_CURRENT_PAGE': return { ...state, currentPage: action.payload };
    case 'SET_SCALE': return { ...state, scale: action.payload };
    case 'SET_ROTATION': return { ...state, rotation: action.payload };
    case 'SET_CURRENT_TOOL': return { ...state, currentTool: action.payload };
    case 'SET_SELECTED_ELEMENT': return { ...state, selectedElementId: action.payload.id, selectedElementType: action.payload.type };
    case 'ADD_ANNOTATION':
      return { ...state, annotations: { ...state.annotations, [action.payload.page]: [...(state.annotations[action.payload.page] || []), action.payload.annotation] } };
    case 'UPDATE_ANNOTATION':
      return { ...state, annotations: { ...state.annotations, [action.payload.page]: (state.annotations[action.payload.page] || []).map(el => el.id === action.payload.id ? { ...el, ...action.payload.updates } : el) } };
    case 'DELETE_ANNOTATION':
      return { ...state, annotations: { ...state.annotations, [action.payload.page]: (state.annotations[action.payload.page] || []).filter(el => el.id !== action.payload.id) } };
    case 'ADD_TEXT_ELEMENT':
      return { ...state, textElements: { ...state.textElements, [action.payload.page]: [...(state.textElements[action.payload.page] || []), action.payload.element] } };
    case 'UPDATE_TEXT_ELEMENT':
      return { ...state, textElements: { ...state.textElements, [action.payload.page]: (state.textElements[action.payload.page] || []).map(el => el.id === action.payload.id ? { ...el, ...action.payload.updates } : el) } };
    case 'DELETE_TEXT_ELEMENT':
      return { ...state, textElements: { ...state.textElements, [action.payload.page]: (state.textElements[action.payload.page] || []).filter(el => el.id !== action.payload.id) } };
    case 'ADD_WHITEOUT_BLOCK':
        return { ...state, whiteoutBlocks: { ...state.whiteoutBlocks, [action.payload.page]: [...(state.whiteoutBlocks[action.payload.page] || []), action.payload.block] } };
    case 'UPDATE_WHITEOUT_BLOCK':
        return { ...state, whiteoutBlocks: { ...state.whiteoutBlocks, [action.payload.page]: (state.whiteoutBlocks[action.payload.page] || []).map(el => el.id === action.payload.id ? { ...el, ...action.payload.updates } : el) } };
    case 'DELETE_WHITEOUT_BLOCK':
        return { ...state, whiteoutBlocks: { ...state.whiteoutBlocks, [action.payload.page]: (state.whiteoutBlocks[action.payload.page] || []).filter(el => el.id !== action.payload.id) } };
    case 'ADD_FORM_FIELD':
        return { ...state, formFields: { ...state.formFields, [action.payload.page]: [...(state.formFields[action.payload.page] || []), action.payload.field] } };
    case 'UPDATE_FORM_FIELD':
        return { ...state, formFields: { ...state.formFields, [action.payload.page]: (state.formFields[action.payload.page] || []).map(el => el.id === action.payload.id ? { ...el, ...action.payload.updates } : el) } };
    case 'DELETE_FORM_FIELD':
        return { ...state, formFields: { ...state.formFields, [action.payload.page]: (state.formFields[action.payload.page] || []).filter(el => el.id !== action.payload.id) } };
    case 'SET_OCR_RESULTS':
        return { ...state, ocrResults: { ...state.ocrResults, [action.payload.page]: action.payload.results } };
    case 'UPDATE_TOOL_SETTING':
      return { ...state, toolSettings: { ...state.toolSettings, [action.payload.toolId]: { ...state.toolSettings[action.payload.toolId], [action.payload.key]: action.payload.value } } };
    case 'SAVE_TO_HISTORY': {
      const snapshot: Partial<PDFEditorState> = { annotations: state.annotations, formFields: state.formFields, whiteoutBlocks: state.whiteoutBlocks, textElements: state.textElements };
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(snapshot);
      return { ...state, history: newHistory, historyIndex: newHistory.length - 1 };
    }
    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return { ...state, ...state.history[newIndex], historyIndex: newIndex };
    }
    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return { ...state, ...state.history[newIndex], historyIndex: newIndex };
    }
    default:
      return state;
  }
}

interface PDFEditorContextType {
  state: PDFEditorState;
  dispatch: React.Dispatch<PDFEditorAction>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  loadPDF: (file: File) => Promise<void>;
  renderPage: (pageNumber?: number) => Promise<void>;
  savePDF: () => Promise<void>;
}

const PDFEditorContext = createContext<PDFEditorContextType | undefined>(undefined);

export function PDFEditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(pdfEditorReducer, initialState);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPDF = async (file: File) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const doc = await getDocument({ data }).promise;
      dispatch({ type: 'LOAD_SUCCESS', payload: { doc, file, data } });
    } catch (error) {
      console.error('Failed to load PDF:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const renderPage = async (pageNumber?: number) => {
    const pageToRender = pageNumber || state.currentPage;
    if (!state.pdfDocument || !canvasRef.current) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    const canvas = canvasRef.current;
    const page = await state.pdfDocument.getPage(pageToRender);
    const viewport = page.getViewport({ scale: state.scale, rotation: state.rotation });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const context = canvas.getContext('2d');
    if (context) {
      await page.render({ canvasContext: context, viewport }).promise;
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  };

  const savePDF = async () => {
    if (!state.originalPdfData) {
      alert("No PDF file loaded to save.");
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const allAnnotations = Object.values(state.annotations).flat();
      const allTextElements = Object.values(state.textElements).flat();
      const allWhiteoutBlocks = Object.values(state.whiteoutBlocks).flat();
      const savedPdfBytes = await savePdfWithAnnotations(state.originalPdfData, allTextElements, allAnnotations, allWhiteoutBlocks);
      const newFilename = state.fileName.replace('.pdf', '-edited.pdf');
      triggerDownload(savedPdfBytes, newFilename);
    } catch (error) {
        console.error("Failed to save PDF:", error);
        alert("An error occurred while saving the PDF. See the console for details.");
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const contextValue = { state, dispatch, canvasRef, fileInputRef, loadPDF, renderPage, savePDF };
  return <PDFEditorContext.Provider value={contextValue}>{children}</PDFEditorContext.Provider>;
}

export function usePDFEditor() {
  const context = useContext(PDFEditorContext);
  if (!context) {
    throw new Error('usePDFEditor must be used within a PDFEditorProvider');
  }
  return context;
}