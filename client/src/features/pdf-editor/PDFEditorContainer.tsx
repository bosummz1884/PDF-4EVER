import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AnnotationManager from "@/components/managers/AnnotationManager";
import { TextBoxManager } from "@/components/managers/TextBoxManager";
import FontManager from "@/components/managers/FontManager";
import WhiteoutLayer from "@/features/components/layers/WhiteoutLayer";
import FillableFormLayer from "@layers/FillableFormLayer";
import AdvancedTextLayer from "@layers/AdvancedTextLayer";
import OCRLayer from "@/features/components/layers/OCRLayer";
import EraserLayer from "@/features/components/layers/EraserLayer";
import { FormField, Annotation, WhiteoutBlock, TextBox, OCRResult, FontInfo, DEFAULT_FONT_INFO } from "../../types/pdf-types";
import PDFToolbar from "../../features/components/PDFToolbar";
import PDFSidebar from "../../features/components/PDFSidebar";
import SignatureTool from "../../features/components/tools/SignatureTool";
import  ImageTool from "../../features/components/tools/ImageTool";
import OCRTool from "../../features/components/tools/OCRTool";
import { pdfjsLib } from "@/lib/pdfWorker";
import { usePDFFonts } from "../../features/hooks/usePDFFonts";

// ---- Props Interface ----
interface PDFEditorContainerProps { 
  user?: any;
  isMobile?: boolean;
  className?: string;
}

