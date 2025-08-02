import React, { createContext, useContext, useReducer, useRef, ReactNode } from 'react';
import { pdfjsLib } from "../../lib/pdfWorker";
import {
  TextElement, Annotation, WhiteoutBlock, FormField, TextBox, OCRResult, FontInfo
} from "@/types/pdf-types";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";

// =========================
// State Type Definitions
// =========================

export interface PDFEditorState {
  // Core PDF state
  pdfDocument: PDFDocumentProxy | null;
  originalFileData: Uint8Array | null;
  currentPage: number;
  totalPages: number;
  scale: number;
  rotation: number;
  isLoading: boolean;
  isRendering: boolean;
  fileName: string;
  renderingError: string | null;

  // Tool state (unified)
  currentTool: ToolType;
  activeMode: 'edit' | 'merge' | 'split' | 'forms' | 'fill';

  // Layers & Elements
  textElements: { [page: number]: TextElement[] };
  annotations: Annotation[];
  whiteoutBlocks: WhiteoutBlock[];
  formFields: FormField[];
  textBoxes: TextBox[];
  ocrResults: OCRResult[];
  availableFonts: FontInfo[];

  // Selection State (global)
  selectedAnnotationId: string | null;
  selectedTextBoxId: string | null;
  selectedWhiteoutBlockId: string | null;
  selectedFieldId: string | null;
  selectedBoxIds: Set<string>;

  // Tool-specific state/settings
  annotationColor: string;
  highlightColor: string;
  lineColor: string;
  lineStrokeWidth: number;
  whiteoutMode: boolean;
  signatureName: string;
  signatureFont: string;
  showSignatureDialog: boolean;

  // UI
  showAnnotations: boolean;
  showTextElements: boolean;
  showFormFields: boolean;
  showControls: boolean;
  zoom: number;

  // History
  history: any[];
  historyIndex: number;
}

// Unified tool types for all tools in the editor
export type ToolType =
  | 'select'
  | 'whiteout'
  | 'text'
  | 'highlight'
  | 'rectangle'
  | 'circle'
  | 'freeform'
  | 'form'
  | 'signature'
  | 'eraser'
  | 'checkmark'
  | 'x-mark'
  | 'line'
  | 'image'
  | 'inlineEdit'
  | 'ocr';

// =========================
// Action Types
// =========================

