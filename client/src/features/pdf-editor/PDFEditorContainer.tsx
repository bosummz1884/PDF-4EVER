import React, { useRef, useState, useEffect, useCallback } from "react";
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
import { loadFonts, isFontAvailable, getAvailableFontNames } from "@/lib/loadFonts";
import { hexToRgbNormalized } from "@/features/utils/colorUtils";
import { FormField, Annotation, WhiteoutBlock, TextBox, OCRResult } from "client/src/types/pdf-types";

// Example UI sub-components, update to your actual structure
import PDFToolbar from "@/features/components/PDFToolbar";
import PDFSidebar from "client/src/features/components/PDFSidebar";


// ---- Props Interface ----
interface PDFEditorContainerProps {
  className?: string;
}

// ---- Main Component ----
export default function PDFEditorContainer({ className }: PDFEditorContainerProps) {
  // ---- CORE PDF STATE ----
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [originalFileData, setOriginalFileData] = useState<Uint8Array | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);
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
  const [activeMode, setActiveMode] = useState<
    "edit" | "merge" | "split" | "forms" | "fill"
  >("edit");

  // ---- ANNOTATIONS ----
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [annotationColor, setAnnotationColor] = useState("#FFFF00");
  const [strokeWidth, setStrokeWidth] = useState(2);

  // ---- WHITEOUT ----
  const [whiteoutBlocks, setWhiteoutBlocks] = useState<WhiteoutBlock[]>([]);
  const [whiteoutMode, setWhiteoutMode] = useState(false);

  // ---- TEXT BOXES & ADVANCED TEXT LAYER ----
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);
  const [showTextBoxManager, setShowTextBoxManager] = useState(false);

  // ---- FONT MANAGEMENT ----
  const [availableFontList, setAvailableFontList] = useState<{ name: string; family: string; loaded: boolean }[]>([
    { name: "Arial", family: "Arial, sans-serif", loaded: true },
    { name: "Times New Roman", family: "'Times New Roman', serif", loaded: true },
    { name: "Courier New", family: "'Courier New', monospace", loaded: true }
  ]);
  const [loadingFonts, setLoadingFonts] = useState(false);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [fontSize, setFontSize] = useState(14);
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("normal");
  const [fontStyle, setFontStyle] = useState<"normal" | "italic">("normal");
  const handleFontChange = (font: string) => setSelectedFont(font);
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
  const [ocrBlocks, setOcrBlocks] = useState<OCRBlock[]>([]);

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

  // ---- REFS ----
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeFileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ---- EFFECTS ----
  // Any essential useEffect hooks for file loading, annotation sync, etc., would be added here.
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
  // Only save if state actually changed and content is not empty
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

  // Rerender on page/zoom/rotation change
useEffect(() => {
  if (pdfDocument && currentPage) {
    renderPage(pdfDocument, currentPage);
  }
}, [pdfDocument, currentPage, zoom, rotation]);

// Reset error message when file changes
useEffect(() => {
  if (originalFileData) setRenderingError(null);
}, [originalFileData]);

// Synchronize font change if needed (future-proofing)
useEffect(() => {
  // You can inform subcomponents about font changes here if needed
}, [selectedFont]);

// Redraw annotations on annotation state change or page change
useEffect(() => {
  // This should trigger any annotation overlays to re-render
  // If using an AnnotationLayer component, it will get new props automatically
}, [annotations, currentPage]);

// Redraw whiteout blocks on state/page change
useEffect(() => {
  // Trigger whiteout overlays if you have them as a component
}, [whiteoutBlocks, currentPage]);

// Redraw text elements on state/page change
useEffect(() => {
  // Update rendered text overlays as needed
}, [textElements, currentPage]);

  // ---- HANDLERS (EXAMPLES) ----
  // You would add your file upload handler, page navigation, tool switching handlers, undo/redo, etc., below.
  // Font selection
// Save current editor state to history
const saveToHistory = useCallback(() => {
  const state = {
    annotations: [...annotations],
    textElements: { ...textElements },
    formFields: [...formFields],
    textBoxes: [...textBoxes],
    whiteoutBlocks: [...whiteoutBlocks],
    textLayerElements: [...textLayerElements],
  };
  setHistory(prev => {
    const newHistory = prev.slice(0, historyIndex + 1);
    newHistory.push(state);
    const trimmed = newHistory.slice(-50); // Keep only last 50
    return trimmed;
  });
  setHistoryIndex(prev => Math.min(prev + 1, 49));
}, [
  annotations,
  textElements,
  formFields,
  textBoxes,
  whiteoutBlocks,
  textLayerElements,
  historyIndex,
]);

