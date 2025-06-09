import React, { useRef, useState, useEffect, useCallback } from 'react';
import { pdfjsLib, initializeWorker } from '@/lib/pdfWorker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, Upload, Type, Edit3, Highlighter, Square, Circle, 
  ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, ChevronDown,
  Undo, Redo, MousePointer, Trash2, Settings, Eye, EyeOff,
  Palette, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  FileText, Save, Plus, Minus, ArrowUp, ArrowDown, X,
  Split, Merge, FormInput, Signature, Calendar, Mail, Phone, Eraser, Copy,
  Image as ImageIcon
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChromePicker } from 'react-color';
// Consolidated components now used instead of individual ones
import TextBoxManager from './TextBoxManager';
import AnnotationManager from './AnnotationManager';
import FontManager from './FontManager';
import OCRProcessor from './OCRProcessor';
import PDFToolkit from './PDFToolkit';
import FillablePDFViewer from './FillablePDFViewer';
import type { TextBox } from './TextBoxManager';
import type { Annotation as AnnotationType } from './AnnotationManager';
import WhiteoutLayer, { type WhiteoutBlock } from './WhiteoutLayer';
import TextLayer from './TextLayer';

import { getAvailableFontNames } from '@/lib/loadFonts';
import { hexToRgbNormalized } from '@/lib/colorUtils';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as PDFUtils from '@/lib/ConsolidatedPDFUtils';
import Draggable from 'react-draggable';

interface TextElement {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  page: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  rotation: number;
}

interface Annotation {
  id: string;
  type: 'highlight' | 'rectangle' | 'circle' | 'freeform' | 'signature' | 'checkmark' | 'x-mark' | 'line' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
  page: number;
  text?: string;
  font?: string;
  imageData?: string;
  imageName?: string;
}

interface FormField {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  fieldName: string;
  value?: string;
  options?: string[];
}

interface ComprehensivePDFEditorProps {
  className?: string;
}

