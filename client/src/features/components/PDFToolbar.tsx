import React, { Dispatch, SetStateAction, RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ChromePicker } from 'react-color';
import {
  Download, Upload, Type, Edit3, Highlighter, Square, Circle, ZoomIn, ZoomOut, RotateCw, Undo, Redo,
  MousePointer, Eraser, FileText, Save, FormInput, Signature, Image as ImageIcon, CheckSquare,
  X as XIcon, Minus, Palette, ChevronLeft, ChevronRight
} from 'lucide-react';
import { FontInfo } from '@/types/pdf-types';

// Allowed tool type
export type ToolType =
  | 'select'
  | 'whiteout'
  | 'text'
  | 'highlight'
  | 'rectangle'
  | 'circle'
  | 'freeform'
  | 'form'
  | 'signature'
  | 'eraser'
  | 'checkmark'
  | 'x-mark'
  | 'line'
  | 'image'
  | 'inlineEdit'
  | 'ocr';

export interface PDFToolbarProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  setCurrentTool: Dispatch<SetStateAction<ToolType>>;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  setZoom: Dispatch<SetStateAction<number>>;
  rotation: number;
  fileName: string;
  onDownload: () => void;
  isLoading: boolean;
  selectedFont: FontInfo;
  onFontChange: (font: FontInfo) => void;
  fontList: FontInfo[];
  setRotation: Dispatch<SetStateAction<number>>;
  highlightColor: string;
  onHighlightColorChange: (color: string) => void;
  onAnnotationColorChange: (color: string) => void;
  lineColor: string;
  lineStrokeWidth: number;
  onLineColorChange: (color: string) => void;
  onLineStrokeWidthChange: (width: number) => void;
  whiteoutMode: boolean;
  onWhiteoutToggle: () => void;
  signatureName: string;
  signatureFont: string;
  setSignatureName: (name: string) => void;
  setSignatureFont: (font: string) => void;
  showSignatureDialog: boolean;
  setShowSignatureDialog: (show: boolean) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  fileInputRef: RefObject<HTMLInputElement>;
  handleFileUpload: (file: File) => void;
  savePDF: () => void;
  annotationColor: string;
  setAnnotationColor: Dispatch<SetStateAction<string>>;
}

