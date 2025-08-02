import type { PDFDocumentProxy } from 'pdfjs-dist'
// PDF File Types
// =======================


export interface PDFFile {
  id: string;
  name: string;
  size: number;
  data: ArrayBuffer;
  pageCount?: number;
  preview?: string;
}

export interface PDFEditorState {
  // Core PDF state
  pdfDocument: PDFDocumentProxy  |  null;
  originalFileData: Uint8Array | null;
  currentPage: number;
  totalPages: number;
  scale: number;
  rotation: number;
  isLoading: boolean;
  isRendering: boolean;
  fileName: string;
  renderingError: string | null;
}

// =======================
// PDF Merge/Split Options
// =======================

export interface PDFMergeOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
}

export interface PDFSplitOptions {
  outputFormat?: "separate" | "range";
  pageRanges?: Array<{ start: number; end: number }>;
  prefix?: string;
}

// =======================
// Split Range
// =======================

export interface SplitRange {
  id: string;
  start: number;
  end: number;
  name: string;
}

// =======================
// Font Types
// =======================

export interface FontInfo {
  name: string;
  family: string;
  style: string;
  weight: string;
  size?: number;
  variants?: string[];
  loaded: boolean;
 
}

// src/types/FontInfo.ts
export const DEFAULT_FONT_INFO: FontInfo = {
  name: 'Arial',
  family: 'Arial, Helvetica, sans-serif',
  style: 'normal',
  weight: "400",
  loaded: true,
  size: 12,
  variants: ["normal", "bold", "italic", "bolditalic"],
};


// =======================
// Text/Annotation Types
// =======================

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
}

export interface AnnotationElement {
  id?: string;
  type:
    | "highlight"
    | "rectangle"
    | "circle"
    | "freeform"
    | "signature"
    | "line";
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string | { r: number; g: number; b: number };
  page: number;
  strokeWidth: number;
  points: number[];
}

export interface Annotation {
  id: string;
  type: AnnotationToolName;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth?: number;
  content?: string;
  points?: { x: number; y: number }[];
  rotation?: number;
  opacity?: number;
}

export interface AnnotationManagerProps {
  annotations: Annotation[];
  textBoxes: TextBox[];
  whiteoutBlocks: WhiteoutBlock[];
  selectedId: string;
  textElements: { [page: number]: TextElement[] }; 
  onSelectAnnotation: (id: string | null) => void;
  onDeleteAnnotation: (id: string) => void;
  onSelectTextBox: (id: string | null) => void;
  onDeleteTextBox: (id: string) => void;
  onSelectWhiteoutBlock: (id: string | null) => void;
  onDeleteWhiteoutBlock: (id: string) => void;
  pdfDocument: PDFDocumentProxy  |  null;
  currentPage: number;
  totalPages: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  zoom: number;
  onAnnotationsChange?: (annotations: Annotation[]) => void;
  showControls?: boolean;
}

// Add missing types that might be referenced
export interface TextBox {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize: number;
  fontFamily?: string;
  color: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
}


export type ToolState =
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
// Textbox
export interface TextBox {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value?: string; // Content-editable
  text?: string; // Text content
  font: string;
  fontFamily?: string; // Redundant but common
  size: number; // Alias for fontSize
  fontSize: number; // Alias for size
  color: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  align?: "left" | "center" | "right";
  rotation?: number;
  opacity?: number;
  strikeThrough?: boolean;
}

// Text Element
export interface TextElement {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  value?: string;            // For contentEditable compatibility, optional
  fontSize: number;
  size: number;             // Alias for fontSize, optional
  fontFamily: string;
  font?: string;             // Alias for fontFamily, optional
  color: string;
  fontWeight: "normal" | "bold";
  bold?: boolean;            // Convenience, optional
  fontStyle: "normal" | "italic";
  italic?: boolean;          // Convenience, optional
  underline?: boolean;
  textAlign?: "left" | "center" | "right";
  rotation?: number;
  opacity?: number;
}

// =======================
// Annotation Types
// =======================

export type AnnotationToolName =
  | "select"
  | "highlight"
  | "rectangle"
  | "circle"
  | "freeform"
  | "signature"
  | "text"
  | "checkmark"
  | "x-mark"
  | "line"
  | "image"
  | "pen"
  | "arrow"
  | "eraser";