type PDFEditorAction =
  // Core PDF actions
  | { type: 'SET_PDF_DOCUMENT'; payload: any }
  | { type: 'SET_ORIGINAL_FILE_DATA'; payload: Uint8Array }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_TOTAL_PAGES'; payload: number }
  | { type: 'SET_SCALE'; payload: number }
  | { type: 'SET_ROTATION'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_RENDERING'; payload: boolean }
  | { type: 'SET_FILE_NAME'; payload: string }
  | { type: 'SET_RENDERING_ERROR'; payload: string | null }
  // Tool/mode
  | { type: 'SET_CURRENT_TOOL'; payload: ToolType }
  | { type: 'SET_ACTIVE_MODE'; payload: PDFEditorState['activeMode'] }
  // Text elements
  | { type: 'ADD_TEXT_ELEMENT'; payload: { page: number; element: TextElement } }
  | { type: 'UPDATE_TEXT_ELEMENT'; payload: { page: number; id: string; updates: Partial<TextElement> } }
  | { type: 'DELETE_TEXT_ELEMENT'; payload: { page: number; id: string } }
  // Annotations
  | { type: 'ADD_ANNOTATION'; payload: Annotation }
  | { type: 'UPDATE_ANNOTATION'; payload: { id: string; updates: Partial<Annotation> } }
  | { type: 'DELETE_ANNOTATION'; payload: string }
  // Whiteout
  | { type: 'ADD_WHITEOUT_BLOCK'; payload: WhiteoutBlock }
  | { type: 'UPDATE_WHITEOUT_BLOCK'; payload: { id: string; updates: Partial<WhiteoutBlock> } }
  | { type: 'DELETE_WHITEOUT_BLOCK'; payload: string }
  // Forms
  | { type: 'ADD_FORM_FIELD'; payload: FormField }
  | { type: 'UPDATE_FORM_FIELD'; payload: { id: string; updates: Partial<FormField> } }
  | { type: 'DELETE_FORM_FIELD'; payload: string }
  // Text boxes
  | { type: 'ADD_TEXT_BOX'; payload: TextBox }
  | { type: 'UPDATE_TEXT_BOX'; payload: { id: string; updates: Partial<TextBox> } }
  | { type: 'DELETE_TEXT_BOX'; payload: string }
  // OCR
  | { type: 'ADD_OCR_RESULT'; payload: OCRResult }
  | { type: 'UPDATE_OCR_RESULT'; payload: { id: string; updates: Partial<OCRResult> } }
  | { type: 'DELETE_OCR_RESULT'; payload: string }
  // Font
  | { type: 'SET_AVAILABLE_FONTS'; payload: FontInfo[] }
  // Selection
  | { type: 'SELECT_ANNOTATION'; payload: string | null }
  | { type: 'SELECT_TEXT_BOX'; payload: string | null }
  | { type: 'SELECT_WHITEOUT_BLOCK'; payload: string | null }
  | { type: 'SELECT_FIELD'; payload: string | null }
  | { type: 'SET_SELECTED_BOX_IDS'; payload: Set<string> }
  // Tool-specific state
  | { type: 'SET_ANNOTATION_COLOR'; payload: string }
  | { type: 'SET_HIGHLIGHT_COLOR'; payload: string }
  | { type: 'SET_LINE_COLOR'; payload: string }
  | { type: 'SET_LINE_STROKE_WIDTH'; payload: number }
  | { type: 'SET_WHITEOUT_MODE'; payload: boolean }
  | { type: 'SET_SIGNATURE_NAME'; payload: string }
  | { type: 'SET_SIGNATURE_FONT'; payload: string }
  | { type: 'SET_SHOW_SIGNATURE_DIALOG'; payload: boolean }
  // UI
  | { type: 'SET_SHOW_ANNOTATIONS'; payload: boolean }
  | { type: 'SET_SHOW_TEXT_ELEMENTS'; payload: boolean }
  | { type: 'SET_SHOW_FORM_FIELDS'; payload: boolean }
  | { type: 'SET_SHOW_CONTROLS'; payload: boolean }
  | { type: 'SET_ZOOM'; payload: number }
  // History
  | { type: 'SAVE_TO_HISTORY' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET_EDITOR_STATE' };

// =========================
// Initial State
// =========================

const initialState: PDFEditorState = {
  pdfDocument: null,
  originalFileData: null,
  currentPage: 1,
  totalPages: 0,
  scale: 1.0,
  rotation: 0,
  isLoading: false,
  isRendering: false,
  fileName: '',
  renderingError: null,
  currentTool: 'select',
  activeMode: 'edit',
  textElements: {},
  annotations: [],
  whiteoutBlocks: [],
  formFields: [],
  textBoxes: [],
  ocrResults: [],
  availableFonts: [],
  selectedAnnotationId: null,
  selectedTextBoxId: null,
  selectedWhiteoutBlockId: null,
  selectedFieldId: null,
  selectedBoxIds: new Set(),
  annotationColor: "#FFFF00",
  highlightColor: "#FFFF00",
  lineColor: "#000000",
  lineStrokeWidth: 2,
  whiteoutMode: false,
  signatureName: "",
  signatureFont: "Dancing Script",
  showSignatureDialog: false,
  showAnnotations: true,
  showTextElements: true,
  showFormFields: true,
  showControls: true,
  zoom: 100,
  history: [],
  historyIndex: -1
};

// =========================
// Reducer Function
// =========================

function pdfEditorReducer(state: PDFEditorState, action: PDFEditorAction): PDFEditorState {
  switch (action.type) {
    // ---- Core PDF state ----
    case 'SET_PDF_DOCUMENT':
      return { ...state, pdfDocument: action.payload };

    case 'SET_ORIGINAL_FILE_DATA':
      return { ...state, originalFileData: action.payload };

    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };

    case 'SET_TOTAL_PAGES':
      return { ...state, totalPages: action.payload };

    case 'SET_SCALE':
      return { ...state, scale: action.payload };

    case 'SET_ROTATION':
      return { ...state, rotation: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_RENDERING':
      return { ...state, isRendering: action.payload };

    case 'SET_FILE_NAME':
      return { ...state, fileName: action.payload };

    case 'SET_RENDERING_ERROR':
      return { ...state, renderingError: action.payload };

    // ---- Tool/Mode ----
    case 'SET_CURRENT_TOOL':
      return { ...state, currentTool: action.payload };

    case 'SET_ACTIVE_MODE':
      return { ...state, activeMode: action.payload };

    // ---- Text Elements ----
    case 'ADD_TEXT_ELEMENT': {
      const { page, element } = action.payload;
      const pageElements = state.textElements[page] || [];
      return {
        ...state,
        textElements: {
          ...state.textElements,
          [page]: [...pageElements, element]
        }
      };
    }
    case 'UPDATE_TEXT_ELEMENT': {
      const { page, id, updates } = action.payload;
      const pageElements = state.textElements[page] || [];
      return {
        ...state,
        textElements: {
          ...state.textElements,
          [page]: pageElements.map(element =>
            element.id === id ? { ...element, ...updates } : element
          )
        }
      };
    }
    case 'DELETE_TEXT_ELEMENT': {
      const { page, id } = action.payload;
      const pageElements = state.textElements[page] || [];
      return {
        ...state,
        textElements: {
          ...state.textElements,
          [page]: pageElements.filter(element => element.id !== id)
        }
      };
    }

    // ---- Annotations ----
    case 'ADD_ANNOTATION':
      return { ...state, annotations: [...state.annotations, action.payload] };

    case 'UPDATE_ANNOTATION':
      return {
        ...state,
        annotations: state.annotations.map(ann =>
          ann.id === action.payload.id ? { ...ann, ...action.payload.updates } : ann
        )
      };

    case 'DELETE_ANNOTATION':
      return {
        ...state,
        annotations: state.annotations.filter(ann => ann.id !== action.payload)
      };

    // ---- Whiteout ----
    case 'ADD_WHITEOUT_BLOCK':
      return { ...state, whiteoutBlocks: [...state.whiteoutBlocks, action.payload] };

    case 'UPDATE_WHITEOUT_BLOCK':
      return {
        ...state,
        whiteoutBlocks: state.whiteoutBlocks.map(block =>
          block.id === action.payload.id ? { ...block, ...action.payload.updates } : block
        )
      };

    case 'DELETE_WHITEOUT_BLOCK':
      return {
        ...state,
        whiteoutBlocks: state.whiteoutBlocks.filter(block => block.id !== action.payload)
      };

    // ---- Forms ----
    case 'ADD_FORM_FIELD':
      return { ...state, formFields: [...state.formFields, action.payload] };

    case 'UPDATE_FORM_FIELD':
      return {
        ...state,
        formFields: state.formFields.map(field =>
          field.id === action.payload.id ? { ...field, ...action.payload.updates } : field
        )
      };

    case 'DELETE_FORM_FIELD':
      return {
        ...state,
        formFields: state.formFields.filter(field => field.id !== action.payload)
      };

    // ---- Text Boxes ----
    case 'ADD_TEXT_BOX':
      return { ...state, textBoxes: [...state.textBoxes, action.payload] };

    case 'UPDATE_TEXT_BOX':
      return {
        ...state,
        textBoxes: state.textBoxes.map(box =>
          box.id === action.payload.id ? { ...box, ...action.payload.updates } : box
        )
      };

    case 'DELETE_TEXT_BOX':
      return {
        ...state,
        textBoxes: state.textBoxes.filter(box => box.id !== action.payload)
      };

    // ---- OCR Results ----
    case 'ADD_OCR_RESULT':
      return { ...state, ocrResults: [...state.ocrResults, action.payload] };

    case 'UPDATE_OCR_RESULT':
      return {
        ...state,
        ocrResults: state.ocrResults.map(result =>
          result.id === action.payload.id ? { ...result, ...action.payload.updates } : result
        )
      };

    case 'DELETE_OCR_RESULT':
      return {
        ...state,
        ocrResults: state.ocrResults.filter(result => result.id !== action.payload)
      };

    // ---- Fonts ----
    case 'SET_AVAILABLE_FONTS':
      return { ...state, availableFonts: action.payload };

    // ---- Selection ----
    case 'SELECT_ANNOTATION':
      return { ...state, selectedAnnotationId: action.payload };

    case 'SELECT_TEXT_BOX':
      return { ...state, selectedTextBoxId: action.payload };

    case 'SELECT_WHITEOUT_BLOCK':
      return { ...state, selectedWhiteoutBlockId: action.payload };

    case 'SELECT_FIELD':
      return { ...state, selectedFieldId: action.payload };

    case 'SET_SELECTED_BOX_IDS':
      return { ...state, selectedBoxIds: action.payload };

    // ---- Tool-specific state/settings ----
    case 'SET_ANNOTATION_COLOR':
      return { ...state, annotationColor: action.payload };

    case 'SET_HIGHLIGHT_COLOR':
      return { ...state, highlightColor: action.payload };

    case 'SET_LINE_COLOR':
      return { ...state, lineColor: action.payload };

    case 'SET_LINE_STROKE_WIDTH':
      return { ...state, lineStrokeWidth: action.payload };

    case 'SET_WHITEOUT_MODE':
      return { ...state, whiteoutMode: action.payload };

    case 'SET_SIGNATURE_NAME':
      return { ...state, signatureName: action.payload };

    case 'SET_SIGNATURE_FONT':
      return { ...state, signatureFont: action.payload };

    case 'SET_SHOW_SIGNATURE_DIALOG':
      return { ...state, showSignatureDialog: action.payload };

    // ---- UI ----
    case 'SET_SHOW_ANNOTATIONS':
      return { ...state, showAnnotations: action.payload };

    case 'SET_SHOW_TEXT_ELEMENTS':
      return { ...state, showTextElements: action.payload };

    case 'SET_SHOW_FORM_FIELDS':
      return { ...state, showFormFields: action.payload };

    case 'SET_SHOW_CONTROLS':
      return { ...state, showControls: action.payload };

    case 'SET_ZOOM':
      return { ...state, zoom: action.payload };

    // ---- History ----
    case 'SAVE_TO_HISTORY': {
      const currentState = {
        textElements: state.textElements,
        annotations: state.annotations,
        whiteoutBlocks: state.whiteoutBlocks,
        formFields: state.formFields,
        textBoxes: state.textBoxes,
        ocrResults: state.ocrResults,
      };
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      return {
        ...state,
        history: [...newHistory, currentState],
        historyIndex: newHistory.length,
      };
    }
    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const historyIndex = state.historyIndex - 1;
      const entry = state.history[historyIndex];
      return {
        ...state,
        ...entry,
        historyIndex
      };
    }
    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const historyIndex = state.historyIndex + 1;
      const entry = state.history[historyIndex];
      return {
        ...state,
        ...entry,
        historyIndex
      };
    }
    case 'RESET_EDITOR_STATE':
      return {
        ...initialState,
        history: [{
          textElements: {},
          annotations: [],
          whiteoutBlocks: [],
          formFields: [],
          textBoxes: [],
          ocrResults: [],
        }],
        historyIndex: 0,
      };

    default:
      return state;
  }
}