// Undo
const undo = useCallback(() => {
  if (historyIndex > 0 && history[historyIndex - 1]) {
    setIsUndoRedoInProgress(true);
    const previous = history[historyIndex - 1];
    setAnnotations(previous.annotations || []);
    setTextElements(previous.textElements || {});
    setFormFields(previous.formFields || []);
    setTextBoxes(previous.textBoxes || []);
    setWhiteoutBlocks(previous.whiteoutBlocks || []);
    setTextLayerElements(previous.textLayerElements || []);
    setHistoryIndex(prev => prev - 1);
    setTimeout(() => setIsUndoRedoInProgress(false), 10);
  }
}, [history, historyIndex]);

// Redo
const redo = useCallback(() => {
  if (historyIndex < history.length - 1 && history[historyIndex + 1]) {
    setIsUndoRedoInProgress(true);
    const next = history[historyIndex + 1];
    setAnnotations(next.annotations || []);
    setTextElements(next.textElements || {});
    setFormFields(next.formFields || []);
    setTextBoxes(next.textBoxes || []);
    setWhiteoutBlocks(next.whiteoutBlocks || []);
    setTextLayerElements(next.textLayerElements || []);
    setHistoryIndex(prev => prev + 1);
    setTimeout(() => setIsUndoRedoInProgress(false), 10);
  }
}, [history, historyIndex]);

const handleFontChange = (font: string) => setSelectedFont(font);

// Navigation
const goToPreviousPage = () => {
  if (currentPage > 1) setCurrentPage(currentPage - 1);
};

const goToNextPage = () => {
  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
};

// Zoom controls
const handleZoomIn = () => setZoom(Math.min(200, zoom + 25));
const handleZoomOut = () => setZoom(Math.max(50, zoom - 25));

// Error reset
const handleResetError = () => setRenderingError(null);

// PDF File upload (with rendering first page)
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file || file.type !== "application/pdf") {
    setRenderingError("Please upload a valid PDF file.");
    return;
  }
  try {
    setIsLoading(true);
    setRenderingError(null);
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    setOriginalFileData(uint8Array);

    // Assume you're using pdfjsLib to load and render
    const { pdfjsLib, initializeWorker } = await import("@/lib/pdfWorker");
    await initializeWorker();
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    setPdfDocument(pdf);
    setTotalPages(pdf.numPages);
    setCurrentPage(1);

    // Optionally: Render the first page
    await renderPage(pdf, 1);
  } catch (err) {
    setRenderingError("Failed to load PDF file.");
  } finally {
    setIsLoading(false);
  }
};

// Render a PDF page on the canvas
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

// Annotation handlers
const handleAnnotationAdd = (annotation: Annotation) => {
  setAnnotations(prev => [...prev, annotation]);
};
const handleAnnotationRemove = (id: string) => {
  setAnnotations(prev => prev.filter(a => a.id !== id));
};
const handleAnnotationsClear = () => setAnnotations([]);

// Form fields
const handleFormFieldsChange = (fields: FormField[]) => setFormFields(fields);
const handleFormFieldAdd = (field: FormField) => setFormFields(prev => [...prev, field]);
const handleFormFieldRemove = (id: string) => setFormFields(prev => prev.filter(f => f.id !== id));

// Whiteout
const handleWhiteoutBlocksChange = (blocks: any[]) => setWhiteoutBlocks(blocks);
const handleWhiteoutBlockAdd = (block: any) => setWhiteoutBlocks(prev => [...prev, block]);
const handleWhiteoutBlockRemove = (id: string) => setWhiteoutBlocks(prev => prev.filter(b => b.id !== id));

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