const PDFToolbar: React.FC<PDFToolbarProps> = ({
  currentTool,
  setCurrentTool,
  zoom,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  setZoom,
  onZoomIn,
  onZoomOut,
  onFontChange,
  fontList,
  selectedFont,
  rotation,
  highlightColor,
  onHighlightColorChange,
  onAnnotationColorChange,
  lineColor,
  lineStrokeWidth,
  onLineColorChange,
  onLineStrokeWidthChange,
  setRotation,
  currentPage,
  totalPages,
  setCurrentPage,
  fileInputRef,
  handleFileUpload,
  savePDF,
  annotationColor,
  setAnnotationColor,
  fileName,
  onDownload,
  isLoading,
  whiteoutMode,
  onWhiteoutToggle,
  signatureName,
  signatureFont,
  setSignatureName,
  setSignatureFont,
  setShowSignatureDialog,
}) => {
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showHighlightColorPicker, setShowHighlightColorPicker] = React.useState(false);
  const [showLineColorPicker, setShowLineColorPicker] = React.useState(false);
  const [showFontSelector, setShowFontSelector] = React.useState(false);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleZoomIn = () => {
    setZoom((z) => Math.min(z + 10, 200));
    onZoomIn();
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(z - 10, 50));
    onZoomOut();
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handlePreviousPage = () => {
    setCurrentPage((p) => (p > 1 ? p - 1 : p));
  };

  const handleNextPage = () => {
    setCurrentPage((p) => (p < totalPages ? p + 1 : p));
  };

  const handleToolSelect = (tool: ToolType) => {
    setCurrentTool(tool);
  };

  const handleFontSelect = (fontName: string) => {
    const font = fontList.find(f => f.name === fontName);
    if (font) {
      onFontChange(font);
    }
  };

  const getToolIcon = (tool: ToolType) => {
    switch (tool) {
      case 'select': return <MousePointer className="h-4 w-4" />;
      case 'text': return <Type className="h-4 w-4" />;
      case 'highlight': return <Highlighter className="h-4 w-4" />;
      case 'rectangle': return <Square className="h-4 w-4" />;
      case 'circle': return <Circle className="h-4 w-4" />;
      case 'freeform': return <Edit3 className="h-4 w-4" />;
      case 'signature': return <Signature className="h-4 w-4" />;
      case 'eraser': return <Eraser className="h-4 w-4" />;
      case 'form': return <FormInput className="h-4 w-4" />;
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'checkmark': return <CheckSquare className="h-4 w-4" />;
      case 'x-mark': return <XIcon className="h-4 w-4" />;
      case 'line': return <Minus className="h-4 w-4" />;
      case 'ocr': return <FileText className="h-4 w-4" />;
      case 'whiteout': return <Square className="h-4 w-4" />;
      case 'inlineEdit': return <Edit3 className="h-4 w-4" />;
      default: return <MousePointer className="h-4 w-4" />;
    }
  };

  const getToolLabel = (tool: ToolType) => {
    switch (tool) {
      case 'select': return 'Select';
      case 'text': return 'Text';
      case 'highlight': return 'Highlight';
      case 'rectangle': return 'Rectangle';
      case 'circle': return 'Circle';
      case 'freeform': return 'Freeform';
      case 'signature': return 'Signature';
      case 'eraser': return 'Eraser';
      case 'form': return 'Form';
      case 'image': return 'Image';
      case 'checkmark': return 'Checkmark';
      case 'x-mark': return 'X Mark';
      case 'line': return 'Line';
      case 'ocr': return 'OCR';
      case 'whiteout': return 'Whiteout';
      case 'inlineEdit': return 'Inline Edit';
      default: return 'Select';
    }
  };

  return (
  <div className="w-full flex justify-center">
    <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      {/* File Operations */}
      <div className="flex items-center gap-1">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <Upload className="h-4 w-4 mr-1" />
          Upload
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={savePDF}
          disabled={isLoading}
        >
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          disabled={isLoading || !fileName}
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Tools */}
      <div className="flex items-center gap-1">
        {(['select', 'text', 'highlight', 'rectangle', 'circle', 'freeform', 'signature', 'eraser'] as ToolType[]).map((tool) => (
          <Button
            key={tool}
            variant={currentTool === tool ? "default" : "outline"}
            size="sm"
            onClick={() => handleToolSelect(tool)}
            title={getToolLabel(tool)}
          >
            {getToolIcon(tool)}
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Advanced Tools */}
      <div className="flex items-center gap-1">
        {(['form', 'image', 'checkmark', 'x-mark', 'line', 'ocr', 'whiteout'] as ToolType[]).map((tool) => (
          <Button
            key={tool}
            variant={currentTool === tool ? "default" : "outline"}
            size="sm"
            onClick={() => handleToolSelect(tool)}
            title={getToolLabel(tool)}
          >
            {getToolIcon(tool)}
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Font Controls */}
      {(currentTool === 'text' || currentTool === 'signature') && (
        <>
          <Popover open={showFontSelector} onOpenChange={setShowFontSelector}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Type className="h-4 w-4 mr-1" />
                {selectedFont.name}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <Select value={selectedFont.name} onValueChange={handleFontSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    {fontList.map((font) => (
                      <SelectItem key={font.name} value={font.name}>
                        <span style={{ fontFamily: font.family }}>{font.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* Color Controls */}
      <div className="flex items-center gap-1">
        {/* Annotation Color */}
        <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" title="Annotation Color">
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
              onChange={(color) => {
                setAnnotationColor(color.hex);
                onAnnotationColorChange(color.hex);
              }}
            />
          </PopoverContent>
        </Popover>

        {/* Highlight Color */}
        {currentTool === 'highlight' && (
          <Popover open={showHighlightColorPicker} onOpenChange={setShowHighlightColorPicker}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" title="Highlight Color">
                <Highlighter className="h-4 w-4 mr-1" />
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: highlightColor }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <ChromePicker
                  color={highlightColor}
                  onChange={(color) => onHighlightColorChange(color.hex)}
                />
              </PopoverContent>
            </Popover>
          )}
  
          {/* Line Color and Width */}
          {currentTool === 'line' && (
            <>
              <Popover open={showLineColorPicker} onOpenChange={setShowLineColorPicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" title="Line Color">
                    <Minus className="h-4 w-4 mr-1" />
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: lineColor }}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <ChromePicker
                    color={lineColor}
                    onChange={(color) => onLineColorChange(color.hex)}
                  />
                </PopoverContent>
              </Popover>
              <div className="flex items-center gap-2 px-2">
                <span className="text-xs">Width:</span>
                <Slider
                  value={[lineStrokeWidth]}
                  onValueChange={(value) => onLineStrokeWidthChange(value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="w-16"
                />
                <span className="text-xs w-6">{lineStrokeWidth}px</span>
              </div>
            </>
          )}
        </div>
  
        <Separator orientation="vertical" className="h-6" />
  
        {/* Whiteout Mode Toggle */}
        <Button
          variant={whiteoutMode ? "default" : "outline"}
          size="sm"
          onClick={onWhiteoutToggle}
          title="Toggle Whiteout Mode"
        >
          <Square className="h-4 w-4 mr-1" />
          Whiteout
        </Button>
  
        <Separator orientation="vertical" className="h-6" />
  
        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage <= 1}
            title="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  setCurrentPage(page);
                }
              }}
              className="w-16 text-center"
              min={1}
              max={totalPages}
            />
            <span className="text-sm text-gray-500">/ {totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            title="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
  
        <Separator orientation="vertical" className="h-6" />
  
        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={zoom}
              onChange={(e) => {
                const newZoom = parseInt(e.target.value);
                if (newZoom >= 50 && newZoom <= 200) {
                  setZoom(newZoom);
                }
              }}
              className="w-16 text-center"
              min={50}
              max={200}
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
  
        <Separator orientation="vertical" className="h-6" />
  
        {/* Rotation */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRotate}
          title={`Rotate (${rotation}°)`}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
  
        {/* Signature Dialog Controls */}
        {currentTool === 'signature' && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Input
                placeholder="Signature name"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                className="w-32"
              />
              <Select value={signatureFont} onValueChange={setSignatureFont}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dancing Script">Dancing Script</SelectItem>
                  <SelectItem value="Great Vibes">Great Vibes</SelectItem>
                  <SelectItem value="Allura">Allura</SelectItem>
                  <SelectItem value="Alex Brush">Alex Brush</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSignatureDialog(true)}
              >
                Create Signature
              </Button>
            </div>
          </>
        )}
  
        {/* File Name Display */}
        {fileName && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FileText className="h-4 w-4" />
              <span className="max-w-32 truncate" title={fileName}>
                {fileName}
              </span>
            </div>
          </>
        )}
  
        {/* Loading Indicator */}
        {isLoading && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Processing...</span>
            </div>
          </>
        )}
      </div>
      </div>
    );
  };
  
  export default PDFToolbar;