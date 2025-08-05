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
  fileName: string;
  annotations: { [page: number]: Annotation[] };
  textElements: { [page: number]: TextElement[] };
  formFields: { [page: number]: FormField[] };
  whiteoutBlocks: { [page: number]: WhiteoutBlock[] };
  ocrResults: { [page: number]: OCRResult[] };
  selectedElementId: string | null;
  selectedElementType: "annotation" | "text" | "form" | "whiteout" | null;
  currentTool: ToolType;
  toolSettings: Record<ToolType, ToolSettings>;
  history: Partial<PDFEditorState>[];
  historyIndex: number;
  canvasRef: React.RefObject<HTMLCanvasElement> | null;
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
        type: "annotation" | "text" | "form" | "whiteout" | null;
      };
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
      type: "ADD_TEXT_ELEMENT";
      payload: { page: number; element: TextElement };
    }
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
  | { type: "SET_OCR_RESULTS"; payload: { page: number; results: OCRResult[] } }
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
}

export interface SignatureData {
  dataUrl: string;
  hash: string;
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
  style?: "solid" | "underline" | "strikethrough" | "squiggly";
  blendMode?: "multiply" | "overlay" | "screen" | "normal";
  // Freeform
  brushSize?: number;
  smoothing?: "none" | "low" | "medium" | "high";
  // Eraser
  size?: number;
  // Image
  width?: number;
  height?: number;
  rotation?: number;
  maintainAspectRatio?: boolean;
  borderColor?: string;
  borderWidth?: number;
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
  onTextDetected?: (results: OCRResult[]) => void;
  onTextBoxCreate?: (x: number, y: number, text: string) => void;
  onTextExtracted?: (text: string) => void;
}

export interface SignatureToolProps {
  onSigned: (result: SignatureData) => void;
  onPlace: (placement: SignaturePlacement) => void;
  onClose: () => void;
  currentPage: number;
}