export interface Annotation {
  id: string;
  type: AnnotationToolName;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth?: number;
  content?: string;
  points?: { x: number; y: number }[];
  rotation?: number;
  opacity?: number;
}

// Base type for all annotation shapes (with optional subtypes)

// **Optional**: specialized annotation element (for legacy/manager)
export interface AnnotationElement {
  id?: string;
  type: "highlight" | "rectangle" | "circle" | "freeform" | "signature" | "line";
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string | { r: number; g: number; b: number };
  page: number;
  strokeWidth: number;
  points: number[];
}

// =======================
// Form Field Types
// =======================

export interface FormField {
  id: string;
  name?: string;
  fieldName?: string;   // PDF internal field name
  type?: "text" | "checkbox" | "radio" | "dropdown" | "signature";
  fieldType?: string;   // PDF internal field type
  value: string | boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  rect: { x: number; y: number; width: number; height: number };
  options?: string[];
  radioGroup?: string;
  required?: boolean;
  readonly?: boolean;
  placeholder?: string;
}

// =======================
// Invoice Types
// =======================

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  from: {
    name: string;
    address: string[];
    email?: string;
    phone?: string;
  };
  to: {
    name: string;
    address: string[];
    email?: string;
    phone?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  tax?: {
    rate: number;
    amount: number;
  };
  total: number;
  notes?: string;
  paymentTerms?: string;
}

// =======================
// OCR Types
// =======================

export interface OCRResult {
  id: string;
  text: string;
  confidence: number;
  boundingBox: {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
  };
  page: number;
}

export interface OCRToolProps {
  pdfDocument?: PDFDocumentProxy  |  null;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  currentPage?: number;
  onTextDetected?: (results: OCRResult[]) => void;
  onTextBoxCreate?: (x: number, y: number, text: string) => void;
  onTextExtracted?: (text: string) => void;
  isProcessing: boolean;
}

export interface OCRLanguage {
  code: string;
  name: string;
}

// =======================
// Signature Types
// =======================

export interface SignatureData {
  dataUrl: string;
  hash?: string;
}

export interface SignatureToolProps {
  signatureName: string;
  setSignatureName: (name: string) => void;
  signatureFont: string;
  setSignatureFont: (font: string) => void;
  showSignatureDialog: boolean;
  setShowSignatureDialog: (open: boolean) => void;
  onSave?: (dataUrl: string) => void;
  onComplete?: (dataUrl: string) => void;
  onSigned?: (result: SignatureData) => void;
  onClose?: () => void;
  onPlace?: (placement: SignaturePlacement) => void;
  onPlaceSignature: (placement: SignaturePlacement) => void;
  currentPage: number;
  annotationColor: string;
  onNameChange: (name: string) => void;
  onFontChange: (font: string) => void;
}

export interface SignaturePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  page?: number;
}

export interface SignaturePadProps {
  onSave?: (dataUrl: string) => void;
  onComplete?: (dataUrl: string) => void;
  onSigned?: (result: SignatureData) => void;
  onClose?: () => void;
  showCancel?: boolean;
  width: number;
  height: number;
}

// =======================
// Miscellaneous Types
// =======================

export interface UsePDFOperationsOptions {
  onFileLoaded?: (file: PDFFile) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export interface PDFToolkitProps {
  onFileProcessed?: (file: PDFFile) => void;
  currentFile?: PDFFile;
}

// Font manager
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
}

// Annotation manager (UI)
export interface AnnotationManagerProps {
  annotations: Annotation[];
  textBoxes: TextBox[];
  whiteoutBlocks: WhiteoutBlock[];
  selectedId: string;
  textElements: { [page: number]: TextElement[] }; 
  onSelectAnnotation: (id: string | null) => void;
  onDeleteAnnotation: (id: string) => void;
  onSelectTextBox: (id: string | null) => void;
  onDeleteTextBox: (id: string) => void;
  onSelectWhiteoutBlock: (id: string | null) => void;
  onDeleteWhiteoutBlock: (id: string) => void;
  pdfDocument: PDFDocumentProxy  |  null;  
  currentPage: number;
  totalPages: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  zoom: number;
  onAnnotationsChange?: (annotations: Annotation[]) => void;
  showControls?: boolean;
}

// =======================
// UI Dialog & Component Types
// =======================
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isVerified: boolean;
  profileImageUrl: string | null;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (user: User, token: string) => void;
  onSwitchToSignup: () => void;
}

