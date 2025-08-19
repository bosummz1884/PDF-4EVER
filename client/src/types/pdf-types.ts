import type { PDFDocumentProxy } from "pdfjs-dist";
import React, { ComponentType, ReactNode } from "react";

// =========================
// Core Editor & Tool Types
// =========================

export type ToolType =
  | "select"
  | "whiteout"
  | "text"
  | "highlight"
  | "rectangle"
  | "circle"
  | "freeform"
  | "form"
  | "signature"
  | "eraser"
  | "checkmark"
  | "x-mark"
  | "line"
  | "image"
  | "inlineEdit"
  | "ocr";

export interface PDFEditorState {
  pdfDocument: PDFDocumentProxy | null;
  originalPdfData: Uint8Array | null;
  currentPage: number;
  totalPages: number;
  scale: number;
  rotation: number;
  isLoading: boolean;
  isProcessingOCR: boolean;
  ocrProgress: number;
  ocrStatus: 'idle' | 'processing' | 'completed' | 'error';
  ocrError: string | null;
  fileName: string;
  annotations: { [page: number]: Annotation[] };
  textElements: { [page: number]: TextElement[] };
  formFields: { [page: number]: FormField[] };
  whiteoutBlocks: { [page: number]: WhiteoutBlock[] };
  ocrResults: { [page: number]: OCRResult[] };
  ocrLanguages: OCRLanguage[];
  selectedOcrLanguage: string;
  selectedElementId: string | null;
  selectedElementIds: string[];
  selectedElementType: "annotation" | "text" | "form" | "whiteout" | "image" | "textRegion" | "freeform" | "ocr" | null;
  currentTool: ToolType;
  toolSettings: Record<ToolType, ToolSettings>;
  history: Partial<PDFEditorState>[];
  historyIndex: number;
  canvasRef: React.RefObject<HTMLCanvasElement> | null;
  imageElements: { [page: number]: ImageElement[] };
  extractedTextRegions: { [page: number]: TextRegion[] };
  detectedFonts: { [page: number]: DetectedFont[] };
  ocrConfidenceThreshold: number;
  lastOcrTimestamp: number | null;
  fontMatchingEnabled: boolean;
  signatureElements: { [page: number]: SignatureElement[] };
  freeformElements: { [page: number]: FreeformElement[] }; 
  inlineEditingRegion: TextRegion | null;
}

