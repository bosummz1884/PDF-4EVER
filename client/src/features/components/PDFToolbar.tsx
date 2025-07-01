import React, { useState } from 'react';
import { usePDFEditor } from '../PDFEditorContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChromePicker } from 'react-color';
import {
  Download,
  Upload,
  Type,
  Edit3,
  Highlighter,
  Square,
  Circle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Undo,
  Redo,
  MousePointer,
  Eraser,
  FileText,
  Save,
  FormInput,
  Signature,
  Image as ImageIcon,
  CheckSquare,
  X as XIcon,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Palette
} from 'lucide-react';

export default function PDFToolbar() {
  const { 
    currentTool, 
    setCurrentTool,
    zoom,
    setZoom,
    rotation,
    setRotation,
    currentPage,
    totalPages,
    setCurrentPage,
    fileInputRef,
    handleFileUpload,
    savePDF
  } = usePDFEditor();

  const [annotationColor, setAnnotationColor] = useState('#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 10, 50));
  };

  const handleRotate = () => {
    setRotation((rotation + 90) % 360);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="pdf-toolbar flex items-center justify-between p-2 bg-background border-b">
      <div className="file-tools flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-1" />
          Open
        </Button>
        <Input 
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileInputChange}
        />
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={savePDF}
        >
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
        
        <Separator orientation="vertical" className="h-6" />
      </div>
      
      <div className="edit-tools flex items-center space-x-1">
        <Button 
          variant={currentTool === 'select' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setCurrentTool('select')}
        >
          <MousePointer className="h-4 w-4" />
        </Button>
        
        <Button 
          variant={currentTool === 'text' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setCurrentTool('text')}
        >
          <Type className="h-4 w-4" />
        </Button>
        
        <Button 
          variant={currentTool === 'highlight' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setCurrentTool('highlight')}
        >
          <Highlighter className="h-4 w-4" />
        </Button>
        
        <Button 
          variant={currentTool === 'rectangle' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setCurrentTool('rectangle')}
        >
          <Square className="h-4 w-4" />
        </Button>
        
        <Button 
          variant={currentTool === 'circle' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setCurrentTool('circle')}
        >
          <Circle className="h-4 w-4" />
        </Button>
        
        <Button 
          variant={currentTool === 'checkmark' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setCurrentTool('checkmark')}
        >
          <CheckSquare className="h-4 w-4" />
        </Button>
        
        <Button 
          variant={currentTool === 'x-mark' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setCurrentTool('x-mark')}
        >
          <XIcon className="h-4 w-4" />
        </Button>
        
        <Button 
          variant={currentTool === 'line' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setCurrentTool('line')}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <Button 
          variant={currentTool === 'eraser' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setCurrentTool('eraser')}
        >
          <Eraser className="h-4 w-4" />
        </Button>
        
        <Button 
          variant={currentTool === 'whiteout' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setCurrentTool('whiteout')}
        >
          <Edit3 className="h-4 w-4" />
        </Button>
        
        <Button 
          variant={currentTool === 'form' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setCurrentTool('form')}
        >
          <FormInput className="h-4 w-4" />
        </Button>
        
        <Button 
          variant={currentTool === 'signature' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setCurrentTool('signature')}
        >
          <Signature className="h-4 w-4" />
        </Button>
        
        <Button 
          variant={currentTool === 'image' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setCurrentTool('image')}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6" />
        
        <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Palette className="h-4 w-4 mr-1" />
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: annotationColor }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <ChromePicker 
              color={annotationColor}
              onChange={(color) => setAnnotationColor(color.hex)}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="view-tools flex items-center space-x-2">
        <div className="page-navigation flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm">
            {currentPage} / {totalPages}
          </span>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        <div className="zoom-controls flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm w-12 text-center">
            {zoom}%
          </span>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleRotate}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}