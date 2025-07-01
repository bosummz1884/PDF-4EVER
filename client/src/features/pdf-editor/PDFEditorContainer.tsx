import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AnnotationManager from "@/components/managers/AnnotationManager";
import { TextBoxManager } from "@/components/managers/TextBoxManager";
import FontManager from "@/components/managers/FontManager";
import WhiteoutLayer from "@/features/components/layers/WhiteoutLayer";
import FillableFormLayer from "@/features/components/layers/FillableFormLayer";
import AdvancedTextLayer from "@/features/components/layers/AdvancedTextLayer";
import OCRLayer from "@/features/components/layers/OCRLayer";
import EraserLayer from "@/features/components/layers/EraserLayer";
import { FormField, Annotation, WhiteoutBlock, TextBox, OCRResult, FontInfo, DEFAULT_FONT_INFO, FontManagerProps } from "client/src/types/pdf-types";
import PDFToolbar from "@/features/components/PDFToolbar";
import PDFSidebar from "client/src/features/components/PDFSidebar";

// ---- DUMMY/PLACEHOLDER COMPONENTS: Replace with real ones when you build them
const SignatureTool = (props: any) => null;
const ImageTool = (props: any) => null;
const FormTool = (props: any) => null;
const OCRTool = (props: any) => null;

// ---- Props Interface ----
interface PDFEditorContainerProps {
  className?: string;
}

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