export default function PDFEditorContainer({
  user,
  isMobile,
  className,
}: PDFEditorContainerProps) {
  const [originalFileData, setOriginalFileData] = useState<Uint8Array | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [renderingError, setRenderingError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  // ---- Cursor helper ----
  const getCursorForTool = (tool: string): string => {
    switch (tool) {
      case "eraser":
        return "crosshair";
      case "highlight":
      case "rectangle":
      case "circle":
      case "freeform":
      case "signature":
      case "text":
      case "checkmark":
      case "x-mark":
      case "line":
        return "crosshair";
      default:
        return "default";
    }
  };

  // ---- TOOL/MODE SELECTION ----
  const [currentTool, setCurrentTool] = useState<
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
    | "ocr"
  >("select");
  const [activeMode, setActiveMode] = useState<"edit" | "merge" | "split" | "forms" | "fill">("edit");

  // ---- ANNOTATIONS ----
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [annotationColor, setAnnotationColor] = useState("#FFFF00");
  const [strokeWidth, setStrokeWidth] = useState(2);

  // ---- WHITEOUT ----
  const [whiteoutMode, setWhiteoutMode] = useState(false);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [whiteoutBlocks, setWhiteoutBlocks] = useState<WhiteoutBlock[]>([]);
  const [textElements, setTextElements] = useState<{ [page: number]: any[] }>({});
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);
  const [selectedWhiteoutBlockId, setSelectedWhiteoutBlockId] = useState<string | null>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(100);
  const [showControls, setShowControls] = useState<boolean>(true);
  
  // ---- TEXT BOXES & ADVANCED TEXT LAYER ----
  const [nextId, setNextId] = useState<number>(1);
  const [showTextBoxManager, setShowTextBoxManager] = useState(false);
  const [textLayerElements, setTextLayerElements] = useState<any[]>([]);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [detectedFormFields, setDetectedFormFields] = useState<any[]>([]);
  const [selectedBoxIds, setSelectedBoxIds] = useState<Set<string>>(new Set());

  // ---- FONT MANAGEMENT ----
  const [availableFontList, setAvailableFontList] = useState<FontInfo[]>([
    { name: "Arial", family: "Arial, sans-serif", loaded: true, style: "normal", weight: "normal" },
    { name: "Times New Roman", family: "'Times New Roman', serif", loaded: true, style: "normal", weight: "normal" },
    { name: "Courier New", family: "'Courier New', monospace", loaded: true, style: "normal", weight: "normal" }
  ]);
  const [selectedFont, setSelectedFont] = useState<FontInfo>(DEFAULT_FONT_INFO);
  const [loadingFonts, setLoadingFonts] = useState(false);
  const [embeddedFonts, setEmbeddedFonts] = useState<any>({});

  const onFontChange = (font: FontInfo | string) => {
    if (typeof font === "string") {
      const match = availableFontList.find(f => f.name === font);
      setSelectedFont(match || DEFAULT_FONT_INFO);
    } else {
      setSelectedFont(font);
    }
  };
  

  const [fontSize, setFontSize] = useState(14);
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("normal");
  const [fontStyle, setFontStyle] = useState<"normal" | "italic">("normal");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // ---- SIGNATURES ----
  const [signatureName, setSignatureName] = useState("");
  const [signatureFont, setSignatureFont] = useState("Dancing Script");
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);

  // ---- FORMS / FILLABLE FORMS ----
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [fieldValues, setFieldValues] = useState<{ [key: string]: string }>({});
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [focusedFieldId, setFocusedFieldId] = useState<string | null>(null);

  // ---- OCR ----
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [ocrBlocks, setOcrBlocks] = useState<any[]>([]);

  // ---- IMAGE & IMAGE TOOL ----
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>("");

  // ---- ERASER ----
  const [eraserPosition, setEraserPosition] = useState({ x: 0, y: 0 });
  const [eraserSize, setEraserSize] = useState(20);
  const [isErasing, setIsErasing] = useState(false);
  

  // ---- LINE TOOL ----
  const [lineStrokeWidth, setLineStrokeWidth] = useState(2);
  const [showLineDropdown, setShowLineDropdown] = useState(false);
  const [lineColor, setLineColor] = useState("#000000");
  const [currentDrawStart, setCurrentDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  // ---- UI/TOOL CONTROL ----
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [showHighlightDropdown, setShowHighlightDropdown] = useState(false);
  const [highlightColor, setHighlightColor] = useState("#FFFF00");
  const [selectedShape, setSelectedShape] = useState<"rectangle" | "circle" | "checkmark" | "x-mark">("rectangle");

  // ---- PAGE/MERGE/SPLIT ----
  const [mergeFiles, setMergeFiles] = useState<any[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  // ---- HISTORY (UNDO/REDO) ----
  const [history, setHistory] = useState<any[]>([
    {
      annotations: [],
      textElements: {},
      formFields: [],
      textBoxes: [],
      whiteoutBlocks: [],
      textLayerElements: [],
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isUndoRedoInProgress, setIsUndoRedoInProgress] = useState(false);

  // ---- NEW FIELD TYPE for FormTool ----
  const [newFieldType, setNewFieldType] = useState<string>("");

  // ---- REFS ----
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeFileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ---- EFFECTS ----
  const previousStateRef = useRef<string>("");

  // Save state to history
  useEffect(() => {
    if (isUndoRedoInProgress) return;
    const currentState = JSON.stringify({
      annotations,
      textElements,
      formFields,
      textBoxes,
      whiteoutBlocks,
      textLayerElements,
    });
    if (
      currentState !== previousStateRef.current &&
      (
        annotations.length > 0 ||
        Object.keys(textElements).length > 0 ||
        formFields.length > 0 ||
        textBoxes.length > 0 ||
        whiteoutBlocks.length > 0 ||
        textLayerElements.length > 0
      )
    ) {
      previousStateRef.current = currentState;
      const state = {
        annotations: [...annotations],
        textElements: { ...textElements },
        formFields: [...formFields],
        textBoxes: [...textBoxes],
        whiteoutBlocks: [...whiteoutBlocks],
        textLayerElements: [...textLayerElements],
      };
      setHistory(prev => {
        const newHistory = [...prev, state];
        return newHistory.slice(-50);
      });
      setHistoryIndex(prev => Math.min(prev + 1, 49));
    }
  }, [
    annotations,
    textElements,
    formFields,
    textBoxes,
    whiteoutBlocks,
    textLayerElements,
    isUndoRedoInProgress,
  ]);

  // Render page when PDF or page changes
  useEffect(() => {
    if (pdfDocument && currentPage) {
      renderPage(pdfDocument, currentPage);
    }
  }, [pdfDocument, currentPage, zoom, rotation]);

  // Clear rendering error when file changes
  useEffect(() => {
    if (originalFileData) setRenderingError(null);
  }, [originalFileData]);

  // ---- CORE FUNCTIONS ----
  const renderPage = async (pdf: any, pageNumber: number) => {
    if (!canvasRef.current) return;
    try {
      setIsLoading(true);
      const page = await pdf.getPage(pageNumber);
      const scale = zoom / 100;
      const viewport = page.getViewport({ scale, rotation });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      await page.render({ canvasContext: context, viewport }).promise;
      setRenderingError(null);
    } catch (error) {
      console.error("Error rendering page:", error);
      setRenderingError(`Failed to render page ${pageNumber}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load PDF from file
  const loadPDF = async (file: File) => {
    try {
      setIsLoading(true);
      setFileName(file.name);
      
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      setOriginalFileData(uint8Array);
      
      const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      
      await renderPage(pdf, 1);
    } catch (error) {
      console.error("Error loading PDF:", error);
      setRenderingError("Failed to load PDF file");
    } finally {
      setIsLoading(false);
    }
  };


  // ---- SELECTION HANDLERS ----
  const handleSelect = (id: string) => {
    setSelectedBoxIds(new Set([id]));
  };

  const handleMultiSelect = (id: string) => {
    setSelectedBoxIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

 // Add a new text box, auto-select it
  const handleAddTextBox = () => {
    const newId = nextId.toString();
    const newTextBox: TextBox = {
      id: newId,
      text: `Text Box ${newId}`
      , x: 200,
      y: 200,
      width: 150,
      height: 50,
      fontSize: 16,
      fontStyle: "normal",
      fontWeight: "normal",
      page: currentPage,
      font: "Arial",
      size: 16,
      color: "#000000",     
    };
    setTextBoxes(prev => [...prev, newTextBox]);
    setSelectedBoxIds(new Set([newId])); // Auto-select the new box
    setNextId(prev => prev + 1);
  };

  // Remove all selected text boxes
  const handleRemoveTextBox = () => {
    setTextBoxes(prev => prev.filter(box => !selectedBoxIds.has(box.id)));
    setSelectedBoxIds(new Set());
  };
  

  const handleClearSelection = () => {
    setSelectedBoxIds(new Set());
    setSelectedAnnotationId(null);
    setSelectedTextBoxId(null);
    setSelectedWhiteoutBlockId(null);
    setSelectedFieldId(null);
  };

  // ---- TEXT BOX HANDLERS ----
  const handleUpdate = (id: string, updates: Partial<TextBox>) => {
    setTextBoxes(prev =>
      prev.map(box =>
        box.id === id ? { ...box, ...updates } : box
      )
    );
  };

  const handleRemove = (id: string) => {
    setTextBoxes(prev => prev.filter(box => box.id !== id));
    setSelectedBoxIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleAdd = (box: Omit<TextBox, "id">) => {
    const id = `textbox_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newBox: TextBox = { ...box, id };
    setTextBoxes(prev => [...prev, newBox]);
  };

  // ---- MOUSE EVENT HANDLERS ----
  const getCanvasCoordinates = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(event);
    
    switch (currentTool) {
      case "text":
        const newTextBox: Omit<TextBox, "id"> = {
          x: coords.x,
          y: coords.y,
          width: 200,
          height: 30,
          text: "New Text",
          fontSize,
          fontFamily: selectedFont.family,
          color: "#000000",
          page: currentPage,
          rotation: 0,
          opacity: 1,
          bold: fontWeight === "bold",
          italic: fontStyle === "italic",
          underline: false,
          strikeThrough: false,
          size: 16,
          font: selectedFont.family
        };
        handleAdd(newTextBox);
        break;
        
      case "signature":
        if (signatureName) {
          handlePlaceSignature({
            x: coords.x,
            y: coords.y,
            text: signatureName,
            font: signatureFont
          });
        }
        break;
        
      case "form":
        if (newFieldType) {
          const newField: FormField = {
            id: `field_${Date.now()}`,
            type: newFieldType as any,
            x: coords.x,
            y: coords.y,
            width: 100,
            height: 30,
            page: currentPage,
            value: "",
            placeholder: `New ${newFieldType} field`,
            required: false,
            rect: {
              x: coords.x,
              y: coords.y,
              width: 100,
              height: 30,
            },
            options: newFieldType === "select" ? ["Option 1", "Option 2"] : undefined
          };
          handleFormFieldAdd(newField);
        }
        break;
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(event);
    
    if (currentTool === "line") {
      setCurrentDrawStart(coords);
      setIsDrawingLine(true);
    } else if (currentTool === "eraser") {
      setIsErasing(true);
      setEraserPosition(coords);
      handleErase(coords.x, coords.y, eraserSize);

    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(event);
    setMousePosition(coords);
    
    if (currentTool === "eraser" && isErasing) {
      setEraserPosition(coords);
      handleErase(coords.x, coords.y, eraserSize);
    }
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(event);
    
    if (currentTool === "line" && isDrawingLine && currentDrawStart) {
      const newAnnotation: Annotation = {
        id: `line_${Date.now()}`,
        type: "line",
        x: currentDrawStart.x,
        y: currentDrawStart.y,
        width: coords.x - currentDrawStart.x,
        height: coords.y - currentDrawStart.y,
        page: currentPage,
        color: lineColor,
        strokeWidth: lineStrokeWidth,
        opacity: 1,
        points: [currentDrawStart.x, currentDrawStart.y, coords.x, coords.y],
        fontSize: 16, 
      };
      handleAnnotationAdd(newAnnotation);
      setIsDrawingLine(false);
      setCurrentDrawStart(null);
    } else if (currentTool === "eraser") {
      setIsErasing(false);
    }
  };

  // ---- TOOL-SPECIFIC HANDLERS ----
  const handleTextBoxUpdate = (id: string, updates: Partial<TextBox>) => {
    setTextBoxes(prev =>
      prev.map(tb => tb.id === id ? { ...tb, ...updates } : tb)
    );
  };
  

  const handleErase = (x: number, y: number, size: number) => {
    // Remove annotations within eraser radius
    setAnnotations(prev => prev.filter(annotation => {
      if (annotation.page !== currentPage) return true;
      const distance = Math.sqrt(
        Math.pow(annotation.x - x, 2) + Math.pow(annotation.y - y, 2)
      );
      return distance > size;
    }));
  
    // Remove text boxes within eraser radius
    setTextBoxes(prev => prev.filter(textBox => {
      if (textBox.page !== currentPage) return true;
      const distance = Math.sqrt(
        Math.pow(textBox.x - x, 2) + Math.pow(textBox.y - y, 2)
      );
      return distance > size;
    }));
  };
  

  const handleOCRTextExtract = async (coords: { x: number; y: number, width: number, height: number }) => {
    if (!pdfDocument) return;
    
    try {
      setIsProcessingOcr(true);
      // This would integrate with an OCR service
      // For now, we'll create a placeholder result
      const newOCRResult: OCRResult = {
        id: `ocr_${Date.now()}`,
        text: "Extracted text from OCR",
        confidence: 0.95,
        boundingBox: coords,
        page: currentPage
      };
      setOcrResults(prev => [...prev, newOCRResult]);
    } catch (error) {
      console.error("OCR extraction failed:", error);
    } finally {
      setIsProcessingOcr(false);
    }
  };

  // ---- FORM HANDLERS ----
  const handleFormDataSave = (fields: FormField[]) => {
    const values = fields.reduce((acc, field) => {
      acc[field.id] = String(field.value ?? "");
      return acc;
    }, {} as { [key: string]: string });
    setFieldValues(values);
    console.log("Form data saved:", values);
  };
  
  const handleFormFieldsDetected = (fields: FormField[]) => {
    setFormFields(fields);
    setDetectedFormFields(fields);
  };

  // ---- SIGNATURE HANDLERS ----
  const handlePlaceSignature = (signature: { x: number; y: number; text: string; font: string }) => {
    const newTextBox: Omit<TextBox, "id"> = {
      x: signature.x,
      y: signature.y,
      width: 200,
      height: 50,
      text: signature.text,
      fontSize: 24,
      fontFamily: signature.font,
      color: "#000000",
      page: currentPage,
      rotation: 0,
      bold: false,
      italic: true,
      underline: false,
      font: signature.font,
      size: 16,

    };
    handleAdd(newTextBox);
    setShowSignatureDialog(false);
  };

  // ---- IMAGE HANDLERS ----
  const handleImagePlace = (image: { x: number; y: number; width: number; height: number; src: string; name: string }) => {
    // For now, we'll add it as a special annotation
    const newAnnotation: Annotation = {
      id: `image_${Date.now()}`,
      type: "image" as any,
      x: image.x,
      y: image.y,
      width: image.width,
      height: image.height,
      page: currentPage,
      color: "#000000",
      strokeWidth: 0,
      opacity: 1,
      imageData: image.src,
      points: [],
      fontSize: 16,
    };
    handleAnnotationAdd(newAnnotation);
  };

  // ---- OCR HANDLERS ----
  const handleOCRExtract = async (area: { x: number; y: number; width: number; height: number }) => {
    await handleOCRTextExtract(area);
  };

  const handleOCRResultEdit = (id: string, newText: string) => {
    setOcrResults(prev => prev.map(result => 
      result.id === id ? { ...result, text: newText } : result
    ));
  };

  // ---- ANNOTATION HANDLERS ----
  const handleAnnotationAdd = (annotation: Annotation) => {
    setAnnotations(prev => [...prev, annotation]);
  };

  const handleAnnotationUpdate = (id: string, updates: Partial<Annotation>) => {
    setAnnotations(prev => prev.map(ann => 
      ann.id === id ? { ...ann, ...updates } : ann
    ));
  };

  const handleAnnotationDelete = (id: string | null) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== id));
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
    }
  };

  const handleAnnotationSelect = (id: string | null) => {
    setSelectedAnnotationId(id);
    handleClearSelection();
  };
  
  // ---- WHITEOUT HANDLERS ----

  const handleWhiteoutDelete = (id: string | null) => {
    setWhiteoutBlocks(prev => prev.filter(block => block.id !== id));
    if (selectedWhiteoutBlockId === id) {
      setSelectedWhiteoutBlockId(null);
    }
  };
  const handleWhiteoutSelect = (id: string | null) => {
    setSelectedWhiteoutBlockId(id);
    // Clear other selections
    setSelectedBoxIds(new Set());
    setSelectedAnnotationId(null);
    setSelectedTextBoxId(null);
    setSelectedFieldId(null);
  };

  const handleWhiteoutUpdate = (id: string, updates: Partial<WhiteoutBlock>) => {
  setWhiteoutBlocks(prev => 
    prev.map(block => 
      block.id === id ? { ...block, ...updates } : block
    )
  );
};
const handleWhiteoutRemove = (id: string | null) => {
  setWhiteoutBlocks(prev => prev.filter(block => block.id !== id));
  if (selectedWhiteoutBlockId === id) {
    setSelectedWhiteoutBlockId(null);
  }
};
const handleWhiteoutAdd = (blockData: Omit<WhiteoutBlock, 'id'>) => {
  const newBlock: WhiteoutBlock = {
    ...blockData,
    id: `whiteout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  setWhiteoutBlocks(prev => [...prev, newBlock]);
};

const handleWhiteoutBlocksChange = (blocks: WhiteoutBlock[]) => {
  console.log('Whiteout blocks changed:', blocks.length);
  localStorage.setItem('whiteout-blocks', JSON.stringify(blocks));
  setHistory(history)
};

  // ---- FORM FIELD HANDLERS ----
  const handleFormFieldAdd = (field: FormField) => {
    setFormFields(prev => [...prev, field]);
  };

  const handleFormFieldUpdate = (id: string, updates: Partial<FormField>) => {
    setFormFields(prev => prev.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const handleFormFieldDelete = (id: string | null) => {
    setFormFields(prev => prev.filter(field => field.id !== id));
    if (selectedFieldId === id) {
      setSelectedFieldId(null);
    }
  };

  const handleFormFieldSelect = (id: string | null) => {
    setSelectedFieldId(id);
    handleClearSelection();
  };

  const handleFormFieldValueChange = (id: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [id]: value }));
    handleFormFieldUpdate(id, { value });
  };

  // ---- NAVIGATION HANDLERS ----
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.max(25, Math.min(400, newZoom)));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // ---- HISTORY HANDLERS ----
  const handleUndo = () => {
    if (historyIndex > 0) {
      setIsUndoRedoInProgress(true);
      const prevState = history[historyIndex - 1];
      setAnnotations(prevState.annotations);
      setTextElements(prevState.textElements);
      setFormFields(prevState.formFields);
      setTextBoxes(prevState.textBoxes);
      setWhiteoutBlocks(prevState.whiteoutBlocks);
      setTextLayerElements(prevState.textLayerElements);
      setHistoryIndex(prev => prev - 1);
      setTimeout(() => setIsUndoRedoInProgress(false), 100);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedoInProgress(true);
      const nextState = history[historyIndex + 1];
      setAnnotations(nextState.annotations);
      setTextElements(nextState.textElements);
      setFormFields(nextState.formFields);
      setTextBoxes(nextState.textBoxes);
      setWhiteoutBlocks(nextState.whiteoutBlocks);
      setTextLayerElements(nextState.textLayerElements);
      setHistoryIndex(prev => prev + 1);
      setTimeout(() => setIsUndoRedoInProgress(false), 100);
    }
  };

  // ---- FILE HANDLERS ----
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      loadPDF(file);
    }
  };

  const handleMergeFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setMergeFiles(prev => [...prev, ...files]);
  };

  const handleExport = async () => {
    if (!originalFileData) return;
    
    try {
      // This would integrate with a PDF generation library
      // For now, we'll just download the original file
      const blob = new Blob([new Uint8Array(originalFileData)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "edited-document.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  // ---- TOOL CHANGE HANDLERS ----
  const handleToolChange = (tool: typeof currentTool) => {
    setCurrentTool(tool);
    handleClearSelection();
    
    // Reset tool-specific states
    if (tool !== "whiteout") setWhiteoutMode(false);
    if (tool !== "signature") setShowSignatureDialog(false);
    if (tool !== "line") {
      setIsDrawingLine(false);
      setCurrentDrawStart(null);
    }
    if (tool !== "eraser") setIsErasing(false);
  };

  const handleModeChange = (mode: typeof activeMode) => {
    setActiveMode(mode);
    setCurrentTool("select");
    handleClearSelection();
  };

  // ---- FONT HANDLERS ----
  const handleFontLoad = async (fontInfo: FontInfo) => {
    try {
      setLoadingFonts(true);
      // This would load custom fonts
      // For now, we'll just mark it as loaded
      setAvailableFontList(prev => prev.map(font => 
        font.name === fontInfo.name ? { ...font, loaded: true } : font
      ));
    } catch (error) {
      console.error("Font loading failed:", error);
    } finally {
      setLoadingFonts(false);
    }
  };

  // ---- RENDER ----
  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={mergeFileInputRef}
        type="file"
        accept=".pdf"
        multiple
        onChange={handleMergeFileUpload}
        className="hidden"
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setSelectedImage(event.target?.result as string);
              setImageName(file.name);
            };
            reader.readAsDataURL(file);
          }
        }}
        className="hidden"
      />

      {/* Sidebar */}
      <PDFSidebar
        annotations={annotations}
        textBoxes={textBoxes}
        whiteoutBlocks={whiteoutBlocks}
        textElements={textElements}
        onSelectAnnotation={handleAnnotationSelect}
        onDeleteAnnotation={handleAnnotationDelete}
        onSelectTextBox={(id) => setSelectedTextBoxId(id)}
        onDeleteTextBox={handleRemove}
        onSelectWhiteoutBlock={handleWhiteoutSelect}
        onDeleteWhiteoutBlock={handleWhiteoutDelete}
        pdfDocument={pdfDocument}
        currentPage={currentPage}
        setCurrentPage={handlePageChange}
        totalPages={totalPages}
        fileName={fileName}
      />

 {/* Main Content */}
<div className="flex-1 flex flex-col">
  {/* Toolbar */}
  <PDFToolbar
    currentTool={currentTool}
    onToolChange={handleToolChange}
    onUndo={handleUndo}
    onRedo={handleRedo}
    handleFileUpload={
      // PDFToolbar wants (file: File) => void not (event)
      (file: File) => { if (file) loadPDF(file); }
    }
    canUndo={historyIndex > 0}
    canRedo={historyIndex < history.length - 1}
    setCurrentTool={setCurrentTool}
    zoom={zoom}
    onZoomIn={() => setZoom(z => Math.min(z + 10, 400))}
    onZoomOut={() => setZoom(z => Math.max(z - 10, 25))}
    setZoom={setZoom}
    rotation={rotation}
    setRotation={setRotation}
    fileName={fileName}
    onDownload={handleExport}
    isLoading={isLoading}
    selectedFont={selectedFont} // Pass the FontInfo object, not just the name
    onFontChange={(font: FontInfo) => {
      setSelectedFont(font);
    }}
    fontList={availableFontList} // Pass the FontInfo array, not string array
    highlightColor={highlightColor}
    onHighlightColorChange={setHighlightColor}
    onAnnotationColorChange={setAnnotationColor}
    annotationColor={annotationColor}
    setAnnotationColor={setAnnotationColor}
    lineColor={lineColor}
    lineStrokeWidth={lineStrokeWidth}
    onLineColorChange={setLineColor}
    onLineStrokeWidthChange={setLineStrokeWidth}
    whiteoutMode={whiteoutMode}
    onWhiteoutToggle={() => setWhiteoutMode((prev) => !prev)}
    signatureName={signatureName}
    signatureFont={signatureFont}
    setSignatureName={setSignatureName}
    setSignatureFont={setSignatureFont}
    showSignatureDialog={showSignatureDialog}
    setShowSignatureDialog={setShowSignatureDialog}
    currentPage={currentPage}
    totalPages={totalPages}
    setCurrentPage={setCurrentPage}
    fileInputRef={fileInputRef}
    savePDF={handleExport}
  />

  {/* PDF Viewer */}
  <div className="flex-1 relative overflow-auto bg-white">
    {renderingError ? (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-4">{renderingError}</p>
          <Button onClick={() => fileInputRef.current?.click()}>
            Load PDF
          </Button>
        </div>
      </div>
    ) : !pdfDocument ? (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No PDF loaded</p>
          <Button onClick={() => fileInputRef.current?.click()}>
            Load PDF
          </Button>
        </div>
      </div>
    ) : (
      <div className="relative">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Main canvas */}
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ cursor: getCursorForTool(currentTool) }}
          className="block mx-auto shadow-lg"
        />

        {/* Annotation canvas overlay */}
        <canvas
          ref={annotationCanvasRef}
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            width: canvasRef.current?.style.width,
            height: canvasRef.current?.style.height,
          }}
        />

        {/* Text Layer */}
        <AdvancedTextLayer
          textBoxes={textBoxes.filter(box => box.page === currentPage)}
          textLayerElements={textLayerElements}
          selectedBoxIds={selectedBoxIds}
          onSelect={handleSelect}
          onMultiSelect={handleMultiSelect}
          onClearSelection={handleClearSelection}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
          onAdd={handleAdd}
          currentPage={currentPage}
          canvasRef={canvasRef}
          fontList={availableFontList}
        />

        {/* Whiteout Layer */}
        <WhiteoutLayer
          whiteoutBlocks={whiteoutBlocks}
          setWhiteoutBlocks={setWhiteoutBlocks}
          selectedBlockId={selectedWhiteoutBlockId}
          onSelect={handleWhiteoutSelect}
          onUpdate={handleWhiteoutUpdate}
          onRemove={handleWhiteoutDelete}
          onAdd={handleWhiteoutAdd}
          isActive={currentTool === "whiteout"}
          currentPage={currentPage}
          canvasRef={canvasRef}
          scale={zoom / 100}
          page={currentPage}
          onBlocksChange={handleWhiteoutBlocksChange}
        />

        {/* Fillable Form Layer */}
        {activeMode === "forms" && (
          <FillableFormLayer
            file={null}
            pdfDocument={pdfDocument}
            currentPage={currentPage}
            onFieldsDetected={handleFormFieldsDetected}
            onSave={handleFormDataSave}
            detectedFormFields={detectedFormFields}
            className={className}
          />
        )}

        {/* OCR Layer */}
        {currentTool === "ocr" && (
          <OCRLayer
            ocrResults={ocrResults.filter(result => result.page === currentPage)}
            selectedBlockId={selectedBlockId}
            onSelect={setSelectedBlockId}
            onExtract={handleOCRExtract}
            onEdit={(id: string) => {
              /* You may want to implement a single-argument edit handler here */
            }}
            canvasRef={canvasRef}
            currentPage={currentPage}
          />
        )}

        {/* Eraser Layer */}
        {currentTool === "eraser" && (
          <EraserLayer
          canvasRef={canvasRef}
          currentPage={currentPage}
          eraserSize={eraserSize}
          onErase={handleErase}
          currentTool={currentTool}
          setEraserSize={setEraserSize}
          />
        )}
      </div>
    )}
  </div>

  {/* Page Navigation */}
  {pdfDocument && showControls && (
    <div className="border-t bg-white p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleZoomChange(zoom - 25)}
          disabled={zoom <= 25}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm min-w-[60px] text-center">
          {zoom}%
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleZoomChange(zoom + 25)}
          disabled={zoom >= 400}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          disabled={!pdfDocument}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  )}

  {/* Managers and Dialogs */}
  <AnnotationManager
    annotations={annotations}
    textBoxes={textBoxes}
    whiteoutBlocks={whiteoutBlocks}
    textElements={textElements}
    onSelectAnnotation={handleAnnotationSelect}
    onDeleteAnnotation={handleAnnotationDelete}
    onSelectTextBox={id => setSelectedTextBoxId(id)}
    onDeleteTextBox={handleRemove}
    onSelectWhiteoutBlock={handleWhiteoutSelect}
    onDeleteWhiteoutBlock={handleWhiteoutDelete}
    pdfDocument={pdfDocument}
    currentPage={currentPage}
    totalPages={totalPages}
    canvasRef={canvasRef}
    zoom={zoom}
  />

<TextBoxManager
    textBoxes={textBoxes}
    setTextBoxes={setTextBoxes}
    selectedTextBox={selectedTextBoxId}
    setSelectedTextBox={setSelectedTextBoxId}
    canvasRef={canvasRef}
    currentPage={currentPage}
    zoom={zoom}
    onRemove={handleRemoveTextBox}
    onAdd={handleAddTextBox}
    onFontChange={onFontChange}
    fontList={availableFontList}
    selectedFont={selectedFont}
    onTextBoxUpdate={handleTextBoxUpdate}
    originalPdfData={originalFileData}
    showControls={showControls}
  />

<FontManager
    selectedFont={selectedFont.name}
    onFontChange={(font: string) => {
      const match = availableFontList.find(f => f.name === font);
      setSelectedFont(match || DEFAULT_FONT_INFO);
    }}
    fontSize={fontSize}
    onFontSizeChange={setFontSize}
    fontWeight={fontWeight}
    onFontWeightChange={setFontWeight}
    fontStyle={fontStyle}
    onFontStyleChange={setFontStyle}
    showAdvanced={showAdvanced}
  />

  {/* Signature Dialog */}
  {showSignatureDialog && (
    <SignatureTool
      signatureName={signatureName}
      setSignatureName={setSignatureName}
      signatureFont={signatureFont}
      setSignatureFont={setSignatureFont}
      showSignatureDialog={showSignatureDialog}
      setShowSignatureDialog={setShowSignatureDialog}
      onPlaceSignature={(placement: { x: number; y: number }) => {
        handlePlaceSignature({
          x: placement.x,
          y: placement.y,
          text: signatureName,
          font: signatureFont
        });
      }}
      currentPage={currentPage}
      annotationColor={annotationColor}
      onNameChange={setSignatureName}
      onFontChange={setSignatureFont}
    />
  )}

  {/* Image Tool - Remove this section if ImageTool component doesn't exist */}
  {currentTool === "image" && selectedImage && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg">
        <h3>Image Tool</h3>
        <img src={selectedImage} alt={imageName} className="max-w-xs max-h-xs" />
        <div className="flex gap-2 mt-4">
          <Button onClick={() => {
            // Handle image placement logic here
            setSelectedImage(null);
            setImageName("");
            setCurrentTool("select");
          }}>
            Place Image
          </Button>
          <Button variant="outline" onClick={() => {
            setSelectedImage(null);
            setImageName("");
            setCurrentTool("select");
          }}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )}

  {/* OCR Tool */}
  {currentTool === "ocr" && (
    <OCRTool
      isProcessing={isProcessingOcr}
      onTextDetected={results => setOcrResults(results)}
      onTextExtracted={text => {/* Handle extracted text if needed */}}
      pdfDocument={pdfDocument}
      canvasRef={canvasRef}
      currentPage={currentPage}
    />
  )}
  </div>
      </div>
    );
  };