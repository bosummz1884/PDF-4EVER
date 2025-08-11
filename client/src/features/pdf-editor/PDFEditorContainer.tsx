// src/features/pdf-editor/PDFEditorContainer.tsx

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import {
  Upload, Save, Undo, Redo, ZoomIn, ZoomOut, Maximize, FileText
} from "lucide-react";
import { usePDFEditor } from "./PDFEditorContext";
import { useToast } from "../hooks/use-toast";
import { ToolType, TextRegion, Annotation, WhiteoutBlock, TextElement, ImageElement } from "../../types/pdf-types";

// Import All Layers and Panels
import { TextExtractionLayer } from "../components/layers/TextExtractionLayer";
import AdvancedTextLayer from "../components/layers/AdvancedTextLayer";
import ImageLayer from "../components/layers/ImageLayer";
import { InlineTextEditor } from "../components/InlineTextEditor";
import { FontRecognitionPanel } from "../../components/tool-panels/FontRecognitionPanel";
import { FontStylePanel } from "../../components/tool-panels/FontStylePanel";
import { toolRegistry } from "./toolRegistry";

// Import All Services
import { fontRecognitionService } from "../../services/fontRecognitionService";
import { textExtractionService } from "../../services/textExtractionService";

export default function PDFEditorContainer() {
  const { state, dispatch, canvasRef, fileInputRef, loadPDF, renderPage, savePDF } = usePDFEditor();
  const { toast } = useToast();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [drawingShape, setDrawingShape] = useState<Partial<Annotation> | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [currentFontStyle, setCurrentFontStyle] = useState({
    fontFamily: "Arial",
    fontSize: 14,
    fontWeight: "normal" as "normal" | "bold",
    fontStyle: "normal" as "normal" | "italic",
    textColor: "#000000",
    textAlign: "left" as "left" | "center" | "right" | "justify",
  });

  const {
    currentPage, totalPages, pdfDocument, currentTool, toolSettings, scale, rotation,
    historyIndex, history, inlineEditingRegion, fileName,
    extractedTextRegions, detectedFonts, annotations, textElements, imageElements, whiteoutBlocks,
    selectedElementId
  } = state;

  const currentPageTextRegions = React.useMemo(() => extractedTextRegions[currentPage] || [], [extractedTextRegions, currentPage]);
  const allDetectedFonts = React.useMemo(() => Object.values(detectedFonts).flat(), [detectedFonts]);
  const currentPageAnnotations = React.useMemo(() => annotations[currentPage] || [], [annotations, currentPage]);
  const currentPageTextElements = React.useMemo(() => textElements[currentPage] || [], [textElements, currentPage]);
  const currentPageImageElements = React.useMemo(() => imageElements[currentPage] || [], [imageElements, currentPage]);
  const currentPageWhiteoutBlocks = React.useMemo(() => whiteoutBlocks[currentPage] || [], [whiteoutBlocks, currentPage]);

  useEffect(() => {
    if (pdfDocument) {
      renderPage();
    }
  }, [pdfDocument, currentPage, scale, rotation, renderPage]);

  useEffect(() => {
    if (pdfDocument && currentPageTextRegions.length === 0 && currentTool === 'inlineEdit') {
      analyzeCurrentPage();
    }
  }, [pdfDocument, currentPage, currentTool]);

  const getCanvasCoordinates = useCallback((event: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / scale,
      y: (event.clientY - rect.top) / scale,
    };
  }, [scale, canvasRef]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      await loadPDF(file);
      toast({ title: "PDF Loaded", description: `Successfully loaded ${file.name}` });
    }
    if(event.target) event.target.value = ''; // Allow re-uploading the same file
  }, [loadPDF, toast]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const src = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
            const newImageElement: ImageElement = {
                id: `image-${Date.now()}`, page: currentPage, src, x: 100, y: 100,
                width: img.width > 200 ? 200 : img.width,
                height: img.width > 200 ? (img.height * 200 / img.width) : img.height,
                rotation: 0, opacity: 1
            };
            dispatch({ type: 'ADD_IMAGE_ELEMENT', payload: { page: currentPage, element: newImageElement } });
            dispatch({ type: 'SAVE_TO_HISTORY' });
        }
        img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [currentPage, dispatch]);


  const analyzeCurrentPage = useCallback(async () => {
    if (!pdfDocument) return;
    setIsAnalyzing(true);
    setAnalysisProgress(30);
    try {
      const textRegions = await textExtractionService.extractTextRegions(pdfDocument, currentPage);
      setAnalysisProgress(60);
      const fontResult = await fontRecognitionService.analyzePageFonts(pdfDocument, currentPage);
      dispatch({ type: "SET_EXTRACTED_TEXT_REGIONS", payload: { page: currentPage, regions: textRegions }});
      dispatch({ type: "SET_DETECTED_FONTS", payload: { page: currentPage, fonts: fontResult.fonts }});
      setAnalysisProgress(100);
      toast({ title: "Page Analyzed", description: `Found ${fontResult.fonts.length} fonts and ${textRegions.length} text regions.` });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({ title: "Analysis Failed", description: "Could not analyze this page.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  }, [pdfDocument, currentPage, dispatch, toast]);

  const handleToolSelect = (toolId: ToolType) => {
    dispatch({ type: "SET_CURRENT_TOOL", payload: toolId });
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".react-rnd, .inline-text-editor, .text-region-overlay")) return;
    if (currentTool === 'image' && imageInputRef.current) { imageInputRef.current.click(); return; }

    const coords = getCanvasCoordinates(e);
    setStartPoint(coords);
    const settings = toolSettings[currentTool];

    if (["rectangle", "circle", "highlight", "whiteout", "line", "freeform"].includes(currentTool)) {
      const newShape: Partial<Annotation> = {
        type: currentTool, page: currentPage, x: coords.x, y: coords.y, ...settings,
        width: 0, height: 0, points: currentTool === 'freeform' ? [{ x: coords.x, y: coords.y }] : undefined,
        strokeColor: currentTool === 'freeform' ? settings.color : settings.strokeColor,
        strokeWidth: currentTool === 'freeform' ? settings.brushSize : settings.strokeWidth,
      };
      setDrawingShape(newShape);
    }
  }, [currentPage, currentTool, toolSettings, scale, getCanvasCoordinates]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!startPoint) return;
    const coords = getCanvasCoordinates(e);

    if (currentTool === 'freeform' && drawingShape) {
       setDrawingShape(prev => ({ ...prev, points: [...(prev?.points || []), { x: coords.x, y: coords.y }] }));
    } else if (drawingShape) {
       setDrawingShape({ ...drawingShape, x: Math.min(startPoint.x, coords.x), y: Math.min(startPoint.y, coords.y), width: Math.abs(startPoint.x - coords.x), height: Math.abs(startPoint.y - coords.y) });
    }
  }, [startPoint, drawingShape, currentTool, getCanvasCoordinates]);

  const handleMouseUp = useCallback(() => {
    if (currentTool === 'text' && startPoint && (!drawingShape || (drawingShape.width === 0 && drawingShape.height === 0))) {
      const newTextElement: TextElement = { id: `text-${Date.now()}`, page: currentPage, text: "New Text", x: startPoint.x, y: startPoint.y, width: 200, height: 20, ...toolSettings.text, bold: false, italic: false, underline: false, rotation: 0, lineHeight: 1.2, textAlign: 'left', color: '#000000', fontFamily: 'Arial', fontSize: 16 };
      dispatch({ type: 'ADD_TEXT_ELEMENT', payload: { page: currentPage, element: newTextElement } });
      dispatch({ type: 'SAVE_TO_HISTORY' });
    } else if (drawingShape && startPoint) {
      const finalShape = { ...drawingShape, id: `${drawingShape.type}-${Date.now()}` } as Annotation;
      if ((finalShape.width || 0) > 2 || (finalShape.height || 0) > 2 || (finalShape.points?.length || 0) > 1) {
        if (finalShape.type === 'whiteout') {
          dispatch({ type: 'ADD_WHITEOUT_BLOCK', payload: { page: currentPage, block: finalShape as WhiteoutBlock }});
        } else {
          dispatch({ type: 'ADD_ANNOTATION', payload: { page: currentPage, annotation: finalShape } });
        }
        dispatch({ type: 'SAVE_TO_HISTORY' });
      }
    }
    setDrawingShape(null);
    setStartPoint(null);
  }, [drawingShape, startPoint, dispatch, currentPage, currentTool, toolSettings]);

  const handleTextRegionClick = (region: TextRegion) => {
    if (currentTool === "inlineEdit") {
      dispatch({ type: "SET_INLINE_EDITING_REGION", payload: region });
      setCurrentFontStyle({
        fontFamily: region.originalFontInfo?.fontFamily || "Arial",
        fontSize: region.fontSize,
        fontWeight: region.fontWeight,
        fontStyle: region.fontStyle,
        textColor: region.color,
        textAlign: "left"
      });
    }
  };

  const handleInlineTextSave = (newText: string) => {
    if (!inlineEditingRegion) return;
    const whiteoutBlock: WhiteoutBlock = { id: `whiteout-for-${inlineEditingRegion.id}`, page: currentPage, x: inlineEditingRegion.x, y: inlineEditingRegion.y, width: inlineEditingRegion.width, height: inlineEditingRegion.height, color: '#FFFFFF' };
    const newTextElement: TextElement = {
        id: `text-from-region-${inlineEditingRegion.id}`, page: currentPage, text: newText, x: inlineEditingRegion.x,
        y: inlineEditingRegion.y, width: inlineEditingRegion.width, height: inlineEditingRegion.height,
        fontFamily: currentFontStyle.fontFamily, fontSize: currentFontStyle.fontSize, color: currentFontStyle.textColor,
        bold: currentFontStyle.fontWeight === 'bold', italic: currentFontStyle.fontStyle === 'italic',
        underline: false, textAlign: currentFontStyle.textAlign, lineHeight: 1.2, rotation: inlineEditingRegion.rotation,
    };
    dispatch({ type: 'ADD_WHITEOUT_BLOCK', payload: { page: currentPage, block: whiteoutBlock } });
    dispatch({ type: 'ADD_TEXT_ELEMENT', payload: { page: currentPage, element: newTextElement } });
    dispatch({ type: 'SET_INLINE_EDITING_REGION', payload: null });
    dispatch({ type: 'SAVE_TO_HISTORY' });
    toast({ title: "Text Updated", description: "Original text has been covered and new text added." });
  };

  const handleInlineTextCancel = () => { dispatch({ type: "SET_INLINE_EDITING_REGION", payload: null }); };
  
  const handleZoom = (direction: 'in' | 'out' | 'fit') => {
      const newScale = direction === 'in' ? Math.min(scale * 1.25, 3.0) : direction === 'out' ? Math.max(scale * 0.8, 0.25) : 1.0;
      dispatch({ type: "SET_SCALE", payload: newScale });
  };

  const ActiveToolPanel = toolRegistry[currentTool]?.component;

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">PDF4EVER</h1>
          <Separator orientation="vertical" className="h-6" />
          <Button size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" /> Upload PDF
          </Button>
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
          <input ref={imageInputRef} type="file" accept="image/png, image/jpeg" onChange={handleImageUpload} className="hidden" />
        </div>
        {fileName && ( <div className="text-sm text-muted-foreground">{fileName} ({currentPage}/{totalPages})</div> )}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => dispatch({ type: "UNDO" })} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)"> <Undo className="h-4 w-4" /> </Button>
          <Button variant="ghost" size="sm" onClick={() => dispatch({ type: "REDO" })} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Y)"> <Redo className="h-4 w-4" /> </Button>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <Button onClick={savePDF} disabled={!pdfDocument}> <Save className="h-4 w-4 mr-2" /> Save PDF </Button>
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 bg-white border-r flex flex-col">
           <div className="p-4 border-b">
             <h2 className="text-sm font-semibold mb-3">Tools</h2>
             <div className="grid grid-cols-4 gap-2">
               {Object.values(toolRegistry).map((tool) => (
                 <Button key={tool.name} variant={currentTool === tool.name ? "default" : "outline"} size="icon" className="h-14 w-14 flex-col gap-1 text-xs" title={tool.label} onClick={() => handleToolSelect(tool.name)}>
                   {tool.icon} <span>{tool.label}</span>
                 </Button>
               ))}
             </div>
           </div>
           <div className="flex-1 overflow-y-auto p-4">
            {currentTool === 'inlineEdit' ? (
              <FontRecognitionPanel detectedFonts={allDetectedFonts} isAnalyzing={isAnalyzing} analysisProgress={analysisProgress} onFontMappingChange={() => {}} settings={{ autoFontMatch: true, useFallbackFonts: true, showFontWarnings: false, realTimePreview: true }} onSettingsChange={() => {}} />
            ) : ActiveToolPanel ? (
              <ActiveToolPanel settings={toolSettings[currentTool]} onSettingChange={(key, value) => dispatch({ type: 'UPDATE_TOOL_SETTING', payload: { toolId: currentTool, key, value }})} editorState={state} />
            ) : <p className="text-xs text-muted-foreground">Select a tool to see its options.</p>}
           </div>
           {(currentTool === "inlineEdit" || currentTool === "text") && (
             <div className="p-4 border-t">
               <FontStylePanel 
                 selectedFont={currentFontStyle.fontFamily}
                 fontSize={currentFontStyle.fontSize}
                 fontWeight={currentFontStyle.fontWeight}
                 fontStyle={currentFontStyle.fontStyle}
                 textColor={currentFontStyle.textColor}
                 textAlign={currentFontStyle.textAlign}
                 onFontChange={font => setCurrentFontStyle(s => ({...s, fontFamily: font}))} 
                 onFontSizeChange={size => setCurrentFontStyle(s => ({...s, fontSize: size}))} 
                 onFontWeightChange={weight => setCurrentFontStyle(s => ({...s, fontWeight: weight}))} 
                 onFontStyleChange={style => setCurrentFontStyle(s => ({...s, fontStyle: style}))} 
                 onTextColorChange={color => setCurrentFontStyle(s => ({...s, textColor: color}))} 
                 onTextAlignChange={align => setCurrentFontStyle(s => ({...s, textAlign: align}))} 
                 detectedFonts={allDetectedFonts} 
                />
             </div>
           )}
        </aside>
        <main className="flex-1 flex items-center justify-center overflow-auto p-8 bg-gray-100" onMouseUp={handleMouseUp}>
          {pdfDocument ? (
            <div className="relative shadow-2xl" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}>
              <canvas ref={canvasRef} className="block" />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 pointer-events-none">
                  {currentPageAnnotations.map(ann => <div key={ann.id} style={{ position: 'absolute', left: ann.x * scale, top: ann.y * scale, width: (ann.width || 0) * scale, height: (ann.height || 0) * scale, border: `${ann.strokeWidth || 1}px solid ${ann.strokeColor || ann.color}`, backgroundColor: ann.fillColor, opacity: ann.opacity, borderRadius: ann.type === 'circle' ? '50%' : `${ann.cornerRadius || 0}px` }} />)}
                  {currentPageWhiteoutBlocks.map(block => <div key={block.id} style={{ position: 'absolute', left: block.x * scale, top: block.y * scale, width: block.width * scale, height: block.height * scale, backgroundColor: block.color || '#FFFFFF' }} />)}
                  {drawingShape && <div style={{ position: 'absolute', left: drawingShape.x! * scale, top: drawingShape.y! * scale, width: drawingShape.width! * scale, height: drawingShape.height! * scale, border: '2px dashed #3B82F6', backgroundColor: '#3B82F630', borderRadius: drawingShape.type === 'circle' ? '50%' : `${drawingShape.cornerRadius || 0}px` }} />}
                </div>
                <AdvancedTextLayer textElements={currentPageTextElements} selectedElementId={selectedElementId} scale={scale} page={currentPage} dispatch={dispatch} />
                <ImageLayer imageElements={currentPageImageElements} selectedElementId={selectedElementId} scale={scale} page={currentPage} dispatch={dispatch} />
                <TextExtractionLayer page={currentPage} textRegions={currentPageTextRegions} scale={scale} rotation={rotation} onRegionClick={handleTextRegionClick} showRegions={currentTool === "inlineEdit"} />
              </div>
              {inlineEditingRegion && <InlineTextEditor textRegion={inlineEditingRegion} onSave={handleInlineTextSave} onCancel={handleInlineTextCancel} scale={scale} rotation={rotation} />}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/80 backdrop-blur-sm shadow-lg rounded-lg border p-2">
                <Button variant="ghost" size="sm" onClick={() => handleZoom('out')} title="Zoom Out"> <ZoomOut className="h-4 w-4" /> </Button>
                <span className="text-sm font-medium min-w-12 text-center">{Math.round(scale * 100)}%</span>
                <Button variant="ghost" size="sm" onClick={() => handleZoom('in')} title="Zoom In"> <ZoomIn className="h-4 w-4" /> </Button>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <Button variant="ghost" size="sm" onClick={() => handleZoom('fit')} title="Fit to Page"> <Maximize className="h-4 w-4" /> </Button>
              </div>
            </div>
          ) : (
            <Card className="w-full max-w-md"><CardContent className="pt-6 text-center"><FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3>No PDF Loaded</h3><p className="text-muted-foreground">Upload a PDF file to get started.</p><Button className="mt-4" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4 mr-2" />Upload PDF</Button></CardContent></Card>
          )}
        </main>
      </div>
    </div>
  );
}