export default function PDFEditorContainer({ className }: PDFEditorContainerProps) {
  // ---- CORE PDF STATE ----
  const [originalFileData, setOriginalFileData] = useState<Uint8Array | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [renderingError, setRenderingError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

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
  const [loadingFonts, setLoadingFonts] = useState(false);
  const [selectedFont, setSelectedFont] = useState<FontInfo>(DEFAULT_FONT_INFO);
  const [fontSize, setFontSize] = useState(14);
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("normal");
  const [fontStyle, setFontStyle] = useState<"normal" | "italic">("normal");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false); // or true if you want open by default
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

  const renderPage = async (pdf: any, pageNumber: number) => {
    if (!canvasRef.current) return;
    try {
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
    } catch (error) {
      setRenderingError(`Failed to render page ${pageNumber}`);
    }
  };

  // Select a single box
const handleSelect = (id: string) => {
  setSelectedBoxIds(new Set([id]));
};

// Multi-select boxes (adds to current selection)
const handleMultiSelect = (id: string) => {
  setSelectedBoxIds(prev => {
    const next = new Set(prev);
    next.add(id);
    return next;
  });
};

// Clear all selection
const handleClearSelection = () => {
  setSelectedBoxIds(new Set());
};

// Update a textbox
const handleUpdate = (id: string, updates: Partial<TextBox>) => {
  setTextBoxes(prev =>
    prev.map(box =>
      box.id === id ? { ...box, ...updates } : box
    )
  );
};

// Remove a textbox
const handleRemove = (id: string) => {
  setTextBoxes(prev => prev.filter(box => box.id !== id));
  setSelectedBoxIds(prev => {
    const next = new Set(prev);
    next.delete(id);
    return next;
  });
};

// Add a new textbox (you must assign it an id)
const handleAdd = (box: Omit<TextBox, "id">) => {
  const id = `textbox_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const newBox: TextBox = { ...box, id };
  setTextBoxes(prev => [...prev, newBox]);
};


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

  useEffect(() => {
    if (pdfDocument && currentPage) {
      renderPage(pdfDocument, currentPage);
    }
  }, [pdfDocument, currentPage, zoom, rotation]);

  useEffect(() => {
    if (originalFileData) setRenderingError(null);
  }, [originalFileData]);

  useEffect(() => {}, [selectedFont]);
  useEffect(() => {}, [annotations, currentPage]);
  useEffect(() => {}, [whiteoutBlocks, currentPage]);
  useEffect(() => {}, [textElements, currentPage]);

  // ---- HANDLERS ----
  const handleExportPDF = async () => {
    if (!pdfDocument || !originalFileData) return;
    setIsLoading(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.load(originalFileData);
      // Optionally: add annotations, text boxes, etc, here
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "exported.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setRenderingError("Failed to export PDF.");
    }
    setIsLoading(false);
  };

  const handleToolChange = (tool: typeof currentTool) => setCurrentTool(tool);
;
  const exportPDF = handleExportPDF;

  // Navigation
  const goToPreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const handleZoomIn = () => setZoom(Math.min(200, zoom + 25));
  const handleZoomOut = () => setZoom(Math.max(50, zoom - 25));
  const handleResetError = () => setRenderingError(null);
  const toggleWhiteoutMode = () => setWhiteoutMode(prev => !prev);
  const loadMoreFonts = () => {};

  // Placeholders for all required handlers
  const handleCanvasClick = () => {};
  const handleMouseDown = () => {};
  const handleMouseMove = () => {};
  const handleMouseUp = () => {};
  const handleTextBoxUpdate = () => {};
  const handleErase = () => {};
  const handleOCRTextExtract = () => {};
  const handleFormDataSave = () => {};
  const handleFormFieldsDetected = () => {};
  const handlePlaceSignature = () => {};
  const handleImagePlace = () => {};
  const handleOCRExtract = () => {};
  const handleFileUpload = (file: File) => {};
  const savePDF = () => {};

  // Annotation handlers
  const handleAnnotationAdd = (annotation: Annotation) => setAnnotations(prev => [...prev, annotation]);
  const handleAnnotationRemove = (id: string) => setAnnotations(prev => prev.filter(a => a.id !== id));
  const handleAnnotationsClear = () => setAnnotations([]);

  // Form fields
  const handleFormFieldsChange = (fields: FormField[]) => setFormFields(fields);
  const handleFormFieldAdd = (field: FormField) => setFormFields(prev => [...prev, field]);
  const handleFormFieldRemove = (id: string) => setFormFields(prev => prev.filter(f => f.id !== id));

  // Whiteout
  const handleWhiteoutBlocksChange = (blocks: any[]) => setWhiteoutBlocks(blocks);
  const handleWhiteoutBlockAdd = (block: any) => setWhiteoutBlocks(prev => [...prev, block]);
  const handleWhiteoutBlockRemove = (id: string) => setWhiteoutBlocks(prev => prev.filter(b => b.id !== id));



const onFontSizeChange = (size: number) => setFontSize(size);
const onFontWeightChange = (weight: "normal" | "bold") => setFontWeight(weight);
const onFontStyleChange = (style: "normal" | "italic") => setFontStyle(style);

  // Text Elements
  const handleTextElementsChange = (elements: any[]) => {
    setTextElements(prev => ({
      ...prev,
      [currentPage]: elements,
    }));
  };
  const handleTextElementAdd = (element: any) => {
    setTextElements(prev => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), element],
    }));
  };
  const handleTextElementRemove = (id: string) => {
    setTextElements(prev => ({
      ...prev,
      [currentPage]: (prev[currentPage] || []).filter((el: any) => el.id !== id),
    }));
  };
  // Before your return (JSX) in the parent component
const onSelect = (id: string) => { /* your logic here */ };
const onMultiSelect = (id: string) => { /* your logic here */ };
const clearSelection = () => { /* your logic here */ };
const onUpdate = (id: string, updates: Partial<TextBox>) => { /* ... */ };
const onRemove = (id: string) => { /* ... */ };
const onAdd = (box: Omit<TextBox, "id">) => { /* ... */ };
const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  // Now you have a File object called `file`
};


  // When a user selects an annotation
  const handleSelectAnnotation = (id: string | null) => setSelectedAnnotationId(id);
  const handleDeleteAnnotation = (id: string) => setAnnotations(prev => prev.filter(a => a.id !== id));
  const handleSelectTextBox = (id: string | null) => setSelectedTextBoxId(id);
  const handleDeleteTextBox = (id: string) => setTextBoxes(prev => prev.filter(tb => tb.id !== id));
  const handleSelectWhiteoutBlock = (id: string | null) => setSelectedWhiteoutBlockId(id);
  const handleDeleteWhiteoutBlock = (id: string) => setWhiteoutBlocks(prev => prev.filter(wb => wb.id !== id));

  // ---- JSX ----
  return (
    <div className={`pdf-editor-container min-h-screen flex flex-col bg-background ${className || ''}`}>
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/70x70logo.png" alt="PDF4EVER Logo" className="h-10 w-10" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              PDF4EVER
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><a href="/">Home</a></Button>
            <Button asChild variant="ghost" size="sm"><a href="/pricing">Pricing</a></Button>
            <Button asChild variant="ghost" size="sm"><a href="/privacy-policy">Privacy</a></Button>
            <Button asChild variant="ghost" size="sm"><a href="/terms-of-service">Terms</a></Button>
          </nav>
        </div>
      </header>

      {/* Toolbar */}
      <PDFToolbar
        setCurrentTool={setCurrentTool}
        setZoom={setZoom}
        rotation={rotation}
        setRotation={setRotation}
        currentTool={currentTool}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        fileInputRef={fileInputRef}
        onToolChange={handleToolChange}
        onUndo={() => {}} // stub: plug your real undo
        onRedo={() => {}} // stub: plug your real redo
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        fileName={fileName}
        onDownload={exportPDF}
        isLoading={isLoading}
        selectedFont={selectedFont}
        onFontChange={setSelectedFont}
        fontList={availableFontList}
        onLoadMoreFonts={loadMoreFonts}
        loadingFonts={loadingFonts}
        highlightColor={highlightColor}
        onHighlightColorChange={setHighlightColor}
        annotationColor={annotationColor}
        onAnnotationColorChange={setAnnotationColor}
        lineColor={lineColor}
        lineStrokeWidth={lineStrokeWidth}
        onLineColorChange={setLineColor}
        onLineStrokeWidthChange={setLineStrokeWidth}
        whiteoutMode={whiteoutMode}
        onWhiteoutToggle={toggleWhiteoutMode}
        signatureName={signatureName}
        signatureFont={signatureFont}
        setSignatureName={setSignatureName}
        setSignatureFont={setSignatureFont}
        showSignatureDialog={showSignatureDialog}
        setShowSignatureDialog={setShowSignatureDialog}
        handleFileUpload={handleFileUpload}
        savePDF={savePDF}
        setAnnotationColor={setAnnotationColor}

      />

      {/* Main Content */}
      <main className="flex flex-1 w-full overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:block w-72 bg-gray-100 dark:bg-gray-900 border-r">
          <PDFSidebar
            annotations={annotations}
            textBoxes={textBoxes}
            whiteoutBlocks={whiteoutBlocks}
            textElements={textElements}
            onSelectAnnotation={setSelectedAnnotationId}
            onDeleteAnnotation={handleDeleteAnnotation}
            onSelectTextBox={handleSelectTextBox}
            onDeleteTextBox={handleDeleteTextBox}
            onSelectWhiteoutBlock={handleSelectWhiteoutBlock}
            onDeleteWhiteoutBlock={handleDeleteWhiteoutBlock}
            pdfDocument={pdfDocument}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            fileName={fileName}
          />
        </aside>

        {/* Content Area */}
        <section className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800">
          {/* Status Bar */}
          <div className="flex items-center justify-between w-full px-6 py-3 border-b bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage <= 1}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}><ZoomOut className="h-4 w-4" /></Button>
              <span className="text-sm min-w-14 text-center">{zoom}%</span>
              <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}><ZoomIn className="h-4 w-4" /></Button>
            </div>
            <Button variant="default" size="sm" onClick={exportPDF} disabled={isLoading || !pdfDocument}>
              <Download className="h-4 w-4 mr-1" />
              {isLoading ? "Exporting..." : "Download"}
            </Button>
          </div>

          {/* Canvas + Layers */}
          <div className="relative w-full max-w-6xl mx-auto my-6 shadow-lg rounded-lg overflow-hidden bg-white dark:bg-gray-900" style={{ minHeight: 600 }}>
            {/* Main Rendered PDF Canvas */}
            <canvas ref={canvasRef} className="block w-full" />

            {/* Annotation Layer */}
            <canvas
              ref={annotationCanvasRef}
              className="absolute top-0 left-0"
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{
                cursor: getCursorForTool(currentTool),
                pointerEvents: "auto",
                zIndex: 10,
              }}
            />

            {/* LAYERED COMPONENTS */}
            <AnnotationManager
              annotations={annotations}
              textBoxes={textBoxes}
              whiteoutBlocks={whiteoutBlocks}
              textElements={textElements}
              onSelectAnnotation={setSelectedAnnotationId}
              onDeleteAnnotation={handleDeleteAnnotation}
              onSelectTextBox={handleSelectTextBox}
              onDeleteTextBox={handleDeleteTextBox}
              onSelectWhiteoutBlock={handleSelectWhiteoutBlock}
              onDeleteWhiteoutBlock={handleDeleteWhiteoutBlock}
              pdfDocument={pdfDocument}
              currentPage={currentPage}
              totalPages={totalPages}
              canvasRef={annotationCanvasRef}
              zoom={zoom}
              showControls={showControls}
            />
            <TextBoxManager
              textBoxes={textBoxes}
              setTextBoxes={setTextBoxes}
              selectedTextBox={selectedTextBoxId}
              setSelectedTextBox={setSelectedTextBoxId}
              currentPage={currentPage}
              canvasRef={canvasRef}
              zoom={zoom / 100}
              fontList={availableFontList}
              onFontChange={setSelectedFont}
              selectedFont={selectedFont}
              onTextBoxUpdate={handleTextBoxUpdate}
              originalPdfData={originalFileData}
              showControls={showTextBoxManager}
            />
            <WhiteoutLayer
              whiteoutBlocks={whiteoutBlocks}
              setWhiteoutBlocks={setWhiteoutBlocks}
              isActive={whiteoutMode}
              currentPage={currentPage}
              canvasRef={canvasRef}
              scale={zoom / 100}
              page={currentPage}
            />

            <AdvancedTextLayer
              textLayerElements={textLayerElements}
              currentPage={currentPage}
              canvasRef={canvasRef}
              textBoxes={textBoxes}
              fontList={availableFontList}
              selectedBoxIds={new Set()}
              onSelect={onSelect}
              onMultiSelect={onMultiSelect}
              onClearSelection={clearSelection}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onAdd={onAdd}
            />

            <EraserLayer
              eraserSize={eraserSize}
              setEraserSize={setEraserSize}
              onErase={handleErase}
              currentTool={currentTool}
              currentPage={currentPage}
              canvasRef={annotationCanvasRef}
            />
            <OCRLayer
              pdfDocument={pdfDocument}
              currentPage={currentPage}
              ocrResults={ocrResults}
              canvasRef={canvasRef}
            />

            <FillableFormLayer
              detectedFormFields={detectedFormFields}
              currentPage={currentPage}
              pdfDocument={pdfDocument}
              onFieldsDetected={handleFormFieldsDetected}
              onSave={handleFormDataSave}
              file={new File(["Hello"], "file.txt", { type: "text/plain" })}

            />

            {/* Tool Overlays / Dialogs */}
            <FontManager
            selectedFont={selectedFont.name}
            onFontChange={onFontChange}
            fontSize={fontSize}
            onFontSizeChange={onFontSizeChange}
            fontWeight={fontWeight}
            onFontWeightChange={onFontWeightChange}
            fontStyle={fontStyle}
            onFontStyleChange={onFontStyleChange}
            showAdvanced={showAdvanced}
        
            />
            <SignatureTool
              signatureName={signatureName}
              setSignatureName={setSignatureName}
              signatureFont={signatureFont}
              setSignatureFont={setSignatureFont}
              showSignatureDialog={showSignatureDialog}
              setShowSignatureDialog={setShowSignatureDialog}
              onPlaceSignature={handlePlaceSignature}
              currentPage={currentPage}
              annotationColor={annotationColor}
            />
            <ImageTool
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              imageName={imageName}
              setImageName={setImageName}
              onImagePlace={handleImagePlace}
              currentTool={currentTool}
              canvasRef={annotationCanvasRef}
            />
            <FormTool
              newFieldType={newFieldType}
              setNewFieldType={setNewFieldType}
              onFormFieldAdd={handleFormFieldAdd}
              formFields={formFields}
              setFormFields={setFormFields}
              currentPage={currentPage}
            />
            <OCRTool
              pdfDocument={pdfDocument}
              currentPage={currentPage}
              onOCRExtract={handleOCRExtract}
              ocrResults={ocrResults}
              setOcrResults={setOcrResults}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
