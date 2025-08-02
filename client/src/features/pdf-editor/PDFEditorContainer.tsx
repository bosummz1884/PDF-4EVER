import React, { useCallback, useEffect, useState } from 'react';
import { 
  FileText, 
  Upload,  
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Save,
  Undo,
  Redo,
  MousePointer,
  Type,
  Highlighter,
  Square,
  Circle,
  Minus,
  PenTool,
  Eraser,
  Image,
  FileSignature,
  ScanText,
  Edit3,
  CheckSquare,
  FormInput
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePDFEditor } from './PDFEditorContext';
import { useToolRegistry, ToolType } from './toolRegistry';
import { loadFonts } from '@/lib/loadFonts';
import {  
  Annotation, 
  WhiteoutBlock, 
  FormField} from '@/types/pdf-types';

interface PDFEditorContainerProps {
  className?: string;
  onFileProcessed?: (file: File) => void;
}

// Tool icon mapping
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TOOL_ICONS: Record<ToolType, React.ComponentType<any>> = {
  select: MousePointer,
  text: Type,
  highlight: Highlighter,
  rectangle: Square,
  circle: Circle,
  line: Minus,
  freehand: PenTool,
  eraser: Eraser,
  whiteout: Square,
  image: Image,
  signature: FileSignature,
  ocr: ScanText,
  inlineEdit: Edit3,
  checkmark: CheckSquare,
  form: FormInput
};