// PDF Export Handler (with advanced text)
const handleExportPDF = async () => {
  if (!pdfDocument || !originalFileData) return;
  setIsLoading(true);
  try {
    const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
    const pdfDoc = await PDFDocument.load(originalFileData);
    const pages = pdfDoc.getPages();

    // Add all textBoxes to the document (example, if you use textBoxes)
    // if (textBoxes.length > 0) { ... }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
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

// Memoized handlers for performance, when passing as props
const memoizedhandleAnnotationAdd = useCallback(handleAnnotationAdd, []);
const memoizedhandleAnnotationRemove = useCallback(handleAnnotationRemove, []);
const memoizedhandleAnnotationsClear = useCallback(handleAnnotationsClear, []);
const memoizedhandleFormFieldsChange = useCallback(handleFormFieldsChange, []);
const memoizedhandleFormFieldAdd = useCallback(handleFormFieldAdd, []);
const memoizedhandleFormFieldRemove = useCallback(handleFormFieldRemove, []);
const memoizedhandleWhiteoutBlocksChange = useCallback(handleWhiteoutBlocksChange, []);
const memoizedhandleWhiteoutBlockAdd = useCallback(handleWhiteoutBlockAdd, []);
const memoizedhandleWhiteoutBlockRemove = useCallback(handleWhiteoutBlockRemove, []);
const memoizedhandleTextElementsChange = useCallback(handleTextElementsChange, [currentPage]);
const memoizedhandleTextElementAdd = useCallback(handleTextElementAdd, [currentPage]);
const memoizedhandleTextElementRemove = useCallback(handleTextElementRemove, [currentPage]);

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
          <Button asChild variant="ghost" size="sm">
            <a href="/">Home</a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href="/pricing">Pricing</a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href="/privacy-policy">Privacy</a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href="/terms-of-service">Terms</a>
          </Button>
        </nav>
      </div>
    </header>

    {/* Toolbar */}
    <PDFToolbar
      currentTool={currentTool}
      onToolChange={handleToolChange}
      onUndo={undo}
      onRedo={redo}
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
      {...toolbarOtherProps}
    />

    {/* PDF Editor Main Content */}
    <main className="flex flex-1 w-full overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:block w-72 bg-gray-100 dark:bg-gray-900 border-r">
        <PDFSidebar
          annotations={annotations}
          textBoxes={textBoxes}
          whiteoutBlocks={whiteoutBlocks}
          textElements={textElements}
          onSelectAnnotation={setSelectedAnnotation}
          onDeleteAnnotation={handleDeleteAnnotation}
          onSelectTextBox={handleSelectTextBox}
          onDeleteTextBox={handleDeleteTextBox}
          onSelectWhiteoutBlock={handleSelectWhiteoutBlock}
          onDeleteWhiteoutBlock={handleDeleteWhiteoutBlock}
          pdfDocument={pdfDocument}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </aside>

      {/* PDF Content Area */}
      <section className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800">
        {/* Status Bar & Page Navigation */}
        <div className="flex items-center justify-between w-full px-6 py-3 border-b bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm min-w-14 text-center">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="default" size="sm" onClick={exportPDF} disabled={isLoading || !pdfDocument}>
            <Download className="h-4 w-4 mr-1" />
            {isLoading ? "Exporting..." : "Download"}
          </Button>
        </div>

        {/* PDF CANVAS + LAYERS */}
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
            setAnnotations={setAnnotations}
            selectedAnnotation={selectedAnnotation}
            setSelectedAnnotation={setSelectedAnnotation}
            currentPage={currentPage}
            onAnnotationSelect={handleAnnotationSelect}
            onAnnotationDelete={handleDeleteAnnotation}
            annotationColor={annotationColor}
            strokeWidth={strokeWidth}
            canvasRef={annotationCanvasRef}
          />
          <TextBoxManager
            textBoxes={textBoxes}
            setTextBoxes={setTextBoxes}
            selectedTextBox={selectedTextBox}
            setSelectedTextBox={setSelectedTextBox}
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
          />
          <AdvancedTextLayer
            textLayerElements={textLayerElements}
            setTextLayerElements={setTextLayerElements}
            currentPage={currentPage}
            pdfDocument={pdfDocument}
            canvasRef={canvasRef}
            zoom={zoom / 100}
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
            setOcrResults={setOcrResults}
            onOCRTextExtract={handleOCRTextExtract}
          />
          <FillableFormLayer
            detectedFormFields={detectedFormFields}
            setDetectedFormFields={setDetectedFormFields}
            formFields={formFields}
            setFormFields={setFormFields}
            currentPage={currentPage}
            pdfDocument={pdfDocument}
            onFormDataSave={handleFormDataSave}
            onFieldsDetected={handleFormFieldsDetected}
          />

          {/* Tool Overlays / Dialogs */}
          <FontManager
            fontList={availableFontList}
            onFontSelect={setSelectedFont}
            selectedFont={selectedFont}
            onFontLoad={loadGoogleFont}
            loadingFonts={loadingFonts}
            loadMoreFonts={loadMoreFonts}
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
            onFormFieldAdd={addFormField}
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