export default function ComprehensivePDFEditor({ className }: ComprehensivePDFEditorProps) {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeFileInputRef = useRef<HTMLInputElement>(null);
  
  // Core PDF state
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [originalFileData, setOriginalFileData] = useState<Uint8Array | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [renderingError, setRenderingError] = useState<string | null>(null);

  // Tools and modes
  const [currentTool, setCurrentTool] = useState<'select' | 'text' | 'highlight' | 'rectangle' | 'circle' | 'freeform' | 'form' | 'signature' | 'eraser' | 'checkmark' | 'x-mark' | 'line' | 'image'>('select');
  const [activeMode, setActiveMode] = useState<'edit' | 'merge' | 'split' | 'forms' | 'fill'>('edit');
  const [selectedShape, setSelectedShape] = useState<'rectangle' | 'circle' | 'checkmark' | 'x-mark'>('rectangle');
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [showHighlightDropdown, setShowHighlightDropdown] = useState(false);
  const [highlightColor, setHighlightColor] = useState('#FFFF00');
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{x: number, y: number} | null>(null);
  
  // Line tool state
  const [lineStrokeWidth, setLineStrokeWidth] = useState(2);
  const [showLineDropdown, setShowLineDropdown] = useState(false);
  const [lineColor, setLineColor] = useState('#000000');
  const [currentDrawStart, setCurrentDrawStart] = useState<{x: number, y: number} | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null);
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Signature state
  const [signatureName, setSignatureName] = useState('');
  const [signatureFont, setSignatureFont] = useState('Dancing Script');
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  
  // Text editing state
  const [textElements, setTextElements] = useState<{ [page: number]: TextElement[] }>({});
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  
  // Text properties
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [fontSize, setFontSize] = useState(14);
  const [textColor, setTextColor] = useState('#000000');
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('normal');
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>('normal');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  
  // Text box manager refs and state
  const textBoxManagerRef = useRef<any>(null);
  const [textBoxCount, setTextBoxCount] = useState(0);
  const [hasSelectedTextBox, setHasSelectedTextBox] = useState(false);
  
  // Annotation state
  const [annotations, setAnnotations] = useState<AnnotationType[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [annotationColor, setAnnotationColor] = useState('#ffff00');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [eraserSize, setEraserSize] = useState(20);
  
  // Form fields state
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [selectedFormFieldId, setSelectedFormFieldId] = useState<string | null>(null);
  const [newFieldType, setNewFieldType] = useState<'text' | 'textarea' | 'checkbox' | 'dropdown' | 'signature' | 'date' | 'email' | 'phone'>('text');
  
  // Text box manager state
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [showTextBoxManager, setShowTextBoxManager] = useState(false);
  
  // Managers state
  const [showAnnotationManager, setShowAnnotationManager] = useState(false);
  
  // Whiteout tool state
  const [whiteoutMode, setWhiteoutMode] = useState(false);
  const [whiteoutBlocks, setWhiteoutBlocks] = useState<WhiteoutBlock[]>([]);
  

  
  // Text layer state
  const [textLayerElements, setTextLayerElements] = useState<any[]>([]);
  
  // Sync whiteout mode with tool selection
  useEffect(() => {
    if (currentTool !== 'select' && whiteoutMode) {
      setWhiteoutMode(false);
    }
  }, [currentTool, whiteoutMode]);


  
  // Fillable PDF state
  const [detectedFormFields, setDetectedFormFields] = useState<any[]>([]);
  
  // Merge/Split state
  const [mergeFiles, setMergeFiles] = useState<any[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  
  // Display state
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showTextElements, setShowTextElements] = useState(true);
  const [showFormFields, setShowFormFields] = useState(true);
  
  // History for undo/redo
  const [history, setHistory] = useState<any[]>([{
    annotations: [],
    textElements: {},
    formFields: [],
    textBoxes: [],
    whiteoutBlocks: [],
    textLayerElements: []
  }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Handle file upload
  // Image upload handler
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setSelectedImage(imageData);
      setImageName(file.name);
      setCurrentTool('image');
      console.log('Image loaded, ready to place');
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      try {
        setIsLoading(true);
        setRenderingError(null);
        setFileName(file.name);

        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        setOriginalFileData(uint8Array);

        await initializeWorker();
        const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
        
        loadingTask.onProgress = (progress: any) => {
          const percent = (progress.loaded / progress.total) * 100;
          console.log(`Loading progress: ${Math.round(percent)}%`);
        };

        const pdf = await loadingTask.promise;
        console.log('PDF.js loaded successfully, pages:', pdf.numPages);
        
        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        
        // Render first page
        await renderPage(pdf, 1);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setRenderingError('Failed to load PDF. Please try a different file.');
      } finally {
        setIsLoading(false);
      }
    } else {
      alert('Please select a valid PDF file');
    }
  };

  // Render PDF page
  const renderPage = async (pdf: any, pageNumber: number) => {
    if (!canvasRef.current || !annotationCanvasRef.current) return;

    try {
      console.log(`Rendering page ${pageNumber} at ${zoom}% zoom...`);
      const page = await pdf.getPage(pageNumber);
      const scale = zoom / 100;
      const viewport = page.getViewport({ scale, rotation });

      const canvas = canvasRef.current;
      const annotationCanvas = annotationCanvasRef.current;
      const context = canvas.getContext('2d');
      const annotationContext = annotationCanvas.getContext('2d');

      if (!context || !annotationContext) return;

      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      annotationCanvas.height = viewport.height;
      annotationCanvas.width = viewport.width;

      // Set display size for proper scaling
      const containerElement = canvas.parentElement;
      if (containerElement) {
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        annotationCanvas.style.width = `${viewport.width}px`;
        annotationCanvas.style.height = `${viewport.height}px`;
      }

      console.log(`Starting render for page ${pageNumber} - Canvas: ${canvas.width}x${canvas.height}, Scale: ${scale}`);

      // Clear previous content
      context.clearRect(0, 0, canvas.width, canvas.height);
      annotationContext.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);

      // Cancel previous render task if exists
      if ((canvas as any).currentRenderTask) {
        (canvas as any).currentRenderTask.cancel();
      }

      // Render PDF page
      const renderTask = page.render({
        canvasContext: context,
        viewport: viewport
      });

      (canvas as any).currentRenderTask = renderTask;

      await renderTask.promise;
      console.log(`Page ${pageNumber} rendered successfully`);
      (canvas as any).currentRenderTask = null;
    } catch (error: any) {
      if (error?.name !== 'RenderingCancelledException') {
        console.error(`Error rendering page ${pageNumber}:`, error);
        setRenderingError(`Failed to render page ${pageNumber}`);
      }
    }
  };

  // Annotation drawing functions
  const startDrawing = useRef(false);
  const currentAnnotation = useRef<Annotation | null>(null);

  const handleAnnotationStart = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!annotationCanvasRef.current || currentTool === 'select' || currentTool === 'text' || currentTool === 'eraser') return;
    
    console.log('Starting annotation with tool:', currentTool);
    
    const rect = annotationCanvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    startDrawing.current = true;
    
    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      type: currentTool as any,
      x,
      y,
      width: 0,
      height: 0,
      color: currentTool === 'highlight' ? highlightColor : annotationColor,
      strokeWidth,
      page: currentPage
    };
    
    currentAnnotation.current = newAnnotation;
  };

  const handleAnnotationMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!startDrawing.current || !currentAnnotation.current || !annotationCanvasRef.current) return;
    
    const rect = annotationCanvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const annotation = currentAnnotation.current;
    annotation.width = x - annotation.x;
    annotation.height = y - annotation.y;
    
    drawAnnotations();
  };

  const handleAnnotationEnd = () => {
    if (!startDrawing.current || !currentAnnotation.current) return;
    
    startDrawing.current = false;
    
    // Only add annotation if it has some size
    if (Math.abs(currentAnnotation.current.width) > 5 || Math.abs(currentAnnotation.current.height) > 5) {
      setAnnotations(prev => [...prev, currentAnnotation.current!]);
      saveToHistory();
    }
    
    currentAnnotation.current = null;
  };

  const drawAnnotations = useCallback(() => {
    if (!annotationCanvasRef.current) return;
    
    const canvas = annotationCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw existing annotations for current page
    const pageAnnotations = annotations.filter(a => a && a.page === currentPage);
    pageAnnotations.forEach(annotation => {
      if (!annotation || !annotation.color) return;
      
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = annotation.strokeWidth || 1;
      ctx.fillStyle = annotation.color + '40'; // Add transparency
      
      if (annotation.type === 'rectangle') {
        ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
      } else if (annotation.type === 'circle') {
        const centerX = annotation.x + annotation.width / 2;
        const centerY = annotation.y + annotation.height / 2;
        const radius = Math.min(Math.abs(annotation.width), Math.abs(annotation.height)) / 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (annotation.type === 'checkmark') {
        // Draw checkmark
        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = annotation.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const centerX = annotation.x + annotation.width / 2;
        const centerY = annotation.y + annotation.height / 2;
        const size = Math.min(annotation.width, annotation.height) * 0.4;
        
        ctx.beginPath();
        ctx.moveTo(centerX - size * 0.5, centerY);
        ctx.lineTo(centerX - size * 0.1, centerY + size * 0.4);
        ctx.lineTo(centerX + size * 0.6, centerY - size * 0.3);
        ctx.stroke();
      } else if (annotation.type === 'x-mark') {
        // Draw X mark
        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = annotation.strokeWidth;
        ctx.lineCap = 'round';
        
        const centerX = annotation.x + annotation.width / 2;
        const centerY = annotation.y + annotation.height / 2;
        const size = Math.min(annotation.width, annotation.height) * 0.4;
        
        ctx.beginPath();
        ctx.moveTo(centerX - size, centerY - size);
        ctx.lineTo(centerX + size, centerY + size);
        ctx.moveTo(centerX + size, centerY - size);
        ctx.lineTo(centerX - size, centerY + size);
        ctx.stroke();
      } else if (annotation.type === 'highlight') {
        // Draw transparent highlight
        ctx.fillStyle = annotation.color + '40'; // 25% opacity
        ctx.fillRect(annotation.x, annotation.y, annotation.width, annotation.height);
        // Add subtle border
        ctx.strokeStyle = annotation.color + '80'; // 50% opacity
        ctx.lineWidth = 1;
        ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
      } else if (annotation.type === 'line') {
        // Draw straight line
        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = annotation.strokeWidth;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(annotation.x, annotation.y);
        ctx.lineTo(annotation.x + annotation.width, annotation.y + annotation.height);
        ctx.stroke();
        
        // Draw selection handles if this annotation is selected
        if (selectedAnnotation === annotation.id) {
          const handleSize = 6;
          ctx.fillStyle = '#0066cc';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          
          // Corner handles
          const handles = [
            { x: annotation.x - handleSize/2, y: annotation.y - handleSize/2 }, // top-left
            { x: annotation.x + annotation.width - handleSize/2, y: annotation.y - handleSize/2 }, // top-right
            { x: annotation.x - handleSize/2, y: annotation.y + annotation.height - handleSize/2 }, // bottom-left
            { x: annotation.x + annotation.width - handleSize/2, y: annotation.y + annotation.height - handleSize/2 }, // bottom-right
          ];
          
          handles.forEach(handle => {
            ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
            ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
          });
        }
      } else if (annotation.type === 'signature') {
        // Draw signature text
        ctx.fillStyle = annotation.color;
        const fontFamily = (annotation as any).font || 'Dancing Script';
        ctx.font = `20px "${fontFamily}", cursive`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        if (annotation.text) {
          ctx.fillText(annotation.text, annotation.x, annotation.y + annotation.height / 2);
        }
      } else if (annotation.type === 'image') {
        // Draw image annotation
        const imageAnnotation = annotation as any;
        if (imageAnnotation.imageData) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, annotation.x, annotation.y, annotation.width, annotation.height);
            
            // Draw selection handles if this image is selected
            if (selectedAnnotation === annotation.id) {
              const handleSize = 8;
              ctx.fillStyle = '#0066cc';
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              
              // Corner handles for resizing
              const handles = [
                { x: annotation.x - handleSize/2, y: annotation.y - handleSize/2 }, // nw
                { x: annotation.x + annotation.width - handleSize/2, y: annotation.y - handleSize/2 }, // ne
                { x: annotation.x - handleSize/2, y: annotation.y + annotation.height - handleSize/2 }, // sw
                { x: annotation.x + annotation.width - handleSize/2, y: annotation.y + annotation.height - handleSize/2 }, // se
              ];
              
              handles.forEach(handle => {
                ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
                ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
              });
              
              // Draw selection border
              ctx.strokeStyle = '#0066cc';
              ctx.lineWidth = 2;
              ctx.setLineDash([5, 5]);
              ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
              ctx.setLineDash([]);
            }
          };
          img.src = imageAnnotation.imageData;
        }
      }
    });
    
    // Draw line preview when drawing
    if (isDrawingLine && currentDrawStart && mousePosition && currentTool === 'line') {
      console.log('Drawing line preview from', currentDrawStart, 'to', mousePosition);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineStrokeWidth;
      ctx.lineCap = 'round';
      ctx.setLineDash([5, 5]); // Dashed line for preview
      
      ctx.beginPath();
      ctx.moveTo(currentDrawStart.x, currentDrawStart.y);
      ctx.lineTo(mousePosition.x, mousePosition.y);
      ctx.stroke();
      
      ctx.setLineDash([]); // Reset to solid line
      
      // Show start point
      ctx.fillStyle = lineColor;
      ctx.fillRect(currentDrawStart.x - 3, currentDrawStart.y - 3, 6, 6);
    }

    // Draw current annotation being drawn
    if (currentAnnotation.current && startDrawing.current) {
      const annotation = currentAnnotation.current;
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = annotation.strokeWidth;
      ctx.fillStyle = annotation.color + '40';
      
      if (annotation.type === 'rectangle') {
        ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
      } else if (annotation.type === 'highlight') {
        ctx.fillRect(annotation.x, annotation.y, annotation.width, annotation.height);
      } else if (annotation.type === 'circle') {
        const centerX = annotation.x + annotation.width / 2;
        const centerY = annotation.y + annotation.height / 2;
        const radius = Math.min(Math.abs(annotation.width), Math.abs(annotation.height)) / 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (annotation.type === 'checkmark') {
        // Draw checkmark preview
        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = annotation.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const centerX = annotation.x + annotation.width / 2;
        const centerY = annotation.y + annotation.height / 2;
        const size = Math.min(Math.abs(annotation.width), Math.abs(annotation.height)) * 0.4;
        
        ctx.beginPath();
        ctx.moveTo(centerX - size * 0.5, centerY);
        ctx.lineTo(centerX - size * 0.1, centerY + size * 0.4);
        ctx.lineTo(centerX + size * 0.6, centerY - size * 0.3);
        ctx.stroke();
      } else if (annotation.type === 'x-mark') {
        // Draw X mark preview
        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = annotation.strokeWidth;
        ctx.lineCap = 'round';
        
        const centerX = annotation.x + annotation.width / 2;
        const centerY = annotation.y + annotation.height / 2;
        const size = Math.min(Math.abs(annotation.width), Math.abs(annotation.height)) * 0.4;
        
        ctx.beginPath();
        ctx.moveTo(centerX - size, centerY - size);
        ctx.lineTo(centerX + size, centerY + size);
        ctx.moveTo(centerX + size, centerY - size);
        ctx.lineTo(centerX - size, centerY + size);
        ctx.stroke();
      }
    }
  }, [annotations, currentPage, annotationColor, strokeWidth, selectedAnnotation, isDrawingLine, currentDrawStart, mousePosition, currentTool, lineColor, lineStrokeWidth]);

  // Re-draw annotations whenever they change
  useEffect(() => {
    if (annotations.length > 0) {
      console.log('Redrawing annotations after change:', annotations.length);
      drawAnnotations();
    }
  }, [annotations, drawAnnotations]);

  // History functions
  const saveToHistory = useCallback(() => {
    const state = {
      annotations: [...annotations],
      textElements: { ...textElements },
      formFields: [...formFields]
    };
    
    console.log('Saving to history:', state);
    console.log('Current historyIndex before save:', historyIndex);
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(state);
      const trimmedHistory = newHistory.slice(-50); // Keep last 50 states
      console.log('New history length:', trimmedHistory.length);
      return trimmedHistory;
    });
    
    setHistoryIndex(prev => {
      const newIndex = prev + 1;
      console.log('New historyIndex:', newIndex);
      return newIndex;
    });
  }, [annotations, textElements, formFields, historyIndex]);

  // Save to history when any editable state changes (exclude historyIndex from deps)
  const previousStateRef = useRef<string>('');
  const [isUndoRedoInProgress, setIsUndoRedoInProgress] = useState(false);
  
  useEffect(() => {
    // Skip auto-save during undo/redo operations
    if (isUndoRedoInProgress) return;
    
    const currentState = JSON.stringify({
      annotations,
      textElements,
      formFields,
      textBoxes,
      whiteoutBlocks,
      textLayerElements
    });
    
    // Only save if state actually changed and we have some content
    if (currentState !== previousStateRef.current && 
        (annotations.length > 0 || Object.keys(textElements).length > 0 || formFields.length > 0 || 
         textBoxes.length > 0 || whiteoutBlocks.length > 0 || textLayerElements.length > 0)) {
      
      previousStateRef.current = currentState;
      
      const state = {
        annotations: [...annotations],
        textElements: { ...textElements },
        formFields: [...formFields],
        textBoxes: [...textBoxes],
        whiteoutBlocks: [...whiteoutBlocks],
        textLayerElements: [...textLayerElements]
      };
      
      console.log('Auto-saving to history:', state);
      
      setHistory(prev => {
        const newHistory = [...prev, state];
        const trimmedHistory = newHistory.slice(-50);
        console.log('Auto-save history length:', trimmedHistory.length);
        return trimmedHistory;
      });
      
      setHistoryIndex(prev => {
        const newIndex = Math.min(prev + 1, 49); // Cap at 49 since we keep max 50 items (0-49 index)
        console.log('Auto-save new historyIndex:', newIndex);
        return newIndex;
      });
    }
  }, [annotations, textElements, formFields, textBoxes, whiteoutBlocks, textLayerElements, isUndoRedoInProgress]);

  const undo = useCallback(() => {
    console.log('Undo clicked, historyIndex:', historyIndex, 'history length:', history.length);
    if (historyIndex > 0 && history[historyIndex - 1]) {
      setIsUndoRedoInProgress(true);
      const previousState = history[historyIndex - 1];
      console.log('Undoing to state:', previousState);
      setAnnotations(previousState.annotations || []);
      setTextElements(previousState.textElements || {});
      setFormFields(previousState.formFields || []);
      setTextBoxes(previousState.textBoxes || []);
      setWhiteoutBlocks(previousState.whiteoutBlocks || []);
      setTextLayerElements(previousState.textLayerElements || []);
      setHistoryIndex(prev => prev - 1);
      setTimeout(() => {
        drawAnnotations();
        setIsUndoRedoInProgress(false);
      }, 10);
    } else {
      console.log('Cannot undo: invalid history state');
    }
  }, [history, historyIndex, drawAnnotations]);

  const redo = useCallback(() => {
    console.log('Redo clicked, historyIndex:', historyIndex, 'history length:', history.length);
    if (historyIndex < history.length - 1 && history[historyIndex + 1]) {
      setIsUndoRedoInProgress(true);
      const nextState = history[historyIndex + 1];
      console.log('Redoing to state:', nextState);
      setAnnotations(nextState.annotations || []);
      setTextElements(nextState.textElements || {});
      setFormFields(nextState.formFields || []);
      setTextBoxes(nextState.textBoxes || []);
      setWhiteoutBlocks(nextState.whiteoutBlocks || []);
      setTextLayerElements(nextState.textLayerElements || []);
      setHistoryIndex(prev => prev + 1);
      setTimeout(() => {
        drawAnnotations();
        setIsUndoRedoInProgress(false);
      }, 10);
    } else {
      console.log('Cannot redo: invalid history state');
    }
  }, [history, historyIndex, drawAnnotations]);

  // Handle eraser functionality
  const handleErase = useCallback((x: number, y: number, size: number) => {
    // Remove annotations that intersect with eraser
    setAnnotations(prev => prev.filter(annotation => {
      const distance = Math.sqrt(
        Math.pow(annotation.x - x, 2) + Math.pow(annotation.y - y, 2)
      );
      return distance > size / 2;
    }));
  }, []);

  // Handle shape placement on click
  const handleShapeClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!annotationCanvasRef.current) return;
    if (!['rectangle', 'circle', 'checkmark', 'x-mark'].includes(currentTool)) return;
    
    const canvas = annotationCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate coordinates relative to the actual canvas size, not display size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    console.log(`Placing ${currentTool} at display (${event.clientX - rect.left}, ${event.clientY - rect.top}) -> canvas (${x}, ${y})`);
    console.log('Canvas size:', canvas.width, 'x', canvas.height, 'Display size:', rect.width, 'x', rect.height);
    
    // Create shape with fixed size
    const shapeSize = 30;
    
    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      type: currentTool as any,
      x: x - shapeSize / 2,
      y: y - shapeSize / 2,
      width: shapeSize,
      height: shapeSize,
      color: '#000000',
      strokeWidth: 2,
      page: currentPage
    };
    
    console.log('Created annotation:', newAnnotation);
    
    setAnnotations(prev => {
      const updated = [...prev, newAnnotation];
      console.log('Updated annotations:', updated);
      return updated;
    });
  }, [currentTool, currentPage]);

  // Form field functions
  const addFormField = useCallback((x: number, y: number) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: newFieldType,
      x,
      y,
      width: newFieldType === 'checkbox' ? 20 : 150,
      height: newFieldType === 'textarea' ? 60 : 25,
      page: currentPage,
      fieldName: `${newFieldType}_${Date.now()}`,
      value: '',
      options: newFieldType === 'dropdown' ? ['Option 1', 'Option 2'] : []
    };
    
    setFormFields(prev => [...prev, newField]);
    saveToHistory();
  }, [newFieldType, currentPage, saveToHistory]);

  // Export PDF function with advanced text support
  const exportPDF = useCallback(async () => {
    if (!pdfDocument || !originalFileData) return;
    
    try {
      setIsLoading(true);
      
      // If we have text boxes, include them in the export
      if (textBoxes.length > 0) {
        const pdfDoc = await PDFDocument.load(originalFileData);
        const pages = pdfDoc.getPages();
        
        // Add text boxes to PDF
        for (const textBox of textBoxes) {
          const page = pages[textBox.page - 1];
          if (!page) continue;
          
          const { width: pageWidth, height: pageHeight } = page.getSize();
          
          // Convert coordinates accounting for PDF coordinate system
          const scale = zoom / 100;
          const x = textBox.x / scale;
          const y = pageHeight - (textBox.y / scale) - (textBox.height / scale);
          
          // Parse color
          const color = textBox.color.startsWith('#') 
            ? hexToRgbNormalized(textBox.color)
            : { r: 0, g: 0, b: 0 };
          
          // Get font based on selected font
          let font;
          try {
            switch (textBox.font) {
              case 'Times New Roman':
                font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
                break;
              case 'Courier New':
                font = await pdfDoc.embedFont(StandardFonts.Courier);
                break;
              case 'Helvetica':
              default:
                font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            }
          } catch {
            font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          }
          
          // Draw text with proper styling
          page.drawText(textBox.value, {
            x: Math.max(0, x),
            y: Math.max(0, y),
            size: textBox.size,
            font,
            color: rgb(color.r, color.g, color.b),
          });
        }
        
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName.replace('.pdf', '')}_with_advanced_text.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // Fallback to original export if no advanced text
        const blob = new Blob([originalFileData], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName.replace('.pdf', '')}_edited.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pdfDocument, originalFileData, fileName, textBoxes, whiteoutBlocks]);

  // Merge/Split functions
  const handleMergeFilesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    const fileData = await Promise.all(
      pdfFiles.map(async (file) => ({
        name: file.name,
        data: new Uint8Array(await file.arrayBuffer())
      }))
    );
    
    setMergeFiles(prev => [...prev, ...fileData]);
  };

  const removeMergeFile = (index: number) => {
    setMergeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveMergeFile = (fromIndex: number, toIndex: number) => {
    setMergeFiles(prev => {
      const newFiles = [...prev];
      const [removed] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, removed);
      return newFiles;
    });
  };

  const mergePDFs = async () => {
    if (mergeFiles.length < 2) return;
    
    try {
      setIsLoading(true);
      // Implementation would use PDF-lib to merge files
      console.log('Merging PDFs:', mergeFiles.map(f => f.name));
      // For now, just log the action
    } catch (error) {
      console.error('Error merging PDFs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePageSelection = (pageNum: number) => {
    setSelectedPages(prev => 
      prev.includes(pageNum) 
        ? prev.filter(p => p !== pageNum)
        : [...prev, pageNum]
    );
  };

  const splitPDF = async () => {
    if (selectedPages.length === 0) return;
    
    try {
      setIsLoading(true);
      // Implementation would use PDF-lib to split PDF
      console.log('Splitting PDF pages:', selectedPages);
      // For now, just log the action
    } catch (error) {
      console.error('Error splitting PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Canvas click handler
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('Canvas click detected! Event:', event.type);
    console.log('Current tool at click time:', currentTool);
    console.log('selectedImage exists:', !!selectedImage);
    console.log('imageName:', imageName);
    
    if (!annotationCanvasRef.current) {
      console.log('No annotation canvas ref');
      return;
    }
    
    const rect = annotationCanvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    console.log(`Canvas clicked at (${x}, ${y}), current tool: ${currentTool}`);
    console.log('Canvas rect:', rect);
    console.log('Canvas dimensions:', annotationCanvasRef.current.width, 'x', annotationCanvasRef.current.height);
    console.log('Signature name available:', signatureName);
    console.log('isDrawing state:', isDrawing);
    console.log('currentDrawStart:', currentDrawStart);
    
    // Check if clicking on an existing annotation when in select mode
    if (currentTool === 'select') {
      const pageAnnotations = annotations.filter(a => a && a.page === currentPage);
      let clickedAnnotation = null;
      
      // Check annotations in reverse order (top to bottom)
      for (let i = pageAnnotations.length - 1; i >= 0; i--) {
        const annotation = pageAnnotations[i];
        if (!annotation) continue;
        
        // Handle negative width/height for proper bounds checking
        const minX = Math.min(annotation.x, annotation.x + annotation.width);
        const maxX = Math.max(annotation.x, annotation.x + annotation.width);
        const minY = Math.min(annotation.y, annotation.y + annotation.height);
        const maxY = Math.max(annotation.y, annotation.y + annotation.height);
        
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          clickedAnnotation = annotation;
          break;
        }
      }
      
      if (clickedAnnotation) {
        setSelectedAnnotation(clickedAnnotation.id);
        console.log('Selected annotation:', clickedAnnotation.id);
      } else {
        setSelectedAnnotation(null);
        console.log('Deselected annotation');
      }
      return;
    }

    if (currentTool === 'form') {
      addFormField(x, y);
    } else if (['rectangle', 'circle', 'checkmark', 'x-mark'].includes(currentTool)) {
      console.log('Calling handleShapeClick');
      handleShapeClick(event);
    } else if (currentTool === 'line') {
      console.log('Line tool click detected!');
      console.log('isDrawingLine state:', isDrawingLine);
      console.log('currentDrawStart:', currentDrawStart);
      
      // Handle line drawing - start drawing on first click, finish on second click
      if (!isDrawingLine) {
        console.log('Starting line drawing at:', x, y);
        setIsDrawingLine(true);
        setCurrentDrawStart({ x, y });
      } else {
        console.log('Completing line from:', currentDrawStart, 'to:', { x, y });
        // Complete the line
        const newAnnotation: Annotation = {
          id: `line-${Date.now()}`,
          type: 'line',
          x: currentDrawStart!.x,
          y: currentDrawStart!.y,
          width: x - currentDrawStart!.x,
          height: y - currentDrawStart!.y,
          color: lineColor,
          strokeWidth: lineStrokeWidth,
          page: currentPage
        };
        
        console.log('Line annotation created:', newAnnotation);
        setAnnotations(prev => [...prev.filter(a => a), newAnnotation]);
        setIsDrawingLine(false);
        setCurrentDrawStart(null);
        console.log('Line completed and added to annotations');
        saveToHistory();
      }
    } else if (currentTool === 'signature') {
      console.log('Signature placement via canvas click');
      // Handle signature placement directly here
      if (!signatureName.trim()) {
        setShowSignatureDialog(true);
        return;
      }

      // Create signature annotation
      const newSignature: any = {
        id: `signature-${Date.now()}-${Math.random()}`,
        type: 'signature',
        x: x - 50, // Center the signature
        y: y - 10,
        width: 100,
        height: 20,
        color: '#000000',
        strokeWidth: 1,
        page: currentPage,
        text: signatureName,
        font: signatureFont
      };

      setAnnotations(prev => [...prev, newSignature]);
      console.log('Signature placed:', newSignature);
    } else if (currentTool === 'image') {
      console.log('Image placement via canvas click');
      if (!selectedImage) {
        console.log('No image selected, opening file dialog');
        imageInputRef.current?.click();
        return;
      }

      // Create image annotation
      const newImage: any = {
        id: `image-${Date.now()}-${Math.random()}`,
        type: 'image',
        x: x - 50, // Center the image
        y: y - 50,
        width: 100,
        height: 100,
        color: '#000000',
        strokeWidth: 1,
        page: currentPage,
        imageData: selectedImage,
        imageName: imageName
      };

      setAnnotations(prev => [...prev, newImage]);
      console.log('Image placed:', newImage);
      
      // Reset image selection after placement
      setSelectedImage(null);
      setImageName('');
      setCurrentTool('select');
    }
  }, [currentTool, addFormField, handleShapeClick, signatureName, currentPage, setAnnotations, setShowSignatureDialog, isDrawingLine, currentDrawStart, lineColor, lineStrokeWidth, saveToHistory, selectedImage, imageName]);

  // Add event handlers for annotations and signature
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('Mouse down event:', { currentTool });
    
    if (!annotationCanvasRef.current) return;
    
    const rect = annotationCanvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Handle dragging/resizing for selected annotations in select mode
    if (currentTool === 'select' && selectedAnnotation) {
      const annotation = annotations.find(a => a.id === selectedAnnotation);
      if (annotation) {
        // Check if clicking on resize handles (corner areas)
        const handleSize = 6;
        const handles = [
          { x: annotation.x - handleSize/2, y: annotation.y - handleSize/2, type: 'nw' },
          { x: annotation.x + annotation.width - handleSize/2, y: annotation.y - handleSize/2, type: 'ne' },
          { x: annotation.x - handleSize/2, y: annotation.y + annotation.height - handleSize/2, type: 'sw' },
          { x: annotation.x + annotation.width - handleSize/2, y: annotation.y + annotation.height - handleSize/2, type: 'se' },
        ];
        
        const clickedHandle = handles.find(handle => 
          x >= handle.x && x <= handle.x + handleSize && 
          y >= handle.y && y <= handle.y + handleSize
        );
        
        if (clickedHandle) {
          setResizing(clickedHandle.type);
          setDragStart({ x, y });
          console.log('Starting resize:', clickedHandle.type);
        } else if (x >= annotation.x && x <= annotation.x + annotation.width && 
                   y >= annotation.y && y <= annotation.y + annotation.height) {
          setIsDragging(true);
          setDragOffset({ x: x - annotation.x, y: y - annotation.y });
          setDragStart({ x, y });
          console.log('Starting drag');
        }
      }
    }
    
    if (currentTool === 'highlight' || currentTool === 'rectangle' || currentTool === 'circle') {
      handleAnnotationStart(event);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!annotationCanvasRef.current) return;
    
    const rect = annotationCanvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Handle dragging of selected annotations
    if (isDragging && selectedAnnotation && dragOffset) {
      const annotation = annotations.find(a => a.id === selectedAnnotation);
      if (annotation) {
        const newX = x - dragOffset.x;
        const newY = y - dragOffset.y;
        
        setAnnotations(prev => prev.map(a => 
          a.id === selectedAnnotation 
            ? { ...a, x: newX, y: newY }
            : a
        ));
      }
    }
    
    // Handle resizing of selected annotations
    if (resizing && selectedAnnotation && dragStart) {
      const annotation = annotations.find(a => a.id === selectedAnnotation);
      if (annotation) {
        const deltaX = x - dragStart.x;
        const deltaY = y - dragStart.y;
        
        let newProps: Partial<Annotation> = {};
        
        switch (resizing) {
          case 'nw':
            newProps = {
              x: annotation.x + deltaX,
              y: annotation.y + deltaY,
              width: annotation.width - deltaX,
              height: annotation.height - deltaY
            };
            break;
          case 'ne':
            newProps = {
              y: annotation.y + deltaY,
              width: annotation.width + deltaX,
              height: annotation.height - deltaY
            };
            break;
          case 'sw':
            newProps = {
              x: annotation.x + deltaX,
              width: annotation.width - deltaX,
              height: annotation.height + deltaY
            };
            break;
          case 'se':
            newProps = {
              width: annotation.width + deltaX,
              height: annotation.height + deltaY
            };
            break;
        }
        
        // Ensure minimum size
        if (newProps.width && newProps.width < 10) newProps.width = 10;
        if (newProps.height && newProps.height < 10) newProps.height = 10;
        
        setAnnotations(prev => prev.map(a => 
          a.id === selectedAnnotation 
            ? { ...a, ...newProps }
            : a
        ));
        
        setDragStart({ x, y });
      }
    }
    
    if (startDrawing.current && (currentTool === 'highlight' || currentTool === 'rectangle' || currentTool === 'circle')) {
      handleAnnotationMove(event);
    }
    
    // Track mouse position for line tool preview
    if (currentTool === 'line') {
      setMousePosition({ x, y });
      
      // Redraw annotations to show line preview
      if (isDrawingLine && currentDrawStart) {
        drawAnnotations();
      }
    }
  };

  const handleMouseUp = () => {
    // End dragging and resizing operations
    if (isDragging || resizing) {
      setIsDragging(false);
      setResizing(null);
      setDragStart(null);
      setDragOffset(null);
      
      // Save to history after drag/resize operation
      if (selectedAnnotation) {
        const currentState = {
          annotations: annotations.filter(a => a && a.page === currentPage),
          textBoxes: textBoxes.filter(tb => tb.page === currentPage)
        };
        saveToHistory(currentState);
        console.log('Saved drag/resize operation to history');
      }
    }
    
    if (startDrawing.current && (currentTool === 'highlight' || currentTool === 'rectangle' || currentTool === 'circle')) {
      handleAnnotationEnd();
    }
  };



  // Navigation functions
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Zoom functions
  const handleZoomIn = () => {
    setZoom(Math.min(200, zoom + 25));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(50, zoom - 25));
  };

  // Handle fillable PDF form field detection
  const handleFormFieldsDetected = useCallback((fields: any[]) => {
    setDetectedFormFields(fields);
    console.log('Detected form fields:', fields);
  }, []);

  // Handle form data save
  const handleFormDataSave = useCallback((fields: any[]) => {
    console.log('Saving form data:', fields);
    // Here you could implement saving to database or exporting filled PDF
  }, []);

  // Re-render when page changes or mode switches
  useEffect(() => {
    const renderWithDebounce = async () => {
      if (pdfDocument && !isLoading) {
        await renderPage(pdfDocument, currentPage);
      }
    };
    
    renderWithDebounce();
  }, [currentPage, zoom, pdfDocument, rotation, activeMode]);

  // Redraw annotations when they change
  useEffect(() => {
    drawAnnotations();
  }, [drawAnnotations]);

  return (
    <div className={`flex flex-col h-full bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Top Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm">
        {/* Main Toolbar */}
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left Side - File Upload */}
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isLoading ? 'Loading...' : 'Upload PDF'}
            </Button>
            {fileName && (
              <span className="text-sm text-muted-foreground truncate max-w-48">
                {fileName}
              </span>
            )}
          </div>

          {/* Right Side - Mode Selector */}
          <div className="flex items-center gap-2">
            <Button
              variant={activeMode === 'edit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveMode('edit')}
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant={activeMode === 'merge' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveMode('merge')}
            >
              <Merge className="h-4 w-4 mr-1" />
              Merge
            </Button>
            <Button
              variant={activeMode === 'split' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveMode('split')}
            >
              <Split className="h-4 w-4 mr-1" />
              Split
            </Button>
            <Button
              variant={activeMode === 'forms' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveMode('forms')}
            >
              <FormInput className="h-4 w-4 mr-1" />
              Forms
            </Button>
            <Button
              variant={activeMode === 'fill' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveMode('fill')}
            >
              <FileText className="h-4 w-4 mr-1" />
              Fill
            </Button>
          </div>
        </div>

        {/* Secondary Toolbar - Tools and Controls */}
        {pdfDocument && activeMode === 'edit' && (
          <div className="border-t bg-gray-50 dark:bg-gray-900 px-4 py-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Unified Text Tool */}
              <Button
                variant={currentTool === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setCurrentTool('text');
                  setShowShapeDropdown(false);
                }}
              >
                <Type className="h-4 w-4 mr-1" />
                Text
              </Button>

              {/* Text Controls - only show when text tool is active */}
              {currentTool === 'text' && (
                <>
                  {hasSelectedTextBox && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => textBoxManagerRef.current?.duplicateTextBox()}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  )}
                  
                  {textBoxCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => textBoxManagerRef.current?.clearAllTextBoxes()}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear All ({textBoxCount})
                    </Button>
                  )}
                </>
              )}

              {/* Annotation Tools */}
              <div className="relative">
                <Button
                  variant={currentTool === 'highlight' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    console.log('Highlight button clicked, current tool:', currentTool);
                    if (currentTool === 'highlight') {
                      setShowHighlightDropdown(!showHighlightDropdown);
                    } else {
                      console.log('Setting tool to highlight');
                      setCurrentTool('highlight');
                      setShowHighlightDropdown(true);
                    }
                    setShowShapeDropdown(false);
                  }}
                >
                  <Highlighter className="h-4 w-4 mr-1" />
                  Highlight
                </Button>
                
                {showHighlightDropdown && currentTool === 'highlight' && (
                  <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[160px]" style={{ backgroundColor: 'white' }}>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-black mb-2">Highlight Colors</div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { color: '#FFFF00', name: 'Yellow' },
                          { color: '#00FF00', name: 'Green' },
                          { color: '#00FFFF', name: 'Cyan' },
                          { color: '#FF00FF', name: 'Pink' },
                          { color: '#FFA500', name: 'Orange' },
                          { color: '#FF0000', name: 'Red' }
                        ].map(({ color, name }) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded border-2 ${highlightColor === color ? 'border-black' : 'border-gray-300'}`}
                            style={{ backgroundColor: color + '60' }}
                            onClick={() => {
                              setHighlightColor(color);
                              setShowHighlightDropdown(false);
                            }}
                            title={name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <Button
                  variant={currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'checkmark' || currentTool === 'x-mark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    console.log('Main Shapes button clicked, currentTool:', currentTool, 'showShapeDropdown:', showShapeDropdown);
                    if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'checkmark' || currentTool === 'x-mark') {
                      setShowShapeDropdown(!showShapeDropdown);
                    } else {
                      setCurrentTool(selectedShape);
                      setShowShapeDropdown(true);
                    }
                  }}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Shapes
                </Button>
                
                {showShapeDropdown && (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'checkmark' || currentTool === 'x-mark') && (
                  <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-md shadow-lg p-2 min-w-[120px]" style={{ backgroundColor: 'white' }}>
                    <div className="space-y-1">
                      <Button
                        variant={selectedShape === 'rectangle' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full justify-start text-black bg-white hover:bg-gray-100"
                        style={{ color: 'black', backgroundColor: selectedShape === 'rectangle' ? undefined : 'white' }}
                        onClick={() => {
                          console.log('Rectangle shape button clicked');
                          setSelectedShape('rectangle');
                          setCurrentTool('rectangle');
                          setShowShapeDropdown(false);
                        }}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Rectangle
                      </Button>
                      <Button
                        variant={selectedShape === 'circle' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full justify-start text-black bg-white hover:bg-gray-100"
                        style={{ color: 'black', backgroundColor: selectedShape === 'circle' ? undefined : 'white' }}
                        onClick={() => {
                          setSelectedShape('circle');
                          setCurrentTool('circle');
                          setShowShapeDropdown(false);
                        }}
                      >
                        <Circle className="h-4 w-4 mr-2" />
                        Circle
                      </Button>
                      <Button
                        variant={selectedShape === 'checkmark' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full justify-start text-black bg-white hover:bg-gray-100"
                        style={{ color: 'black', backgroundColor: selectedShape === 'checkmark' ? undefined : 'white' }}
                        onClick={() => {
                          setSelectedShape('checkmark');
                          setCurrentTool('checkmark');
                          setShowShapeDropdown(false);
                        }}
                      >
                        ✓ Checkmark
                      </Button>
                      <Button
                        variant={selectedShape === 'x-mark' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full justify-start text-black bg-white hover:bg-gray-100"
                        style={{ color: 'black', backgroundColor: selectedShape === 'x-mark' ? undefined : 'white' }}
                        onClick={() => {
                          setSelectedShape('x-mark');
                          setCurrentTool('x-mark');
                          setShowShapeDropdown(false);
                        }}
                      >
                        ✕ X Mark
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <Button
                variant={currentTool === 'signature' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  console.log('Signature button clicked, signatureName:', signatureName);
                  if (!signatureName.trim()) {
                    console.log('Opening signature dialog');
                    setShowSignatureDialog(true);
                  } else {
                    console.log('Setting tool to signature');
                    setCurrentTool('signature');
                  }
                  setShowShapeDropdown(false);
                }}
              >
                <Signature className="h-4 w-4 mr-1" />
                Sign
              </Button>

              {/* Line Tool */}
              <div className="relative">
                <Button
                  variant={currentTool === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    console.log('Line button clicked, setting tool to line');
                    setCurrentTool('line');
                    setShowLineDropdown(!showLineDropdown);
                    setShowShapeDropdown(false);
                  }}
                  className="flex items-center gap-2 h-10"
                >
                  <Minus className="h-4 w-4" />
                  Line
                  <ChevronDown className="h-3 w-3" />
                </Button>
                {showLineDropdown && (
                  <div className="absolute top-12 left-0 z-50 bg-white border rounded-lg shadow-lg p-2 min-w-[200px]">
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-black">Line Settings</div>
                      
                      <div className="space-y-2">
                        <label className="text-sm text-black">Stroke Width: {lineStrokeWidth}px</label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={lineStrokeWidth}
                          onChange={(e) => setLineStrokeWidth(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm text-black">Color</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { color: '#000000', name: 'Black' },
                            { color: '#FF0000', name: 'Red' },
                            { color: '#0000FF', name: 'Blue' },
                            { color: '#008000', name: 'Green' }
                          ].map(({ color, name }) => (
                            <button
                              key={color}
                              onClick={() => {
                                setLineColor(color);
                                setShowLineDropdown(false);
                              }}
                              className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 rounded text-black"
                            >
                              <div 
                                className="w-4 h-4 rounded border" 
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-xs">{name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Upload Tool */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                variant={currentTool === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  console.log('Image button clicked');
                  if (selectedImage) {
                    setCurrentTool('image');
                  } else {
                    imageInputRef.current?.click();
                  }
                }}
              >
                <ImageIcon className="h-4 w-4 mr-1" />
                {selectedImage ? 'Place Image' : 'Upload Image'}
              </Button>

              <Button
                variant={whiteoutMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setWhiteoutMode(!whiteoutMode);
                  setShowShapeDropdown(false);
                  if (!whiteoutMode) {
                    setCurrentTool('select');
                  }
                }}
              >
                <Square className="h-4 w-4 mr-1" />
                Whiteout
              </Button>

              {/* Separator */}
              <div className="h-6 w-px bg-gray-300 mx-2" />

              {/* Annotation Color */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Palette className="h-4 w-4 mr-1" />
                    <div 
                      className="w-4 h-4 rounded border" 
                      style={{ backgroundColor: annotationColor }}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <ChromePicker
                    color={annotationColor}
                    onChange={(color) => setAnnotationColor(color.hex)}
                  />
                </PopoverContent>
              </Popover>

              {/* Eraser Size */}
              {currentTool === 'eraser' && (
                <>
                  <span className="text-sm text-gray-600">Size:</span>
                  <div className="w-24">
                    <Slider
                      value={[eraserSize]}
                      onValueChange={(value) => setEraserSize(value[0])}
                      max={50}
                      min={5}
                      step={5}
                      className="h-6"
                    />
                  </div>
                  <span className="text-xs text-gray-500">{eraserSize}px</span>
                </>
              )}

              {/* Separator */}
              <div className="h-6 w-px bg-gray-300 mx-2" />

              {/* Undo/Redo */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log('Undo button clicked!');
                  undo();
                }}
                disabled={historyIndex <= 0}
                title={`Undo (${historyIndex}/${history.length - 1})`}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Page Navigation and Controls */}
      {pdfDocument && (
        <div className="bg-white dark:bg-gray-800 border-b px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-16 text-center">
                {zoom}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Download Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportPDF}
              disabled={!pdfDocument || isLoading}
            >
              <Download className="h-4 w-4 mr-1" />
              {isLoading ? 'Exporting...' : 'Download'}
            </Button>
          </div>
        </div>
      )}

      {/* Main PDF Content Area */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-4">
        {pdfDocument ? (
          <>
            {/* Fillable PDF Mode */}
            {activeMode === 'fill' && (
              <div className="flex justify-center items-start min-h-full">
                <div className="w-full max-w-4xl">
                  <FillablePDFViewer
                    file={null}
                    pdfDocument={pdfDocument}
                    currentPage={currentPage}
                    onFieldsDetected={handleFormFieldsDetected}
                    onSave={handleFormDataSave}
                    className="bg-white rounded-lg shadow-lg"
                  />
                </div>
              </div>
            )}

            {/* Regular PDF Editor Mode */}
            {activeMode !== 'fill' && (
              <div className="flex justify-center items-start min-h-full">
                <div className="relative bg-white shadow-lg" id="pdf-canvas-container">
                  <canvas
                    ref={canvasRef}
                    className="block"
                  />
                  <canvas
                    ref={annotationCanvasRef}
                    className="absolute top-0 left-0"
                    onClick={(e) => {
                      console.log('Canvas onClick triggered, tool:', currentTool);
                      console.log('Event target:', e.target);
                      console.log('Current target:', e.currentTarget);
                      handleCanvasClick(e);
                    }}
                    onPointerDown={(e) => {
                      console.log('Canvas pointer down, tool:', currentTool);
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    style={{ 
                      cursor: currentTool === 'rectangle' ? 'crosshair' :
                              currentTool === 'circle' ? 'crosshair' :
                              currentTool === 'line' ? 'crosshair' :
                              currentTool === 'checkmark' ? 'pointer' :
                              currentTool === 'x-mark' ? 'pointer' :
                              currentTool === 'highlight' ? 'text' :
                              currentTool === 'signature' ? 'pen' :
                              currentTool === 'image' ? 'copy' :
                              currentTool === 'eraser' ? 'grab' :
                              currentTool === 'text' ? 'text' :
                              'default',
                      pointerEvents: 'auto',
                      zIndex: 10
                    }}
                  />
                  {/* Text boxes - rendered persistently outside tabs */}
                  <div style={{ 
                    pointerEvents: ['rectangle', 'circle', 'line', 'checkmark', 'x-mark', 'signature', 'highlight', 'image'].includes(currentTool) ? 'none' : 'auto'
                  }}>
                    <TextBoxManager
                      canvasRef={canvasRef}
                      currentPage={currentPage}
                      zoom={zoom / 100}
                      onTextBoxesChange={setTextBoxes}
                      showControls={false}
                      originalPdfData={originalFileData ?? undefined}
                    />
                  </div>
                  
                  {/* Additional Text Box Manager - only when enabled */}
                  {showTextBoxManager && (
                    <div style={{ 
                      position: "absolute", 
                      top: 0, 
                      left: 0, 
                      zIndex: 15,
                      pointerEvents: "auto"
                    }}>
                      <TextBoxManager
                        canvasRef={canvasRef}
                        currentPage={currentPage}
                        zoom={zoom / 100}
                        onTextBoxesChange={setTextBoxes}
                        showControls={true}
                        originalPdfData={originalFileData ?? undefined}
                      />
                    </div>
                  )}
                  
                  {/* Whiteout Layer */}
                  <div style={{ 
                    pointerEvents: ['rectangle', 'circle', 'checkmark', 'x-mark'].includes(currentTool) ? 'none' : 'auto'
                  }}>
                    <WhiteoutLayer
                      isActive={whiteoutMode}
                      canvasRef={canvasRef}
                      scale={zoom / 100}
                      onBlocksChange={setWhiteoutBlocks}
                    />
                  </div>
                  

                  
                  {/* Text Layer */}
                  <div style={{ 
                    pointerEvents: ['rectangle', 'circle', 'checkmark', 'x-mark'].includes(currentTool) ? 'none' : 'auto'
                  }}>
                    <TextLayer
                      isActive={currentTool === 'text'}
                      canvasRef={canvasRef}
                      scale={zoom / 100}
                      onTextElementsChange={setTextLayerElements}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Upload a PDF to get started
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a PDF file to edit, merge, split, fill forms, or add content
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Signature Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Your Signature</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="signature-name">Full Name</Label>
              <Input
                id="signature-name"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Enter your full name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="signature-font">Signature Style</Label>
              <select
                id="signature-font"
                value={signatureFont}
                onChange={(e) => setSignatureFont(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                style={{ backgroundColor: 'white', color: 'black' }}
              >
                <option value="Dancing Script" style={{ fontFamily: 'Dancing Script', color: 'black', backgroundColor: 'white' }}>Dancing Script (Cursive)</option>
                <option value="Great Vibes" style={{ fontFamily: 'Great Vibes', color: 'black', backgroundColor: 'white' }}>Great Vibes (Elegant)</option>
                <option value="Allura" style={{ fontFamily: 'Allura', color: 'black', backgroundColor: 'white' }}>Allura (Flowing)</option>
                <option value="Pacifico" style={{ fontFamily: 'Pacifico', color: 'black', backgroundColor: 'white' }}>Pacifico (Friendly)</option>
                <option value="Satisfy" style={{ fontFamily: 'Satisfy', color: 'black', backgroundColor: 'white' }}>Satisfy (Casual)</option>
                <option value="Kaushan Script" style={{ fontFamily: 'Kaushan Script', color: 'black', backgroundColor: 'white' }}>Kaushan Script (Modern)</option>
                <option value="Courgette" style={{ fontFamily: 'Courgette', color: 'black', backgroundColor: 'white' }}>Courgette (Rounded)</option>
                <option value="serif" style={{ fontFamily: 'serif', color: 'black', backgroundColor: 'white' }}>Times New Roman (Traditional)</option>
                <option value="sans-serif" style={{ fontFamily: 'sans-serif', color: 'black', backgroundColor: 'white' }}>Arial (Clean)</option>
              </select>
            </div>
            
            {signatureName && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <Label>Preview:</Label>
                <div 
                  style={{ 
                    fontFamily: signatureFont, 
                    fontSize: '24px',
                    color: '#000',
                    textAlign: 'center',
                    padding: '10px'
                  }}
                >
                  {signatureName}
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSignatureDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  console.log('Use Signature button clicked, name:', signatureName);
                  if (signatureName.trim()) {
                    console.log('Setting currentTool to signature');
                    setCurrentTool('signature');
                    setShowSignatureDialog(false);
                  }
                }}
                disabled={!signatureName.trim()}
              >
                Use Signature
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}