export interface SignupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (user: User, token: string) => void;
}

export interface EditHistoryAction {
  type: "add" | "remove" | "update";
  annotationId: string;
  previousValue?: Annotation;
  newValue?: Annotation;
  timestamp: number;
}

export interface AnnotationTool {
  // Basic CRUD
  addAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (id: string) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  getAnnotation: (id: string) => Annotation | undefined;
  getAnnotations: (page?: number) => Annotation[];
  clearAnnotations: () => void;

  // Selection tools
  selectAnnotation: (id: string) => void;
  deselectAnnotation: () => void;
  getSelectedAnnotation: () => Annotation | undefined;

  // Bulk actions
  importAnnotations: (annotations: Annotation[]) => void;
  exportAnnotations: () => Annotation[];

  // Undo/Redo & Edit History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getEditHistory: () => EditHistoryAction[];
  clearEditHistory: () => void;

  // Utility
  moveAnnotation: (id: string, x: number, y: number) => void;
  resizeAnnotation: (id: string, width: number, height: number) => void;
  duplicateAnnotation: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
}

// General rectangle/region for any bounding area
export interface Region {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// For OCR region extraction
export interface OCRRegion extends Region {
  confidence?: number;
  text?: string;
}

// For highlight
export interface HighlightRegion extends Region {
  color: string;
  opacity: number;
}

// For freehand and signature strokes
export interface Stroke {
  page: number;
  points: number[];
  color: string;
  thickness: number;
}

// Bullet list types for textboxes
export type BulletType = "circle" | "triangle" | "square";
export type BulletFill = "filled" | "hollow";


  export type WhiteoutBlock = {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    page: number;
  };

  
 
  export type WhiteoutLayerProps = {
    whiteoutBlocks: WhiteoutBlock[];
    setWhiteoutBlocks: React.Dispatch<React.SetStateAction<WhiteoutBlock[]>>;
    selectedBlockId: string | null;
    onSelect: (id: string) => void;
    onUpdate: (id: string, updates: Partial<WhiteoutBlock>) => void;
    onRemove: (id: string) => void;
    onAdd: (block: Omit<WhiteoutBlock, 'id'>) => void;
    isActive: boolean;
    currentPage: number;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    scale: number;
    page: number;
    onBlocksChange?: (blocks: WhiteoutBlock[]) => void;
  };

  export interface EraserBlock {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
    color?: string;
  }
  
  export interface EraserLayerProps {
    isActive: boolean;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    scale: number;
    eraserBlocks: EraserBlock[];
    currentPage: number;
    eraserPosition: {
    x: number;
    y: number;  
  }};

  export type FieldEntry = {
    id: string;
    fieldName: string;
    fieldType: string;
    rect: number[];
    value: string;
    options?: string[];
    radioGroup?: string;
    page: number;
    required?: boolean;
  };
  
  export interface FillablePDFViewerProps {
    file: File | null;
    pdfDocument?: PDFDocumentProxy  |  null;
    currentPage?: number;
    onFieldsDetected: (fields: FormField[]) => void;
    onSave: (fields: FormField[]) => void;
    className?: string;
    detectedFormFields: FormField[];
  }

  export type OCRWord = {
    id: string;
    text: string;
    confidence: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    page: number;
  }
  
  export interface OCRProcessorProps {
    pdfDocument?: PDFDocumentProxy  |  null;
    selectedBlockId: string | null;
    ocrResults: OCRResult[];
    onSelect: (id: string) => void;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    currentPage: number;
    onExtract?: (area: {x: number, y: number, width: number, height: number}) => void;
    onEdit?: (id: string) => void;
    onTextDetected?: (results: OCRWord[]) => void;
    onTextBoxCreate?: (x: number, y: number, text: string) => void;
  }

  export interface TextBoxManagerProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    currentPage: number;
    zoom: number;
    onTextBoxesChange?: (textBoxes: TextBox[]) => void;
    onExport?: (pdfBytes: Uint8Array) => void;
    showControls?: boolean;
    originalPdfData?: Uint8Array;
  }

  export type TextLayerProps = {
    isActive: boolean;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    scale?: number;
    onTextElementsChange?: (elements: TextElement[]) => void;
  };


  
  export interface ComprehensivePDFEditorProps {
    className?: string;
  }
  