export type PDFEditorAction =
  | {
      type: "LOAD_SUCCESS";
      payload: { doc: PDFDocumentProxy; file: File; data: Uint8Array };
    }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "SET_SCALE"; payload: number }
  | { type: "SET_ROTATION"; payload: number }
  | { type: "SET_CURRENT_TOOL"; payload: ToolType }
  | {
      type: "SET_SELECTED_ELEMENT";
      payload: {
        id: string | null;
        type: "annotation" | "text" | "form" | "whiteout" | "image" | "textRegion" | "freeform" | null;
      }; 
    }
  | {
      type: "SET_SELECTED_ELEMENTS";
      payload: {
        ids: string[];
        type: "annotation" | "text" | "form" | "whiteout" | "image" | "textRegion" | "freeform" | null;
      };
    }
  | {
      type: "ADD_TO_SELECTION";
      payload: {
        id: string;
        type: "annotation" | "text" | "form" | "whiteout" | "image" | "textRegion" | "freeform";
      };
    }
  | { type: "CLEAR_SELECTION" }
  | {
      type: "ADD_IMAGE_ELEMENT";
      payload: { page: number; element: ImageElement };
    }
  | {
      type: "UPDATE_IMAGE_ELEMENT";
      payload: { page: number; id: string; updates: Partial<ImageElement> };
    }
  | { type: "DELETE_IMAGE_ELEMENT"; payload: { page: number; id: string } }
  | {
      type: "ADD_TEXT_ELEMENT";
      payload: { page: number; element: TextElement };
    }
  | {
      type: "ADD_ANNOTATION";
      payload: { page: number; annotation: Annotation };
    }
  | {
      type: "UPDATE_ANNOTATION";
      payload: { page: number; id: string; updates: Partial<Annotation> };
    }
  | { type: "DELETE_ANNOTATION"; payload: { page: number; id: string } }
  | {
      type: "UPDATE_TEXT_ELEMENT";
      payload: { page: number; id: string; updates: Partial<TextElement> };
    }
  | { type: "DELETE_TEXT_ELEMENT"; payload: { page: number; id: string } }
  | {
      type: "ADD_WHITEOUT_BLOCK";
      payload: { page: number; block: WhiteoutBlock };
    }
  | {
      type: "UPDATE_WHITEOUT_BLOCK";
      payload: { page: number; id: string; updates: Partial<WhiteoutBlock> };
    }
  | { type: "DELETE_WHITEOUT_BLOCK"; payload: { page: number; id: string } }
  | { type: "ADD_FORM_FIELD"; payload: { page: number; field: FormField } }
  | {
      type: "UPDATE_FORM_FIELD";
      payload: { page: number; id: string; updates: Partial<FormField> };
    }
  | { type: "DELETE_FORM_FIELD"; payload: { page: number; id: string } }
  | {
      type: "ADD_FREEFORM_ELEMENT";
      payload: { page: number; element: FreeformElement };
    }
  | {
      type: "UPDATE_FREEFORM_ELEMENT";
      payload: { page: number; id: string; updates: Partial<FreeformElement> };
    }
  | { type: "DELETE_FREEFORM_ELEMENT"; payload: { page: number; id: string } }
  | { type: "SET_OCR_RESULTS"; payload: { page: number; results: OCRResult[] } }
  | { type: "SET_OCR_LANGUAGES"; payload: OCRLanguage[] }
  | { type: "SET_SELECTED_OCR_LANGUAGE"; payload: string }
  | { type: "SET_OCR_PROGRESS"; payload: number }
  | { type: "SET_OCR_STATUS"; payload: 'idle' | 'processing' | 'completed' | 'error' }
  | { type: "SET_OCR_ERROR"; payload: string | null }
  | { type: "SET_OCR_CONFIDENCE_THRESHOLD"; payload: number }
  | {
      type: "SET_EXTRACTED_TEXT_REGIONS";
      payload: { page: number; regions: TextRegion[] };
    }
  | {
      type: "SET_DETECTED_FONTS";
      payload: { page: number; fonts: DetectedFont[] };
    }
  | {
      type: "SET_FONT_MATCHING_ENABLED";
      payload: boolean;
    }
  | {
      type: "SET_INLINE_EDITING_REGION";
      payload: TextRegion | null;
    }
  | {
      type: "UPDATE_TEXT_REGION";
      payload: { page: number; id: string; updates: Partial<TextRegion> };
    }
  | {
      type: "UPDATE_TOOL_SETTING";
      payload: {
        toolId: ToolType;
        key: keyof ToolSettings;
        value: ToolSettings[keyof ToolSettings];
      };
    }
  | { type: "SAVE_TO_HISTORY" }
  | { type: "UNDO" }
  | { type: "REDO" };

// =========================
// Element & Annotation Types
// =========================

export interface Annotation {
  id: string;
  type: ToolType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
  strokeStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  points?: { x: number; y: number }[];
  content?: string;
  src?: string;
  opacity?: number;
  blendMode?: "multiply" | "overlay" | "screen" | "normal";
  rotation?: number;
  cornerRadius?: number;
}

export interface SignatureElement {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string; // Base64 Data URL of the signature image
}

export interface TextElement {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  textAlign: "left" | "center" | "right" | "justify";
  lineHeight: number;
  rotation: number;
}

export interface FormField {
  id: string;
  page: number;
  type:
    | "text"
    | "checkbox"
    | "radio"
    | "dropdown"
    | "signature"
    | "date"
    | "textarea";
  pdfFieldName?: string;
  value: string;
  x: number;
  y: number;
  width: number;
  height: number;
  options?: string[];
  required?: boolean;
  readonly?: boolean;
  placeholder?: string;
}

export interface WhiteoutBlock {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string; 
}

export interface ImageElement {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  rotation: number;
  opacity?: number;
  borderWidth?: number;
  borderColor?: string;
}

