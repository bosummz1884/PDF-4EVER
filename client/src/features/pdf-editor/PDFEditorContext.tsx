import React, { createContext, useContext, useReducer, useRef, ReactNode } from 'react';
import { pdfjsLib } from "@/lib/pdfWorker";
import { TextElement, Annotation, WhiteoutBlock, FormField } from "@/types/pdf-types";

// Define the state type
export interface PDFEditorState {
  // Core PDF state
  pdfDocument: any;
  originalFileData: Uint8Array | null;
  currentPage: number;
  totalPages: number;
  scale: number;
  rotation: number;
  isLoading: boolean;
  isRendering: boolean;
  fileName: string;
  renderingError: string | null;
  
  // Tools and modes
  currentTool: 'select' | 'whiteout' | 'text' | 'highlight' | 'rectangle' | 'circle' | 
               'freeform' | 'form' | 'signature' | 'eraser' | 'checkmark' | 'x-mark' | 
               'line' | 'image' | 'inlineEdit' | 'ocr';
  activeMode: 'edit' | 'merge' | 'split' | 'forms' | 'fill';
  
  // Content layers
  textElements: { [page: number]: TextElement[] };
  annotations: Annotation[];
  whiteoutBlocks: WhiteoutBlock[];
  formFields: FormField[];
  
  // UI state
  showAnnotations: boolean;
  showTextElements: boolean;
  showFormFields: boolean;
  
  // History
  history: any[];
  historyIndex: number;
}

// Define action types
type PDFEditorAction =
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
  | { type: 'SET_CURRENT_TOOL'; payload: PDFEditorState['currentTool'] }
  | { type: 'SET_ACTIVE_MODE'; payload: PDFEditorState['activeMode'] }
  | { type: 'ADD_TEXT_ELEMENT'; payload: { page: number; element: TextElement } }
  | { type: 'UPDATE_TEXT_ELEMENT'; payload: { page: number; id: string; updates: Partial<TextElement> } }
  | { type: 'DELETE_TEXT_ELEMENT'; payload: { page: number; id: string } }
  | { type: 'ADD_ANNOTATION'; payload: Annotation }
  | { type: 'UPDATE_ANNOTATION'; payload: { id: string; updates: Partial<Annotation> } }
  | { type: 'DELETE_ANNOTATION'; payload: string }
  | { type: 'ADD_WHITEOUT_BLOCK'; payload: WhiteoutBlock }
  | { type: 'UPDATE_WHITEOUT_BLOCK'; payload: { id: string; updates: Partial<WhiteoutBlock> } }
  | { type: 'DELETE_WHITEOUT_BLOCK'; payload: string }
  | { type: 'ADD_FORM_FIELD'; payload: FormField }
  | { type: 'UPDATE_FORM_FIELD'; payload: { id: string; updates: Partial<FormField> } }
  | { type: 'DELETE_FORM_FIELD'; payload: string }
  | { type: 'SET_SHOW_ANNOTATIONS'; payload: boolean }
  | { type: 'SET_SHOW_TEXT_ELEMENTS'; payload: boolean }
  | { type: 'SET_SHOW_FORM_FIELDS'; payload: boolean }
  | { type: 'SAVE_TO_HISTORY' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET_EDITOR_STATE' };

// Initial state
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
  showAnnotations: true,
  showTextElements: true,
  showFormFields: true,
  history: [],
  historyIndex: -1
};