// =========================
// Context & Provider
// =========================

const PDFEditorContext = createContext<{
  state: PDFEditorState;
  dispatch: React.Dispatch<PDFEditorAction>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  annotationCanvasRef: React.RefObject<HTMLCanvasElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  renderPage: (pageNumber: number) => Promise<void>;
  loadPDF: (file: File) => Promise<void>;
  savePDF: () => Promise<Uint8Array>;
} | undefined>(undefined);

// =========================
// Provider Component
// =========================

export function PDFEditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(pdfEditorReducer, initialState);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load PDF
  const loadPDF = async (file: File) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_RENDERING_ERROR', payload: null });
      dispatch({ type: 'SET_FILE_NAME', payload: file.name });

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      dispatch({ type: 'SET_ORIGINAL_FILE_DATA', payload: uint8Array });

      const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
      dispatch({ type: 'SET_PDF_DOCUMENT', payload: pdf });
      dispatch({ type: 'SET_TOTAL_PAGES', payload: pdf.numPages });
      dispatch({ type: 'SET_CURRENT_PAGE', payload: 1 });

      dispatch({ type: 'RESET_EDITOR_STATE' });

      await renderPage(1);
    } catch (error) {
      console.error('Error loading PDF:', error);
      dispatch({ type: 'SET_RENDERING_ERROR', payload: 'Failed to load PDF file.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Render PDF Page
  const renderPage = async (pageNumber: number) => {
    if (!state.pdfDocument) return;
    try {
      dispatch({ type: 'SET_RENDERING', payload: true });
      dispatch({ type: 'SET_CURRENT_PAGE', payload: pageNumber });

      const page = await state.pdfDocument.getPage(pageNumber);
      const canvas = canvasRef.current;
      const annotCanvas = annotationCanvasRef.current;

      if (!canvas || !annotCanvas) return;

      const viewport = page.getViewport({
        scale: state.scale,
        rotation: state.rotation
      });

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      annotCanvas.height = viewport.height;
      annotCanvas.width = viewport.width;

      const renderContext = {
        canvasContext: canvas.getContext('2d'),
        viewport
      };

      await page.render(renderContext).promise;

      // Clear annotation canvas
      const annotCtx = annotCanvas.getContext('2d');
      if (annotCtx) {
        annotCtx.clearRect(0, 0, annotCanvas.width, annotCanvas.height);
      }
      // Add text/annotation layer rendering as needed

    } catch (error) {
      console.error('Error rendering page:', error);
      dispatch({ type: 'SET_RENDERING_ERROR', payload: 'Failed to render page.' });
    } finally {
      dispatch({ type: 'SET_RENDERING', payload: false });
    }
  };

  // Save PDF (placeholder)
  const savePDF = async (): Promise<Uint8Array> => {
    // TODO: Real PDF save implementation with annotations, etc.
    return state.originalFileData || new Uint8Array();
  };

  const contextValue = {
    state,
    dispatch,
    canvasRef,
    annotationCanvasRef,
    fileInputRef,
    renderPage,
    loadPDF,
    savePDF,
  };

  return (
    <PDFEditorContext.Provider value={contextValue}>
      {children}
    </PDFEditorContext.Provider>
  );
}

// =========================
// Custom Hook
// =========================

export function usePDFEditor() {
  const context = useContext(PDFEditorContext);
  if (!context) {
    throw new Error('usePDFEditor must be used within a PDFEditorProvider');
  }
  return context;
}