export interface FreeformElement {
  id: string;
  page: number;
  paths: Array<{
    points: Array<{ x: number; y: number }>;
    color: string;
    opacity: number;
    brushSize: number;
    smoothing: "none" | "low" | "medium" | "high";
  }>;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// =========================
// Inline Text Editing Types
// =========================

export interface TextFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  backgroundColor?: string;
}

export interface TextSpan {
  text: string;
  formatting: TextFormatting;
}

export interface TextRegion {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  richText?: TextSpan[]; // Rich text content with formatting
  fontName: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  color: string;
  rotation: number;
  isEditing: boolean;
  originalFontInfo?: DetectedFont;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
}

export interface DetectedFont {
  id: string;
  fontName: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  isSystemFont: boolean;
  fallbackFont?: string;
  instances: number;
  pages: number[];
  confidence: number;
}

export interface FontRecognitionResult {
  page: number;
  fonts: DetectedFont[];
  textRegions: TextRegion[];
  confidence: number;
}

// =========================
// Service & Utility Types
// =========================

export interface FontInfo {
  name: string;
  family: string;
  style: string;
  weight: string;
  loaded: boolean;
  variants?: string[];
}

export interface TableCell {
  id: string;
  text: string;
  rowIndex: number;
  colIndex: number;
  rowSpan: number;
  colSpan: number;
  boundingBox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  confidence: number;
}

export interface TableRow {
  id: string;
  cells: TableCell[];
  boundingBox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface Table {
  id: string;
  page: number;
  rows: TableRow[];
  boundingBox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  confidence: number;
}

export interface OCRResult {
  id: string;
  text: string;
  confidence: number;
  boundingBox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  page: number;
  isTable?: boolean;
  language?: string;
  isSelected?: boolean;
  lastModified?: number;
  version?: number;
}

export interface OCRLanguage {
  code: string;
  name: string;
  nativeName?: string;
  isEnabled?: boolean;
  isDownloaded?: boolean;
  downloadSize?: number;
}

export interface SignatureData {
  dataUrl: string;
  hash: string;
  timestamp?: number;
}

export interface SignaturePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  page: number;
}

// =========================
// Tooling & Settings Types
// =========================

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  page?: number;
  rotation?: number;
}

export interface OCRSettings {
  confidenceThreshold: number;
  autoDetectLanguage: boolean;
  preprocessImages: boolean;
  detectTables: boolean;
  preserveFormatting: boolean;
  outputFormat: 'text' | 'hocr' | 'pdf' | 'tsv';
  dpi: number;
  preserveInterwordSpaces: boolean;
  ocrEngineMode: 'legacy' | 'lstm' | 'default';
  pageSegMode: 'auto' | 'single_block' | 'single_line' | 'single_word' | 'single_char' | 'sparse_text' | 'sparse_text_osd';
  whitelist: string;
  blacklist: string;
  scanMode: 'full-page' | 'selected-area' | 'auto';
  selectedArea?: BoundingBox | null;
  autoDetectTextRegions: boolean;
  mergeAdjacentText: boolean;
  minTextConfidence: number;
  postProcessText: boolean;
}

export interface ToolSettings {
  // Select
  selectionMode?: "single" | "multiple" | "area";
  showBounds?: boolean;
  snapToGrid?: boolean;
  // Text & Signature
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textAlign?: "left" | "center" | "right" | "justify";
  lineHeight?: number;
  // Shape
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  strokeStyle?: "solid" | "dashed" | "dotted" | "double";
  cornerRadius?: number;
  // Highlight
  opacity?: number;
  highlightColor?: string;
  // Whiteout
  whiteoutMode?: "rectangle" | "freeform";
  whiteoutColor?: string;
  // Eraser
  size?: number;
  // Image
  width?: number;
  height?: number;
  rotation?: number;
  maintainAspectRatio?: boolean;
  borderColor?: string;
  borderWidth?: number;
  // Inline Edit
  autoFontMatch?: boolean;
  useFallbackFonts?: boolean;
  realTimePreview?: boolean;
  showFontWarnings?: boolean;
  // Form Fields
  fieldType?: string;
  label?: string;
  defaultValue?: string;
  groupName?: string;
  required?: boolean;
  readonly?: boolean;
  // form-specific extras
  placeholder?: string; // placeholder text for inputs
  options?: string[]; // options for dropdown/radio
  