// Reducer function
function pdfEditorReducer(state: PDFEditorState, action: PDFEditorAction): PDFEditorState {
  switch (action.type) {
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
    
    case 'SET_CURRENT_TOOL':
      return { ...state, currentTool: action.payload };
    
    case 'SET_ACTIVE_MODE':
      return { ...state, activeMode: action.payload };
    
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
    
    case 'ADD_ANNOTATION':
      return {
        ...state,
        annotations: [...state.annotations, action.payload]
      };
    
    case 'UPDATE_ANNOTATION':
      return {
        ...state,
        annotations: state.annotations.map(annotation =>
          annotation.id === action.payload.id
            ? { ...annotation, ...action.payload.updates }
            : annotation
        )
      };
    
    case 'DELETE_ANNOTATION':
      return {
        ...state,
        annotations: state.annotations.filter(
          annotation => annotation.id !== action.payload
        )
      };
    
    case 'ADD_WHITEOUT_BLOCK':
      return {
        ...state,
        whiteoutBlocks: [...state.whiteoutBlocks, action.payload]
      };
    
    case 'UPDATE_WHITEOUT_BLOCK':
      return {
        ...state,
        whiteoutBlocks: state.whiteoutBlocks.map(block =>
          block.id === action.payload.id
            ? { ...block, ...action.payload.updates }
            : block
        )
      };
    
    case 'DELETE_WHITEOUT_BLOCK':
      return {
        ...state,
        whiteoutBlocks: state.whiteoutBlocks.filter(
          block => block.id !== action.payload
        )
      };
    
    case 'ADD_FORM_FIELD':
      return {
        ...state,
        formFields: [...state.formFields, action.payload]
      };
    
    case 'UPDATE_FORM_FIELD':
      return {
        ...state,
        formFields: state.formFields.map(field =>
          field.id === action.payload.id
            ? { ...field, ...action.payload.updates }
            : field
        )
      };
    
    case 'DELETE_FORM_FIELD':
      return {
        ...state,
        formFields: state.formFields.filter(
          field => field.id !== action.payload
        )
      };
    
    case 'SET_SHOW_ANNOTATIONS':
      return { ...state, showAnnotations: action.payload };
    
    case 'SET_SHOW_TEXT_ELEMENTS':
      return { ...state, showTextElements: action.payload };
    
    case 'SET_SHOW_FORM_FIELDS':
      return { ...state, showFormFields: action.payload };
    
    case 'SAVE_TO_HISTORY': {
      const currentState = {
        textElements: state.textElements,
        annotations: state.annotations,
        whiteoutBlocks: state.whiteoutBlocks,
        formFields: state.formFields
      };
      
      // Remove future history if we're not at the end
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      
      return {
        ...state,
        history: [...newHistory, currentState],
        historyIndex: newHistory.length
      };
    }
    
    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      
      const historyIndex = state.historyIndex - 1;
      const historyEntry = state.history[historyIndex];
      
      return {
        ...state,
        textElements: historyEntry.textElements,
        annotations: historyEntry.annotations,
        whiteoutBlocks: historyEntry.whiteoutBlocks,
        formFields: historyEntry.formFields,
        historyIndex
      };
    }
    
    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      
      const historyIndex = state.historyIndex + 1;
      const historyEntry = state.history[historyIndex];
      
      return {
        ...state,
        textElements: historyEntry.textElements,
        annotations: historyEntry.annotations,
        whiteoutBlocks: historyEntry.whiteoutBlocks,
        formFields: historyEntry.formFields,
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
          formFields: []
        }],
        historyIndex: 0
      };
      
      default:
        return state;
    }
  }
  
  // Create the context
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
  
  // Provider component
  export function PDFEditorProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(pdfEditorReducer, initialState);
    
    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Load PDF function
    const loadPDF = async (file: File) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_RENDERING_ERROR', payload: null });
        dispatch({ type: 'SET_FILE_NAME', payload: file.name });
        
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        dispatch({ type: 'SET_ORIGINAL_FILE_DATA', payload: uint8Array });
        
        await pdfjsLib.getDocument({ data: uint8Array }).promise.then(pdf => {
          dispatch({ type: 'SET_PDF_DOCUMENT', payload: pdf });
          dispatch({ type: 'SET_TOTAL_PAGES', payload: pdf.numPages });
          dispatch({ type: 'SET_CURRENT_PAGE', payload: 1 });
          
          // Reset editor state for new document
          dispatch({ type: 'RESET_EDITOR_STATE' });
          
          // Render first page
          renderPage(1);
        });
      } catch (error) {
        console.error('Error loading PDF:', error);
        dispatch({ type: 'SET_RENDERING_ERROR', payload: 'Failed to load PDF file.' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    // Render page function
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
        
        // Set canvas dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        annotCanvas.height = viewport.height;
        annotCanvas.width = viewport.width;
        
        // Render PDF page
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
        
        // Extract text layer if needed
        // This would be implemented based on your text extraction needs
        
      } catch (error) {
        console.error('Error rendering page:', error);
        dispatch({ type: 'SET_RENDERING_ERROR', payload: 'Failed to render page.' });
      } finally {
        dispatch({ type: 'SET_RENDERING', payload: false });
      }
    };
    
    // Save PDF function
    const savePDF = async (): Promise<Uint8Array> => {
      // This would be implemented based on your PDF saving logic
      // Using libraries like pdf-lib to modify the original PDF
      
      // Placeholder implementation
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
      savePDF
    };
    
    return (
      <PDFEditorContext.Provider value={contextValue}>
        {children}
      </PDFEditorContext.Provider>
    );
  }
  
  // Custom hook to use the PDF Editor context
  export function usePDFEditor() {
    const context = useContext(PDFEditorContext);
    if (context === undefined) {
      throw new Error('usePDFEditor must be used within a PDFEditorProvider');
    }
    return context;
  }