// Color picker component
const ColorPicker: React.FC<{
  color: string;
  onChange: (color: string) => void;
  label?: string;
}> = ({ color, onChange, label }) => {
  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'
  ];

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs">{label}</Label>}
      <div className="flex flex-wrap gap-1">
        {colors.map(c => (
          <button
            key={c}
            className={`w-6 h-6 rounded border-2 ${color === c ? 'border-gray-800' : 'border-gray-300'}`}
            style={{ backgroundColor: c }}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
      <Input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8"
      />
    </div>
  );
};

// Font selector component
const FontSelector: React.FC<{
  value: string;
  onChange: (font: string) => void;
  fonts: string[];
}> = ({ value, onChange, fonts }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-full">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {fonts.map(font => (
        <SelectItem key={font} value={font} style={{ fontFamily: font }}>
          {font}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

// Fillable form layer component
const FillableFormLayer: React.FC<{
  formFields: FormField[];
  scale: number;
  onFieldUpdate: (id: string, updates: Partial<FormField>) => void;
  selectedFieldId: string | null;
  onFieldSelect: (id: string | null) => void;
}> = ({ formFields, scale, onFieldUpdate, selectedFieldId, onFieldSelect }) => {
  return (
    <>
      {formFields.map(field => (
        <div
          key={field.id}
          className={`absolute cursor-pointer border-2 ${
            selectedFieldId === field.id 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-transparent hover:border-gray-300'
          }`}
          style={{
            left: field.x * scale,
            top: field.y * scale,
            width: field.width * scale,
            height: field.height * scale,
            zIndex: 25
          }}
          onClick={() => onFieldSelect(field.id)}
        >
          {field.type === 'text' && (
            <input
              type="text"
              value={field.value || ''}
              onChange={(e) => onFieldUpdate(field.id, { value: e.target.value })}
              className="w-full h-full border-none bg-transparent"
              placeholder={field.placeholder}
            />
          )}
          {field.type === 'checkbox' && (
            <input
              type="checkbox"
              checked={field.value === 'true'}
              onChange={(e) => onFieldUpdate(field.id, { value: e.target.checked.toString() })}
              className="w-full h-full"
            />
          )}
          {field.type === 'select' && (
            <select
              value={field.value || ''}
              onChange={(e) => onFieldUpdate(field.id, { value: e.target.value })}
              className="w-full h-full border-none bg-transparent"
            >
              <option value="">Select...</option>
              {field.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          )}
        </div>
      ))}
    </>
  );
};

// Annotation manager component
const AnnotationManager: React.FC<{
  annotations: Annotation[];
  scale: number;
  onAnnotationUpdate: (id: string, updates: Partial<Annotation>) => void;
  selectedAnnotationId: string | null;
  onAnnotationSelect: (id: string | null) => void;
}> = ({ annotations, scale, onAnnotationUpdate, selectedAnnotationId, onAnnotationSelect }) => {
  return (
    <>
      {annotations.map(annotation => (
        <div
          key={annotation.id}
          className={`absolute cursor-pointer border-2 ${
            selectedAnnotationId === annotation.id 
              ? 'border-blue-500' 
              : 'border-transparent hover:border-gray-300'
          }`}
          style={{
            left: annotation.x * scale,
            top: annotation.y * scale,
            width: annotation.width * scale,
            height: annotation.height * scale,
            backgroundColor: annotation.type === 'highlight' 
              ? annotation.color + '80' 
              : 'transparent',
            borderColor: annotation.type === 'rectangle' 
              ? annotation.color 
              : 'transparent',
            borderWidth: annotation.type === 'rectangle' ? 2 : 0,
            borderRadius: annotation.type === 'circle' ? '50%' : '0',
            zIndex: annotation.type === 'highlight' ? 5 : 15
          }}
          onClick={() => onAnnotationSelect(annotation.id)}
        />
      ))}
    </>
  );
};

export default function PDFEditorContainer({ className = '', onFileProcessed }: PDFEditorContainerProps) {
  const { state, dispatch, canvasRef, annotationCanvasRef, fileInputRef, renderPage, loadPDF, savePDF } = usePDFEditor();
  const { 
    tools, 
    currentTool, 
    setCurrentTool, 
    getToolSettings, 
    updateToolSetting,
    getToolsByCategory 
  } = useToolRegistry();

  // Local UI state
  const [fontList, setFontList] = useState<string[]>(['Arial', 'Times New Roman', 'Helvetica']);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file || file.type !== 'application/pdf') return;

    try {
      await loadPDF(file);
      onFileProcessed?.(file);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  }, [loadPDF, onFileProcessed]);

  // Page navigation
  const goToPage = useCallback((pageNum: number) => {
    if (pageNum >= 1 && pageNum <= state.totalPages) {
      dispatch({ type: 'SET_CURRENT_PAGE', payload: pageNum });
      renderPage(pageNum);
    }
  }, [state.totalPages, dispatch, renderPage]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    const newScale = Math.min(state.scale * 1.2, 3.0);
    dispatch({ type: 'SET_SCALE', payload: newScale });
    renderPage(state.currentPage);
  }, [state.scale, state.currentPage, dispatch, renderPage]);

  const zoomOut = useCallback(() => {
    const newScale = Math.max(state.scale / 1.2, 0.5);
    dispatch({ type: 'SET_SCALE', payload: newScale });
    renderPage(state.currentPage);
  }, [state.scale, state.currentPage, dispatch, renderPage]);

  const setZoom = useCallback((scale: number) => {
    const newScale = Math.max(0.5, Math.min(3.0, scale));
    dispatch({ type: 'SET_SCALE', payload: newScale });
    renderPage(state.currentPage);
  }, [state.currentPage, dispatch, renderPage]);

  // Rotation
  const rotate = useCallback(() => {
    const newRotation = (state.rotation + 90) % 360;
    dispatch({ type: 'SET_ROTATION', payload: newRotation });
    renderPage(state.currentPage);
  }, [state.rotation, state.currentPage, dispatch, renderPage]);

  // Element management
  const addTextElement = useCallback((element: Omit<TextElement, 'id'>) => {
    dispatch({ type: 'ADD_TEXT_ELEMENT', payload: { page: element.page, element } });
    dispatch({ type: 'SAVE_TO_HISTORY' });
  }, [dispatch]);

  const addAnnotation = useCallback((annotation: Omit<Annotation, 'id'>) => {
    const newAnnotation: Annotation = {
      ...annotation,
        id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    dispatch({ type: 'ADD_ANNOTATION', payload: { page: annotation.page, annotation: newAnnotation } });
    dispatch({ type: 'SAVE_TO_HISTORY' });
  }, [dispatch]);

  const updateTextElement = useCallback((id: string, updates: Partial<TextElement>) => {
    dispatch({ type: 'UPDATE_TEXT_ELEMENT', payload: { id, updates } });
    dispatch({ type: 'SAVE_TO_HISTORY' });
  }, [dispatch]);

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    dispatch({ type: 'UPDATE_ANNOTATION', payload: { id, updates } });
    dispatch({ type: 'SAVE_TO_HISTORY' });
  }, [dispatch]);

  const deleteElement = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TEXT_ELEMENT', payload: id });
    dispatch({ type: 'DELETE_ANNOTATION', payload: id });
    dispatch({ type: 'SAVE_TO_HISTORY' });
    setSelectedElementId(null);
  }, [dispatch]);

  const addWhiteoutBlock = useCallback((block: Omit<WhiteoutBlock, 'id'>) => {
    const newBlock: WhiteoutBlock = {
      ...block,
      id: `whiteout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    dispatch({ type: 'ADD_WHITEOUT_BLOCK', payload: { page: block.page, block: newBlock } });
    dispatch({ type: 'SAVE_TO_HISTORY' });
  }, [dispatch]);

  const addFormField = useCallback((field: Omit<FormField, 'id'>) => {
    const newField: FormField = {
      ...field,
      id: `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    dispatch({ type: 'ADD_FORM_FIELD', payload: { page: field.page, field: newField } });
    dispatch({ type: 'SAVE_TO_HISTORY' });
  }, [dispatch]);

  const updateFormField = useCallback((id: string, updates: Partial<FormField>) => {
    dispatch({ type: 'UPDATE_FORM_FIELD', payload: { id, updates } });
    dispatch({ type: 'SAVE_TO_HISTORY' });
  }, [dispatch]);

  // Canvas event handlers
  const getCanvasCoordinates = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / state.scale;
    const y = (event.clientY - rect.top) / state.scale;
    return { x, y };
  }, [state.scale]);

  const handleCanvasMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(event);
    setDrawingStart(coords);
    setIsDrawing(true);

    if (currentTool === 'text') {
      const textSettings = getToolSettings('text');
      addTextElement({
        page: state.currentPage,
        x: coords.x,
        y: coords.y,
        width: 200,
        height: 30,
        text: 'New Text',
        fontSize: textSettings.fontSize,
        fontFamily: textSettings.fontFamily,
        color: textSettings.color,
        bold: textSettings.bold,
        italic: textSettings.italic,
        underline: textSettings.underline
      });
    } else if (currentTool === 'form') {
      const formSettings = getToolSettings('form');
      addFormField({
        page: state.currentPage,
        x: coords.x,
        y: coords.y,
        width: 150,
        height: 25,
        type: formSettings.fieldType,
        placeholder: 'Enter text...',
        value: '',
        required: formSettings.required
      });
    }
  }, [currentTool, getCanvasCoordinates, state.currentPage, getToolSettings, addTextElement, addFormField]);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawingStart) return;

    const coords = getCanvasCoordinates(event);
    
    if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'highlight') {
      // Show preview of shape being drawn
      const width = Math.abs(coords.x - drawingStart.x);
      const height = Math.abs(coords.y - drawingStart.y);
      const x = Math.min(coords.x, drawingStart.x);
      const y = Math.min(coords.y, drawingStart.y);

      // Update preview overlay (this would need additional state management)
    }
  }, [isDrawing, drawingStart, currentTool, getCanvasCoordinates]);

  const handleCanvasMouseUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawingStart) return;

    const coords = getCanvasCoordinates(event);
    const width = Math.abs(coords.x - drawingStart.x);
    const height = Math.abs(coords.y - drawingStart.y);
    const x = Math.min(coords.x, drawingStart.x);
    const y = Math.min(coords.y, drawingStart.y);

    if (width > 5 && height > 5) { // Minimum size threshold
      if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'highlight') {
        const toolSettings = getToolSettings(currentTool);
        addAnnotation({
          page: state.currentPage,
          type: currentTool,
          x,
          y,
          width,
          height,
          color: toolSettings.color,
          strokeWidth: toolSettings.strokeWidth || 2
        });
      } else if (currentTool === 'whiteout') {
        addWhiteoutBlock({
          page: state.currentPage,
          x,
          y,
          width,
          height
        });
      }
    }

    setIsDrawing(false);
    setDrawingStart(null);
  }, [isDrawing, drawingStart, currentTool, getCanvasCoordinates, state.currentPage, getToolSettings, addAnnotation, addWhiteoutBlock]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              dispatch({ type: 'REDO' });
            } else {
              dispatch({ type: 'UNDO' });
            }
            break;
          case 'y':
            event.preventDefault();
            dispatch({ type: 'REDO' });
            break;
          case 's':
            event.preventDefault();
            savePDF();
            break;
          case '=':
          case '+':
            event.preventDefault();
            zoomIn();
            break;
          case '-':
            event.preventDefault();
            zoomOut();
            break;
        }
      } else if (event.key === 'Delete' && selectedElementId) {
        deleteElement(selectedElementId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, savePDF, zoomIn, zoomOut, selectedElementId, deleteElement]);

  // Load fonts on mount
  useEffect(() => {
    loadFonts().then(fonts => {
      setFontList(prev => [...new Set([...prev, ...fonts])]);
    });
  }, []);

  // Render current page when state changes
  useEffect(() => {
    if (state.pdfDocument && state.currentPage) {
      renderPage(state.currentPage);
    }
  }, [state.pdfDocument, state.currentPage, state.scale, state.rotation, renderPage]);

  // Tool settings panel
  const renderToolSettings = () => {
    const settings = getToolSettings(currentTool);
    if (!settings) return null;

    return (
      <Card className="w-64">
        <CardContent className="p-4 space-y-4">
          <div className="font-medium text-sm">{tools[currentTool]?.name} Settings</div>
          
          {settings.color !== undefined && (
            <ColorPicker
              color={settings.color}
              onChange={(color) => updateToolSetting(currentTool, 'color', color)}
              label="Color"
            />
          )}

          {settings.fontSize !== undefined && (
            <div className="space-y-2">
              <Label className="text-xs">Font Size</Label>
              <Slider
                value={[settings.fontSize]}
                onValueChange={([value]) => updateToolSetting(currentTool, 'fontSize', value)}
                min={8}
                max={72}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-gray-500">{settings.fontSize}px</div>
            </div>
          )}

          {settings.fontFamily !== undefined && (
            <div className="space-y-2">
              <Label className="text-xs">Font Family</Label>
              <FontSelector
                value={settings.fontFamily}
                onChange={(font) => updateToolSetting(currentTool, 'fontFamily', font)}
                fonts={fontList}
              />
            </div>
          )}

          {settings.strokeWidth !== undefined && (
            <div className="space-y-2">
              <Label className="text-xs">Stroke Width</Label>
              <Slider
                value={[settings.strokeWidth]}
                onValueChange={([value]) => updateToolSetting(currentTool, 'strokeWidth', value)}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-gray-500">{settings.strokeWidth}px</div>
            </div>
          )}

          {settings.bold !== undefined && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="bold"
                checked={settings.bold}
                onChange={(e) => updateToolSetting(currentTool, 'bold', e.target.checked)}
              />
              <Label htmlFor="bold" className="text-xs">Bold</Label>
            </div>
          )}

          {settings.italic !== undefined && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="italic"
                checked={settings.italic}
                onChange={(e) => updateToolSetting(currentTool, 'italic', e.target.checked)}
              />
              <Label htmlFor="italic" className="text-xs">Italic</Label>
            </div>
          )}

          {settings.underline !== undefined && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="underline"
                checked={settings.underline}
                onChange={(e) => updateToolSetting(currentTool, 'underline', e.target.checked)}
              />
              <Label htmlFor="underline" className="text-xs">Underline</Label>
            </div>
          )}

          {settings.fieldType !== undefined && (
            <div className="space-y-2">
              <Label className="text-xs">Field Type</Label>
              <Select
                value={settings.fieldType}
                onValueChange={(value) => updateToolSetting(currentTool, 'fieldType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                                  </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Field</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="radio">Radio Button</SelectItem>
                  <SelectItem value="select">Dropdown</SelectItem>
                  <SelectItem value="textarea">Text Area</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {settings.required !== undefined && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="required"
                checked={settings.required}
                onChange={(e) => updateToolSetting(currentTool, 'required', e.target.checked)}
              />
              <Label htmlFor="required" className="text-xs">Required Field</Label>
            </div>
          )}

          {settings.opacity !== undefined && (
            <div className="space-y-2">
              <Label className="text-xs">Opacity</Label>
              <Slider
                value={[settings.opacity * 100]}
                onValueChange={([value]) => updateToolSetting(currentTool, 'opacity', value / 100)}
                min={10}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="text-xs text-gray-500">{Math.round(settings.opacity * 100)}%</div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Get current page elements
  const currentPageTextElements = state.textElements[state.currentPage] || [];
  const currentPageAnnotations = state.annotations[state.currentPage] || [];
  const currentPageFormFields = state.formFields[state.currentPage] || [];
  const currentPageWhiteoutBlocks = state.whiteoutBlocks[state.currentPage] || [];

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header Toolbar */}
      <div className="border-b bg-white p-4 space-y-4">
        {/* File Operations */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </Button>
            
            {state.pdfDocument && (
              <>
                <Button onClick={savePDF} variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save PDF
                </Button>
                
                <Separator orientation="vertical" className="h-6" />
                
                <Button
                  onClick={() => dispatch({ type: 'UNDO' })}
                  disabled={state.historyIndex <= 0}
                  variant="outline"
                  size="sm"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={() => dispatch({ type: 'REDO' })}
                  disabled={state.historyIndex >= state.history.length - 1}
                  variant="outline"
                  size="sm"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {state.pdfDocument && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {state.fileName}
              </Badge>
              <Badge variant="outline">
                Page {state.currentPage} of {state.totalPages}
              </Badge>
            </div>
          )}
        </div>

        {/* Tool Categories */}
        {state.pdfDocument && (
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="annotation">Annotate</TabsTrigger>
              <TabsTrigger value="form">Forms</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-4">
              <div className="flex items-center space-x-2 flex-wrap">
                {getToolsByCategory('basic').map(toolType => {
                  const tool = tools[toolType];
                  const Icon = TOOL_ICONS[toolType];
                  return (
                    <Button
                      key={toolType}
                      onClick={() => setCurrentTool(toolType)}
                      variant={currentTool === toolType ? "default" : "outline"}
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tool.name}</span>
                    </Button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="annotation" className="mt-4">
              <div className="flex items-center space-x-2 flex-wrap">
                {getToolsByCategory('annotation').map(toolType => {
                  const tool = tools[toolType];
                  const Icon = TOOL_ICONS[toolType];
                  return (
                    <Button
                      key={toolType}
                      onClick={() => setCurrentTool(toolType)}
                      variant={currentTool === toolType ? "default" : "outline"}
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tool.name}</span>
                    </Button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="form" className="mt-4">
              <div className="flex items-center space-x-2 flex-wrap">
                {getToolsByCategory('form').map(toolType => {
                  const tool = tools[toolType];
                  const Icon = TOOL_ICONS[toolType];
                  return (
                    <Button
                      key={toolType}
                      onClick={() => setCurrentTool(toolType)}
                      variant={currentTool === toolType ? "default" : "outline"}
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tool.name}</span>
                    </Button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="mt-4">
              <div className="flex items-center space-x-2 flex-wrap">
                {getToolsByCategory('advanced').map(toolType => {
                  const tool = tools[toolType];
                  const Icon = TOOL_ICONS[toolType];
                  return (
                    <Button
                      key={toolType}
                      onClick={() => setCurrentTool(toolType)}
                      variant={currentTool === toolType ? "default" : "outline"}
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tool.name}</span>
                    </Button>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tool Settings Sidebar */}
        {state.pdfDocument && (
          <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto">
            {renderToolSettings()}
          </div>
        )}

        {/* PDF Viewer */}
        <div className="flex-1 flex flex-col">
          {!state.pdfDocument ? (
            <div className="flex-1 flex items-center justify-center">
              <Card className="w-96">
                <CardContent className="p-8 text-center">
                  <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Upload a PDF to get started</h3>
                  <p className="text-gray-600 mb-4">
                    Select a PDF file to begin editing with our comprehensive toolkit
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose PDF File
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {/* Navigation Bar */}
              <div className="border-b bg-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => goToPage(state.currentPage - 1)}
                    disabled={state.currentPage <= 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={state.currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= state.totalPages) {
                          goToPage(page);
                        }
                      }}
                      className="w-16 text-center"
                      min={1}
                      max={state.totalPages}
                    />
                    <span className="text-sm text-gray-600">of {state.totalPages}</span>
                  </div>
                  
                  <Button
                    onClick={() => goToPage(state.currentPage + 1)}
                    disabled={state.currentPage >= state.totalPages}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button onClick={zoomOut} variant="outline" size="sm">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        {Math.round(state.scale * 100)}%
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <div className="space-y-2">
                        <Label className="text-xs">Zoom Level</Label>
                        <Slider
                          value={[state.scale * 100]}
                          onValueChange={([value]) => setZoom(value / 100)}
                          min={50}
                          max={300}
                          step={25}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>50%</span>
                          <span>300%</span>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <Button onClick={zoomIn} variant="outline" size="sm">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  
                  <Button onClick={rotate} variant="outline" size="sm">
                    <RotateCw className="h-4 w-4" />
                     </Button>
                </div>
              </div>

              {/* PDF Canvas Area */}
              <div className="flex-1 overflow-auto bg-gray-100 p-4">
                <div className="flex justify-center">
                  <div className="relative bg-white shadow-lg" style={{ 
                    transform: `rotate(${state.rotation}deg)`,
                    transformOrigin: 'center center'
                  }}>
                    <canvas
                      ref={canvasRef}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      className="block cursor-crosshair"
                      style={{
                        transform: `scale(${state.scale})`,
                        transformOrigin: 'top left'
                      }}
                    />

                    {/* Text Elements Overlay */}
                    {currentPageTextElements.map((element) => (
                      <div
                        key={element.id}
                        className={`absolute border-2 ${
                          selectedElementId === element.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-transparent hover:border-gray-300'
                        } cursor-move`}
                        style={{
                          left: element.x * state.scale,
                          top: element.y * state.scale,
                          width: element.width * state.scale,
                          height: element.height * state.scale,
                          fontSize: element.fontSize * state.scale,
                          fontFamily: element.fontFamily,
                          color: element.color,
                          fontWeight: element.bold ? 'bold' : 'normal',
                          fontStyle: element.italic ? 'italic' : 'normal',
                          textDecoration: element.underline ? 'underline' : 'none',
                          transform: `rotate(${state.rotation}deg)`,
                          transformOrigin: 'center center'
                        }}
                        onClick={() => setSelectedElementId(element.id)}
                        onDoubleClick={() => {
                          const newText = prompt('Edit text:', element.text);
                          if (newText !== null) {
                            updateTextElement(element.id, { text: newText });
                          }
                        }}
                      >
                        {element.text}
                        
                        {selectedElementId === element.id && (
                          <div className="absolute -top-8 -right-8 flex space-x-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteElement(element.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Annotations Overlay */}
                    {currentPageAnnotations.map((annotation) => (
                      <div
                        key={annotation.id}
                        className={`absolute border-2 ${
                          selectedElementId === annotation.id 
                            ? 'border-blue-500' 
                            : 'border-transparent hover:border-gray-300'
                        } cursor-move`}
                        style={{
                          left: annotation.x * state.scale,
                          top: annotation.y * state.scale,
                          width: annotation.width * state.scale,
                          height: annotation.height * state.scale,
                          backgroundColor: annotation.type === 'highlight' 
                            ? `${annotation.color}40` 
                            : 'transparent',
                          borderColor: annotation.type !== 'highlight' ? annotation.color : 'transparent',
                          borderWidth: annotation.strokeWidth || 2,
                          borderRadius: annotation.type === 'circle' ? '50%' : '0',
                          transform: `rotate(${state.rotation}deg)`,
                          transformOrigin: 'center center'
                        }}
                        onClick={() => setSelectedElementId(annotation.id)}
                      >
                        {selectedElementId === annotation.id && (
                          <div className="absolute -top-8 -right-8 flex space-x-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteElement(annotation.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Form Fields Overlay */}
                    {currentPageFormFields.map((field) => (
                      <div
                        key={field.id}
                        className={`absolute border-2 ${
                          selectedElementId === field.id 
                            ? 'border-blue-500' 
                            : 'border-gray-300'
                        } bg-white`}
                        style={{
                          left: field.x * state.scale,
                          top: field.y * state.scale,
                          width: field.width * state.scale,
                          height: field.height * state.scale,
                          transform: `rotate(${state.rotation}deg)`,
                          transformOrigin: 'center center'
                        }}
                        onClick={() => setSelectedElementId(field.id)}
                      >
                        {field.type === 'text' && (
                          <input
                            type="text"
                            placeholder={field.placeholder}
                            value={field.value}
                            onChange={(e) => updateFormField(field.id, { value: e.target.value })}
                            className="w-full h-full px-2 border-none outline-none text-sm"
                            style={{ fontSize: 12 * state.scale }}
                          />
                        )}
                        
                        {field.type === 'textarea' && (
                          <textarea
                            placeholder={field.placeholder}
                            value={field.value}
                            onChange={(e) => updateFormField(field.id, { value: e.target.value })}
                            className="w-full h-full p-2 border-none outline-none resize-none text-sm"
                            style={{ fontSize: 12 * state.scale }}
                          />
                        )}
                        
                        {field.type === 'checkbox' && (
                          <input
                            type="checkbox"
                            checked={field.value === 'true'}
                            onChange={(e) => updateFormField(field.id, { value: e.target.checked.toString() })}
                            className="w-full h-full"
                          />
                        )}
                        
                        {field.type === 'select' && (
                          <select
                            value={field.value}
                            onChange={(e) => updateFormField(field.id, { value: e.target.value })}
                            className="w-full h-full px-2 border-none outline-none text-sm"
                            style={{ fontSize: 12 * state.scale }}
                          >
                            <option value="">Select...</option>
                            {field.options?.map((option, index) => (
                              <option key={index} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}

                        {selectedElementId === field.id && (
                          <div className="absolute -top-8 -right-8 flex space-x-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteElement(field.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Whiteout Blocks Overlay */}
                    {currentPageWhiteoutBlocks.map((block) => (
                      <div
                        key={block.id}
                        className={`absolute bg-white border-2 ${
                          selectedElementId === block.id 
                            ? 'border-blue-500' 
                            : 'border-gray-300'
                        }`}
                        style={{
                          left: block.x * state.scale,
                          top: block.y * state.scale,
                          width: block.width * state.scale,
                          height: block.height * state.scale,
                          transform: `rotate(${state.rotation}deg)`,
                          transformOrigin: 'center center'
                        }}
                        onClick={() => setSelectedElementId(block.id)}
                      >
                        {selectedElementId === block.id && (
                          <div className="absolute -top-8 -right-8 flex space-x-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteElement(block.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Drawing Preview Overlay */}
                    {isDrawing && drawingStart && (
                      <div
                        className="absolute border-2 border-dashed border-blue-500 bg-blue-100 bg-opacity-30 pointer-events-none"
                        style={{
                          left: Math.min(drawingStart.x, mousePosition.x) * state.scale,
                          top: Math.min(drawingStart.y, mousePosition.y) * state.scale,
                          width: Math.abs(mousePosition.x - drawingStart.x) * state.scale,
                          height: Math.abs(mousePosition.y - drawingStart.y) * state.scale,
                          borderRadius: currentTool === 'circle' ? '50%' : '0'
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Element Properties Panel */}
      {selectedElementId && (
        <div className="fixed bottom-4 right-4 w-80">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Element Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                const textElement = currentPageTextElements.find(e => e.id === selectedElementId);
                const annotation = currentPageAnnotations.find(a => a.id === selectedElementId);
                const formField = currentPageFormFields.find(f => f.id === selectedElementId);

                if (textElement) {
                  return (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Text</Label>
                        <Input
                          value={textElement.text}
                          onChange={(e) => updateTextElement(textElement.id, { text: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Font Size</Label>
                        <Slider
                          value={[textElement.fontSize]}
                          onValueChange={([value]) => updateTextElement(textElement.id, { fontSize: value })}
                          min={8}
                          max={72}
                          step={1}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Color</Label>
                        <ColorPicker
                          color={textElement.color}
                          onChange={(color) => updateTextElement(textElement.id, { color })}
                          />
                      </div>
                      <div>
                        <Label className="text-xs">Font Family</Label>
                        <Select
                          value={textElement.fontFamily}
                          onValueChange={(value) => updateTextElement(textElement.id, { fontFamily: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Courier New">Courier New</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant={textElement.bold ? "default" : "outline"}
                          onClick={() => updateTextElement(textElement.id, { bold: !textElement.bold })}
                        >
                          <Bold className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={textElement.italic ? "default" : "outline"}
                          onClick={() => updateTextElement(textElement.id, { italic: !textElement.italic })}
                        >
                          <Italic className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={textElement.underline ? "default" : "outline"}
                          onClick={() => updateTextElement(textElement.id, { underline: !textElement.underline })}
                        >
                          <Underline className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                }

                if (annotation) {
                  return (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Badge variant="secondary" className="ml-2">
                          {annotation.type}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-xs">Color</Label>
                        <ColorPicker
                          color={annotation.color}
                          onChange={(color) => updateAnnotation(annotation.id, { color })}
                        />
                      </div>
                      {annotation.type !== 'highlight' && (
                        <div>
                          <Label className="text-xs">Stroke Width</Label>
                          <Slider
                            value={[annotation.strokeWidth || 2]}
                            onValueChange={([value]) => updateAnnotation(annotation.id, { strokeWidth: value })}
                            min={1}
                            max={10}
                            step={1}
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  );
                }

                if (formField) {
                  return (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Badge variant="secondary" className="ml-2">
                          {formField.type}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-xs">Placeholder</Label>
                        <Input
                          value={formField.placeholder || ''}
                          onChange={(e) => updateFormField(formField.id, { placeholder: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      {formField.type === 'select' && (
                        <div>
                          <Label className="text-xs">Options (one per line)</Label>
                          <textarea
                            value={formField.options?.join('\n') || ''}
                            onChange={(e) => updateFormField(formField.id, { 
                              options: e.target.value.split('\n').filter(opt => opt.trim()) 
                            })}
                            className="mt-1 w-full p-2 border rounded text-sm"
                            rows={3}
                          />
                        </div>
                      )}
                    </div>
                  );
                }

                return null;
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}