  // OCR Settings
  confidenceThreshold?: number;
  autoDetectLanguage?: boolean;
  preprocessImages?: boolean;
  detectTables?: boolean;
  preserveFormatting?: boolean;
  outputFormat?: 'text' | 'hocr' | 'pdf' | 'tsv';
  dpi?: number;
  preserveInterwordSpaces?: boolean;
  ocrEngineMode?: 'legacy' | 'lstm' | 'default';
  pageSegMode?: 'auto' | 'single_block' | 'single_line' | 'single_word' | 'single_char' | 'sparse_text' | 'sparse_text_osd';
  whitelist?: string;
  blacklist?: string;
  scanMode?: 'full-page' | 'selected-area' | 'auto';
  selectedArea?: BoundingBox | null;
  autoDetectTextRegions?: boolean;
  mergeAdjacentText?: boolean;
  minTextConfidence?: number;
  postProcessText?: boolean;
}

// =========================
// Component Prop Types
// =========================

export interface EditorToolProps {
  settings: ToolSettings;
  onSettingChange: <K extends keyof ToolSettings>(
    key: K,
    value: ToolSettings[K]
  ) => void;
  editorState: PDFEditorState;
  compact?: boolean;
}

export interface EditorTool {
  name: ToolType;
  label: string;
  icon: ReactNode;
  component: ComponentType<EditorToolProps>;
  category: string;
  shortcut?: string;
  defaultSettings: ToolSettings;
  description: string;
}

export interface FontManagerProps {
  selectedFont: string;
  onFontChange: (font: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  fontWeight: "normal" | "bold";
  onFontWeightChange: (weight: "normal" | "bold") => void;
  fontStyle: "normal" | "italic";
  onFontStyleChange: (style: "normal" | "italic") => void;
  showAdvanced?: boolean;
  pdfDoc?: PDFDocumentProxy;
}

export interface OCRToolProps {
  pdfDocument?: PDFDocumentProxy | null;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  currentPage?: number;
  scale?: number;
  onTextDetected?: (results: OCRResult[]) => void;
  onTextExtracted?: (text: string) => void;
  onAreaSelected?: (area: BoundingBox) => void;
  onScanComplete?: (results: { text: string; results: OCRResult[] }) => void;
  onError?: (error: Error) => void;
  settings?: Partial<OCRSettings>;
  showAreaSelector?: boolean;
  enableMultiPageScan?: boolean;
  onPageChange?: (page: number) => void;
  onCancel?: () => void;
  onSave?: (results: OCRResult[]) => void;
}

export interface SignatureToolProps {
  onSigned: (result: SignatureData) => void;
  onPlace: (placement: SignaturePlacement) => void;
  onClose: () => void;
  currentPage: number;
}

export interface FormattingState extends TextFormatting {
  activeFormats: Set<keyof TextFormatting>;
  selection: {
    start: number;
    end: number;
    range: Range | null;
  };
  align?: 'left' | 'center' | 'right' | 'justify';
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  backgroundColor?: string;
}

export interface InlineTextEditorProps {
  textRegion: TextRegion;
  onSave: (text: string) => void;
  onCancel: () => void;
  scale: number;
  rotation: number;
}

export interface TextExtractionLayerProps {
  page: number;
  textRegions: TextRegion[];
  scale: number;
  rotation: number;
  onRegionClick: (region: TextRegion) => void;
  showRegions: boolean;
}

export interface FontRecognitionPanelProps {
  detectedFonts: DetectedFont[];
  isAnalyzing: boolean;
  analysisProgress: number;
  onFontMappingChange: (fontId: string, newFontFamily: string) => void;
  settings: {
    autoFontMatch: boolean;
    useFallbackFonts: boolean;
    realTimePreview?: boolean;
    showFontWarnings: boolean;
    
  };
  onSettingsChange: (settings: Partial<ToolSettings>) => void;
}
