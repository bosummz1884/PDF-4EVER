import React, {
  createContext,
  useContext,
  useReducer,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import {
  PDFEditorState,
  PDFEditorAction,
  ToolType,
  ToolSettings,
  EditorTool,
  TextRegion,
  OCRResult,
  OCRLanguage,
  OCRSettings,
} from "../../types/pdf-types"; // Import the unified action type
// T2.2: Font recognition imports
import { fontRecognitionService } from "@/services/fontRecognitionService";
import { getDocument, RenderTask, PDFDocumentProxy } from "pdfjs-dist";
import { toolRegistry } from "../../components/tool-panels/toolRegistry";
import "@/lib/pdfWorker";
import { savePdfWithAnnotations, triggerDownload } from "../../lib/savePdf";

const initialState: PDFEditorState = {
  pdfDocument: null as PDFDocumentProxy | null,
  originalPdfData: null,
  currentPage: 1,
  totalPages: 0,
  scale: 1.0,
  rotation: 0,
  isLoading: false,
  isProcessingOCR: false,
  ocrProgress: 0,
  ocrStatus: 'idle',
  ocrError: null,
  fileName: "",
  annotations: {},
  textElements: {},
  formFields: {},
  whiteoutBlocks: {},
  ocrResults: {},
  ocrLanguages: [
    { code: 'eng', name: 'English', isEnabled: true, isDownloaded: true },
    { code: 'spa', name: 'Spanish', isEnabled: false, isDownloaded: false },
    { code: 'fra', name: 'French', isEnabled: false, isDownloaded: false },
    { code: 'deu', name: 'German', isEnabled: false, isDownloaded: false },
    { code: 'chi_sim', name: 'Chinese (Simplified)', isEnabled: false, isDownloaded: false },
  ],
  selectedOcrLanguage: 'eng',
  extractedTextRegions: {},
  detectedFonts: {},
  imageElements: {},
  selectedElementId: null,
  selectedElementIds: [],
  selectedElementType: null,
  signatureElements: {},
  freeformElements: {},
  currentTool: "select",
  canvasRef: null,
  toolSettings: Object.values(toolRegistry).reduce(
    (acc: Record<ToolType, ToolSettings>, tool: EditorTool) => {
      acc[tool.name] = { 
        ...tool.defaultSettings,
        // OCR-specific settings
        ...(tool.name === 'ocr' ? {
          confidenceThreshold: 70,
          autoDetectLanguage: true,
          preprocessImages: true,
          detectTables: true,
          preserveFormatting: true,
          outputFormat: 'text',
          dpi: 300,
          preserveInterwordSpaces: true,
          ocrEngineMode: 'default',
          pageSegMode: 'auto',
          whitelist: '',
          blacklist: ''
        } : {})
      };
      return acc;
    },
    {} as Record<ToolType, ToolSettings>,
  ),
  history: [],
  historyIndex: -1,
  fontMatchingEnabled: true,
  ocrConfidenceThreshold: 70,
  lastOcrTimestamp: null,
  inlineEditingRegion: null as TextRegion | null,
};

function pdfEditorReducer(
  state: PDFEditorState,
  action: PDFEditorAction,
): PDFEditorState {
  switch (action.type) {
    case "LOAD_SUCCESS": {
      // Create initial snapshot with only editable content (no document state)
      const initialSnapshot: Partial<PDFEditorState> = {
        annotations: {},
        formFields: {},
        whiteoutBlocks: {},
        textElements: {},
        imageElements: {},
        signatureElements: {},
        freeformElements: {},
        extractedTextRegions: {},
        ocrResults: {},
      };
      return {
        ...state,
        ...initialState,
        pdfDocument: action.payload.doc,
        originalPdfData: action.payload.data,
        totalPages: action.payload.doc.numPages,
        fileName: action.payload.file.name,
        history: [initialSnapshot],
        historyIndex: 0,
        // Preserve OCR settings from previous state
        ocrLanguages: state.ocrLanguages,
        selectedOcrLanguage: state.selectedOcrLanguage,
        ocrConfidenceThreshold: state.ocrConfidenceThreshold,
        toolSettings: {
          ...state.toolSettings,
          ...Object.values(toolRegistry).reduce((acc, tool) => {
            if (tool.name === 'ocr') {
              acc[tool.name] = {
                ...tool.defaultSettings,
                ...state.toolSettings.ocr
              };
            }
            return acc;
          }, {} as Record<string, any>)
        }
      };
    }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
      
    case "SET_OCR_PROGRESS":
      return { ...state, ocrProgress: action.payload };
      
    case "SET_OCR_STATUS":
      return { 
        ...state, 
        ocrStatus: action.payload,
        isProcessingOCR: action.payload === 'processing',
        ocrError: action.payload === 'error' ? state.ocrError : null,
        lastOcrTimestamp: action.payload === 'completed' ? Date.now() : state.lastOcrTimestamp
      };
      
    case "SET_OCR_ERROR":
      return { 
        ...state, 
        ocrError: action.payload,
        ocrStatus: action.payload ? 'error' : state.ocrStatus,
        isProcessingOCR: false
      };
      
    case "SET_OCR_RESULTS": {
      const { page, results } = action.payload;
      const currentResults = { ...state.ocrResults };
      currentResults[page] = results;
      
      return {
        ...state,
        ocrResults: currentResults,
        // Update text regions if they exist in the results
        extractedTextRegions: {
          ...state.extractedTextRegions,
          [page]: results.filter(r => !r.isTable).map(result => ({
            id: result.id,
            page: result.page,
            x: result.boundingBox.x0,
            y: result.boundingBox.y0,
            width: result.boundingBox.x1 - result.boundingBox.x0,
            height: result.boundingBox.y1 - result.boundingBox.y0,
            text: result.text,
            fontName: 'Arial', // Default font, can be overridden
            fontSize: 12, // Default size
            fontWeight: 'normal',
            fontStyle: 'normal',
            color: '#000000',
            rotation: 0,
            isEditing: false
          }))
        }
      };
    }
    
    case "SET_OCR_LANGUAGES":
      return { 
        ...state, 
        ocrLanguages: action.payload,
        // Keep the selected language if it's still valid
        selectedOcrLanguage: action.payload.some(lang => lang.code === state.selectedOcrLanguage) 
          ? state.selectedOcrLanguage 
          : action.payload[0]?.code || 'eng'
      };
      
    case "SET_SELECTED_OCR_LANGUAGE":
      return { 
        ...state, 
        selectedOcrLanguage: action.payload 
      };
      
    case "SET_OCR_CONFIDENCE_THRESHOLD":
      return { 
        ...state, 
        ocrConfidenceThreshold: Math.max(0, Math.min(100, action.payload)),
        toolSettings: {
          ...state.toolSettings,
          ocr: {
            ...state.toolSettings.ocr,
            confidenceThreshold: Math.max(0, Math.min(100, action.payload))
          }
        }
      };
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_SCALE":
      return { ...state, scale: action.payload };
    case "SET_ROTATION":
      return { ...state, rotation: action.payload };
    case "SET_CURRENT_TOOL":
      return { ...state, currentTool: action.payload };
    case "SET_SELECTED_ELEMENT":
      return {
        ...state,
        selectedElementId: action.payload.id,
        selectedElementIds: action.payload.id ? [action.payload.id] : [],
        selectedElementType: action.payload.type,
      };
    case "SET_SELECTED_ELEMENTS":
      return {
        ...state,
        selectedElementId: action.payload.ids.length > 0 ? action.payload.ids[0] : null,
        selectedElementIds: action.payload.ids,
        selectedElementType: action.payload.type,
      };
    case "ADD_TO_SELECTION":
      const newIds = state.selectedElementIds.includes(action.payload.id)
        ? state.selectedElementIds.filter(id => id !== action.payload.id)
        : [...state.selectedElementIds, action.payload.id];
      return {
        ...state,
        selectedElementId: newIds.length > 0 ? newIds[0] : null,
        selectedElementIds: newIds,
        selectedElementType: newIds.length > 0 ? action.payload.type : null,
      };
    case "CLEAR_SELECTION":
      return {
        ...state,
        selectedElementId: null,
        selectedElementIds: [],
        selectedElementType: null,
      };

      
    case "ADD_ANNOTATION":
      return {
        ...state,
        annotations: {
          ...state.annotations,
          [action.payload.page]: [
            ...(state.annotations[action.payload.page] || []),
            action.payload.annotation,
          ],
        },
      };
    case "UPDATE_ANNOTATION":
      return {
        ...state,
        annotations: {
          ...state.annotations,
          [action.payload.page]: (
            state.annotations[action.payload.page] || []
          ).map((el) =>
            el.id === action.payload.id
              ? { ...el, ...action.payload.updates }
              : el,
          ),
        },
      };
    case "DELETE_ANNOTATION":
      return {
        ...state,
        annotations: {
          ...state.annotations,
          [action.payload.page]: (
            state.annotations[action.payload.page] || []
          ).filter((el) => el.id !== action.payload.id),
        },
      };

      case "ADD_IMAGE_ELEMENT":
      return {
        ...state,
        imageElements: {
          ...state.imageElements,
          [action.payload.page]: [
            ...(state.imageElements[action.payload.page] || []),
            action.payload.element,
          ],
        },
      };
    case "UPDATE_IMAGE_ELEMENT":
      return {
        ...state,
        imageElements: {
          ...state.imageElements,
          [action.payload.page]: (
            state.imageElements[action.payload.page] || []
          ).map((el) =>
            el.id === action.payload.id
              ? { ...el, ...action.payload.updates }
              : el,
          ),
        },
      };
    case "DELETE_IMAGE_ELEMENT":
      return {
        ...state,
        imageElements: {
          ...state.imageElements,
          [action.payload.page]: (
            state.imageElements[action.payload.page] || []
          ).filter((el) => el.id !== action.payload.id),
        },
      };
    case "ADD_TEXT_ELEMENT":
      return {
        ...state,
        textElements: {
          ...state.textElements,
          [action.payload.page]: [
            ...(state.textElements[action.payload.page] || []),
            action.payload.element,
          ],
        },
      };
    case "UPDATE_TEXT_ELEMENT":
      return {
        ...state,
        textElements: {
          ...state.textElements,
          [action.payload.page]: (
            state.textElements[action.payload.page] || []
          ).map((el) =>
            el.id === action.payload.id
              ? { ...el, ...action.payload.updates }
              : el,
          ),
        },
      };
    case "DELETE_TEXT_ELEMENT":
      return {
        ...state,
        textElements: {
          ...state.textElements,
          [action.payload.page]: (
            state.textElements[action.payload.page] || []
          ).filter((el) => el.id !== action.payload.id),
        },
      };
    case "ADD_WHITEOUT_BLOCK":
      return {
        ...state,
        whiteoutBlocks: {
          ...state.whiteoutBlocks,
          [action.payload.page]: [
            ...(state.whiteoutBlocks[action.payload.page] || []),
            action.payload.block,
          ],
        },
      };
    case "UPDATE_WHITEOUT_BLOCK":
      return {
        ...state,
        whiteoutBlocks: {
          ...state.whiteoutBlocks,
          [action.payload.page]: (
            state.whiteoutBlocks[action.payload.page] || []
          ).map((el) =>
            el.id === action.payload.id
              ? { ...el, ...action.payload.updates }
              : el,
          ),
        },
      };
    case "DELETE_WHITEOUT_BLOCK":
      return {
        ...state,
        whiteoutBlocks: {
          ...state.whiteoutBlocks,
          [action.payload.page]: (
            state.whiteoutBlocks[action.payload.page] || []
          ).filter((el) => el.id !== action.payload.id),
        },
      };
    case "ADD_FORM_FIELD":
      return {
        ...state,
        formFields: {
          ...state.formFields,
          [action.payload.page]: [
            ...(state.formFields[action.payload.page] || []),
            action.payload.field,
          ],
        },
      };
    case "UPDATE_FORM_FIELD":
      return {
        ...state,
        formFields: {
          ...state.formFields,
          [action.payload.page]: (
            state.formFields[action.payload.page] || []
          ).map((el) =>
            el.id === action.payload.id
              ? { ...el, ...action.payload.updates }
              : el,
          ),
        },
      };
    case "DELETE_FORM_FIELD":
      return {
        ...state,
        formFields: {
          ...state.formFields,
          [action.payload.page]: (
            state.formFields[action.payload.page] || []
          ).filter((el) => el.id !== action.payload.id),
        },
      };

    // --- Freeform Element Actions ---
    case "ADD_FREEFORM_ELEMENT":
      return {
        ...state,
        freeformElements: {
          ...state.freeformElements,
          [action.payload.page]: [
            ...(state.freeformElements[action.payload.page] || []),
            action.payload.element,
          ],
        },
      };
    case "UPDATE_FREEFORM_ELEMENT":
      return {
        ...state,
        freeformElements: {
          ...state.freeformElements,
          [action.payload.page]: (
            state.freeformElements[action.payload.page] || []
          ).map((el) =>
            el.id === action.payload.id
              ? { ...el, ...action.payload.updates }
              : el,
          ),
        },
      };
    case "DELETE_FREEFORM_ELEMENT":
      return {
        ...state,
        freeformElements: {
          ...state.freeformElements,
          [action.payload.page]: (
            state.freeformElements[action.payload.page] || []
          ).filter((el) => el.id !== action.payload.id),
        },
      };

    case "SET_OCR_RESULTS":
      return {
        ...state,
        ocrResults: {
          ...state.ocrResults,
          [action.payload.page]: action.payload.results,
        },
      };

       // --- Inline Edit Actions ---
    case "SET_EXTRACTED_TEXT_REGIONS":
      return {
        ...state,
        extractedTextRegions: { ...state.extractedTextRegions, [action.payload.page]: action.payload.regions },
      };
    case "SET_DETECTED_FONTS":
      return {
        ...state,
        detectedFonts: { ...state.detectedFonts, [action.payload.page]: action.payload.fonts },
      };
    case "SET_INLINE_EDITING_REGION":
      return { ...state, inlineEditingRegion: action.payload };
    case "UPDATE_TEXT_REGION": {
        const { page, id, updates } = action.payload; 
        return { ...state, extractedTextRegions: { ...state.extractedTextRegions, [page]: (state.extractedTextRegions[page] || []).map(region => region.id === id ? { ...region, ...updates } : region) } };
    }
    case "UPDATE_TOOL_SETTING":
      return {
        ...state,
        toolSettings: {
          ...state.toolSettings,
          [action.payload.toolId]: {
            ...state.toolSettings[action.payload.toolId],
            [action.payload.key]: action.payload.value,
          },
        },
      };
    case "SAVE_TO_HISTORY": {
      const snapshot: Partial<PDFEditorState> = {
        annotations: state.annotations,
        formFields: state.formFields,
        whiteoutBlocks: state.whiteoutBlocks,
        textElements: state.textElements,
        imageElements: state.imageElements,
        signatureElements: state.signatureElements,
        freeformElements: state.freeformElements,
        extractedTextRegions: state.extractedTextRegions,
      };
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(snapshot);
      return {
        ...state,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }
    case "UNDO": {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      const snapshot = state.history[newIndex];
      // Only restore editable content, preserve document state
      return { 
        ...state, 
        ...snapshot,
        // Preserve document-related state that shouldn't be undone
        pdfDocument: state.pdfDocument,
        originalPdfData: state.originalPdfData,
        totalPages: state.totalPages,
        fileName: state.fileName,
        historyIndex: newIndex 
      };
    }
    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      const snapshot = state.history[newIndex];
      // Only restore editable content, preserve document state
      return { 
        ...state, 
        ...snapshot,
        // Preserve document-related state that shouldn't be redone
        pdfDocument: state.pdfDocument,
        originalPdfData: state.originalPdfData,
        totalPages: state.totalPages,
        fileName: state.fileName,
        historyIndex: newIndex 
      };
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
  // T2.2: expose font analysis for UI triggers
  analyzeFonts: () => Promise<void>;
  
  // OCR Methods
  performOCR: (options?: {
    pages?: number[];
    language?: string;
    autoDetectLanguage?: boolean;
    confidenceThreshold?: number;
  }) => Promise<void>;
  
  cancelOCR: () => void;
  getOcrResultForPage: (page: number) => OCRResult[];
  updateOcrResult: (page: number, resultId: string, updates: Partial<OCRResult>) => void;
  deleteOcrResult: (page: number, resultId: string) => void;
  getAvailableOcrLanguages: () => Promise<OCRLanguage[]>;
  downloadOcrLanguage: (languageCode: string) => Promise<boolean>;
  getOcrSettings: () => OCRSettings;
  updateOcrSettings: (settings: Partial<OCRSettings>) => void;
  exportOcrResults: (format: 'text' | 'json' | 'hocr' | 'pdf' | 'tsv') => Promise<Blob | string>;
}

const PDFEditorContext = createContext<PDFEditorContextType | undefined>(
  undefined,
);

export function PDFEditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(pdfEditorReducer, initialState);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 👇 Create a ref to hold the active render task
  const renderTaskRef = useRef<RenderTask | null>(null);

  const loadPDF = useCallback(async (file: File) => {
    // 👈 Wrap with useCallback
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const doc = await getDocument({ data }).promise;
      dispatch({ type: "LOAD_SUCCESS", payload: { doc, file, data } });
    } catch (error) {
      console.error("Failed to load PDF:", error);
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []); // 👈 Empty dependency array means this function is created only once

  const renderPage = useCallback(
    async (pageNumber?: number) => {
      const pageToRender = pageNumber || state.currentPage;
      if (!state.pdfDocument || !canvasRef.current) return;

      // Cancel any existing render task before starting a new one
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const canvas = canvasRef.current;
        const page = await state.pdfDocument.getPage(pageToRender);
        const viewport = page.getViewport({
          scale: state.scale,
          rotation: state.rotation,
        });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const context = canvas.getContext("2d");

        if (context) {
          // Clear the canvas first
          context.clearRect(0, 0, canvas.width, canvas.height);
          
          // Render the PDF page
          const renderTask = page.render({ canvasContext: context, viewport });
          renderTaskRef.current = renderTask;

          await renderTask.promise;
          renderTaskRef.current = null; // Clear the ref on success
          
          // After rendering, we could add OCR results overlay here if needed
          // This would be called after the page is rendered
          await renderOcrOverlay(context, pageToRender, viewport);
        }
      } catch (error: RenderTask | unknown) {
        renderTaskRef.current = null; // Clear the ref on error
        // pdf.js throws a "RenderingCancelledException" which is expected, ignore it.
        if (
          typeof error === "object" &&
          error !== null &&
          "name" in error &&
          (error as { name: string }).name !== "RenderingCancelledException"
        ) {
          console.error("PDF rendering failed:", error);
        }
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [state.pdfDocument, state.currentPage, state.scale, state.rotation],
  );
  
  // Helper function to render OCR results overlay
  const renderOcrOverlay = async (
    context: CanvasRenderingContext2D, 
    pageNumber: number, 
    viewport: any
  ) => {
    if (!state.ocrResults[pageNumber]?.length) return;
    
    const results = state.ocrResults[pageNumber];
    const scale = state.scale;
    
    context.save();
    
    // Draw OCR results with semi-transparent background
    results.forEach(result => {
      if (!result.boundingBox) return;
      
      const x = result.boundingBox.x0 * scale;
      const y = result.boundingBox.y0 * scale;
      const width = (result.boundingBox.x1 - result.boundingBox.x0) * scale;
      const height = (result.boundingBox.y1 - result.boundingBox.y0) * scale;
      
      // Draw selection highlight if selected
      if (result.isSelected) {
        context.strokeStyle = '#4a90e2';
        context.lineWidth = 2;
        context.strokeRect(x, y, width, height);
      }
      
      // Draw confidence indicator
      if (result.confidence < (state.ocrConfidenceThreshold || 70)) {
        context.fillStyle = 'rgba(255, 0, 0, 0.1)';
        context.fillRect(x, y, width, height);
      }
    });
    
    context.restore();
  };

  const savePDF = useCallback(async () => {
    // 👈 Wrap with useCallback
    // ... (savePDF implementation remains the same)
    if (!state.originalPdfData) {
      alert("No PDF file loaded to save.");
      return;
    }
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const allAnnotations = Object.values(state.annotations).flat();
      const allTextElements = Object.values(state.textElements).flat();
      const allWhiteoutBlocks = Object.values(state.whiteoutBlocks).flat();
      // NOTE: Do not auto-inject whiteouts from inline editing regions here.
      // If inline edits require whiteouts, the UI/tool should create explicit whiteout blocks.
      
      const allImageElements = Object.values(state.imageElements).flat();
      const allFreeformElements = Object.values(state.freeformElements).flat();

      const savedPdfBytes = await savePdfWithAnnotations(
        state.originalPdfData,
        allTextElements,
        allAnnotations,
        allWhiteoutBlocks,
        allImageElements,
        allFreeformElements,
        (progress, status) => {
          // TODO: Add progress indicator UI component
          console.log(`Save progress: ${progress}% - ${status}`);
        }
      );
      const newFilename = state.fileName.replace(".pdf", "-edited.pdf");
      triggerDownload(savedPdfBytes, newFilename);
    } catch (error) {
      console.error("Failed to save PDF:", error);
      alert(
        "An error occurred while saving the PDF. See the console for details.",
      );
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [
    state.originalPdfData,
    state.annotations,
    state.textElements,
    state.whiteoutBlocks,
    state.fileName,
    state.imageElements,
    state.freeformElements, // include freeform to avoid stale drawings on save
  ]); // 👈 Dependencies for savePDF

  // T2.2: Analyze fonts across all pages and store results in state
  const analyzeFonts = useCallback(async () => {
    // reason: Provide a single entry-point to run font analysis on demand
    if (!state.pdfDocument) return;
    try {
      const results = await fontRecognitionService.analyzePDFFonts(state.pdfDocument);
      // Dispatch detected fonts per page without interfering with text extraction (T2.3)
      for (const r of results) {
        dispatch({ type: "SET_DETECTED_FONTS", payload: { page: r.page, fonts: r.fonts } });
      }
    } catch (err) {
      console.error("Font analysis failed", err);
    }
  }, [state.pdfDocument]);

  const performOCR = useCallback(async (options: {
    pages?: number[];
    language?: string;
    autoDetectLanguage?: boolean;
    confidenceThreshold?: number;
  } = {}) => {
    if (!state.pdfDocument) {
      console.error('No PDF document loaded');
      return;
    }

    const {
      pages = [state.currentPage],
      language = state.selectedOcrLanguage,
      autoDetectLanguage = state.toolSettings.ocr?.autoDetectLanguage ?? true,
      confidenceThreshold = state.ocrConfidenceThreshold
    } = options;

    dispatch({ type: 'SET_OCR_STATUS', payload: 'processing' });
    dispatch({ type: 'SET_OCR_PROGRESS', payload: 0 });
    
    try {
      // TODO: Implement actual OCR processing using Tesseract.js or another OCR service
      // This is a placeholder implementation
      for (let i = 0; i < pages.length; i++) {
        const pageNum = pages[i];
        const progress = Math.floor((i / pages.length) * 100);
        dispatch({ type: 'SET_OCR_PROGRESS', payload: progress });
        
        // Simulate OCR processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock OCR results - replace with actual OCR processing
        const mockResults: OCRResult[] = [
          {
            id: `ocr-${pageNum}-${i}`,
            text: 'Sample OCR Text',
            confidence: 95,
            boundingBox: { x0: 100, y0: 100, x1: 300, y1: 150 },
            page: pageNum,
            language,
            isSelected: false,
            lastModified: Date.now(),
            version: 1
          }
        ];
        
        dispatch({ 
          type: 'SET_OCR_RESULTS', 
          payload: { 
            page: pageNum, 
            results: mockResults 
          } 
        });
      }
      
      dispatch({ type: 'SET_OCR_STATUS', payload: 'completed' });
      dispatch({ type: 'SET_OCR_PROGRESS', payload: 100 });
      
      // Re-render the current page to show OCR results
      renderPage(state.currentPage);
      
    } catch (error) {
      console.error('OCR processing failed:', error);
      dispatch({ 
        type: 'SET_OCR_ERROR', 
        payload: error instanceof Error ? error.message : 'OCR processing failed' 
      });
    }
  }, [state.pdfDocument, state.currentPage, state.selectedOcrLanguage, state.ocrConfidenceThreshold, renderPage]);
  
  const cancelOCR = useCallback(() => {
    // TODO: Implement actual cancellation of OCR processing
    dispatch({ type: 'SET_OCR_STATUS', payload: 'idle' });
    dispatch({ type: 'SET_OCR_PROGRESS', payload: 0 });
  }, []);
  
  const getOcrResultForPage = useCallback((page: number): OCRResult[] => {
    return state.ocrResults[page] || [];
  }, [state.ocrResults]);
  
  const updateOcrResult = useCallback((page: number, resultId: string, updates: Partial<OCRResult>) => {
    const currentResults = state.ocrResults[page] || [];
    const updatedResults = currentResults.map(result => 
      result.id === resultId ? { ...result, ...updates, lastModified: Date.now() } : result
    );
    
    dispatch({ 
      type: 'SET_OCR_RESULTS', 
      payload: { page, results: updatedResults } 
    });
    
    // Re-render the page to reflect changes
    if (page === state.currentPage) {
      renderPage(page);
    }
  }, [state.ocrResults, state.currentPage, renderPage]);
  
  const deleteOcrResult = useCallback((page: number, resultId: string) => {
    const currentResults = state.ocrResults[page] || [];
    const updatedResults = currentResults.filter(result => result.id !== resultId);
    
    dispatch({ 
      type: 'SET_OCR_RESULTS', 
      payload: { page, results: updatedResults } 
    });
    
    // Re-render the page to reflect changes
    if (page === state.currentPage) {
      renderPage(page);
    }
  }, [state.ocrResults, state.currentPage, renderPage]);
  
  const getAvailableOcrLanguages = useCallback(async (): Promise<OCRLanguage[]> => {
    // TODO: Implement actual language detection from Tesseract.js
    // For now, return the current languages from state
    return state.ocrLanguages;
  }, [state.ocrLanguages]);
  
  const downloadOcrLanguage = useCallback(async (languageCode: string): Promise<boolean> => {
    // TODO: Implement actual language download for Tesseract.js
    // This is a placeholder implementation
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the language as downloaded
      const updatedLanguages = state.ocrLanguages.map(lang => 
        lang.code === languageCode ? { ...lang, isDownloaded: true, isEnabled: true } : lang
      );
      
      dispatch({ type: 'SET_OCR_LANGUAGES', payload: updatedLanguages });
      return true;
      
    } catch (error) {
      console.error('Failed to download OCR language:', error);
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.ocrLanguages]);
  
  const getOcrSettings = useCallback((): OCRSettings => {
    return {
      confidenceThreshold: state.ocrConfidenceThreshold,
      autoDetectLanguage: state.toolSettings.ocr?.autoDetectLanguage ?? true,
      preprocessImages: state.toolSettings.ocr?.preprocessImages ?? true,
      detectTables: state.toolSettings.ocr?.detectTables ?? true,
      preserveFormatting: state.toolSettings.ocr?.preserveFormatting ?? true,
      outputFormat: state.toolSettings.ocr?.outputFormat ?? 'text',
      dpi: state.toolSettings.ocr?.dpi ?? 300,
      preserveInterwordSpaces: state.toolSettings.ocr?.preserveInterwordSpaces ?? true,
      ocrEngineMode: state.toolSettings.ocr?.ocrEngineMode ?? 'default',
      pageSegMode: state.toolSettings.ocr?.pageSegMode ?? 'auto',
      whitelist: state.toolSettings.ocr?.whitelist ?? '',
      blacklist: state.toolSettings.ocr?.blacklist ?? '',
      scanMode: state.toolSettings.ocr?.scanMode ?? 'auto',
      selectedArea: state.toolSettings.ocr?.selectedArea ?? null,
      autoDetectTextRegions: state.toolSettings.ocr?.autoDetectTextRegions ?? true,
      mergeAdjacentText: state.toolSettings.ocr?.mergeAdjacentText ?? true,
      minTextConfidence: state.toolSettings.ocr?.minTextConfidence ?? 0,
      postProcessText: state.toolSettings.ocr?.postProcessText ?? true
    };
  }, [state.ocrConfidenceThreshold, state.toolSettings.ocr]);
  
  const updateOcrSettings = useCallback((settings: Partial<OCRSettings>) => {
    // Update confidence threshold if provided
    if (settings.confidenceThreshold !== undefined) {
      dispatch({ 
        type: 'SET_OCR_CONFIDENCE_THRESHOLD', 
        payload: settings.confidenceThreshold 
      });
    }
    
    // Update other OCR settings in tool settings
    const { confidenceThreshold, ...otherSettings } = settings;
    if (Object.keys(otherSettings).length > 0) {
      dispatch({
        type: 'UPDATE_TOOL_SETTING',
        payload: {
          toolId: 'ocr',
          key: Object.keys(otherSettings)[0] as keyof ToolSettings,
          value: Object.values(otherSettings)[0]
        }
      });
    }
  }, []);
  
  const exportOcrResults = useCallback(async (format: 'text' | 'json' | 'hocr' | 'pdf' | 'tsv' = 'text'): Promise<Blob | string> => {
    // TODO: Implement actual export functionality
    // This is a placeholder implementation
    const allResults = Object.values(state.ocrResults).flat();
    
    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(allResults, null, 2)], { type: 'application/json' });
      case 'hocr':
        // Generate hOCR XML
        const hocr = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
 <head>
  <title>OCR Results</title>
  <meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
  <meta name='ocr-system' content='PDF-4EVER' />
  <meta name='ocr-capabilities' content='ocr_page ocr_carea ocr_par ocr_line ocrx_word'/>
 </head>
 <body>
  <div class='ocr_page' title='bbox 0 0 1000 1000'>
   ${allResults.map(result => 
     `<span class='ocrx_word' title='bbox ${
       Math.round(result.boundingBox.x0)} ${
       Math.round(result.boundingBox.y0)} ${
       Math.round(result.boundingBox.x1)} ${
       Math.round(result.boundingBox.y1)}; x_wconf ${Math.round(result.confidence)}'>${
       result.text}</span>`
   ).join('\n   ')}
  </div>
 </body>
</html>`;
        return new Blob([hocr], { type: 'text/html' });
      case 'tsv':
        const tsv = 'Page\tX1\tY1\tX2\tY2\tText\tConfidence\n' +
          allResults.map(r => 
            `${r.page}\t${r.boundingBox.x0}\t${r.boundingBox.y0}\t${r.boundingBox.x1}\t${r.boundingBox.y1}\t${r.text}\t${r.confidence}`
          ).join('\n');
        return new Blob([tsv], { type: 'text/tab-separated-values' });
      case 'pdf':
        // This would require a PDF generation library
        return new Blob(['PDF export not yet implemented'], { type: 'application/pdf' });
      case 'text':
      default:
        return allResults.map(r => r.text).join('\n');
    }
  }, [state.ocrResults]);

  const contextValue = {
    state,
    dispatch,
    canvasRef,
    fileInputRef,
    loadPDF,
    renderPage,
    savePDF,
    analyzeFonts,
    // OCR Methods
    performOCR,
    cancelOCR,
    getOcrResultForPage,
    updateOcrResult,
    deleteOcrResult,
    getAvailableOcrLanguages,
    downloadOcrLanguage,
    getOcrSettings,
    updateOcrSettings,
    exportOcrResults,
  };
  return (
    <PDFEditorContext.Provider value={contextValue}>
      {children}
    </PDFEditorContext.Provider>
  );
}

export function usePDFEditor() {
  const context = useContext(PDFEditorContext);
  if (!context) {
    throw new Error("usePDFEditor must be used within a PDFEditorProvider");
  }
  return context;
}
