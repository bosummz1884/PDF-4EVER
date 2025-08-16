// src/components/tool-panels/ImageToolComponent.tsx

import React, { useRef } from "react";
import { EditorToolProps } from "@/types/pdf-types";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, RotateCw, Upload, Palette } from "lucide-react";
import { usePDFEditor } from "@/features/pdf-editor/PDFEditorContext";

export const ImageToolComponent: React.FC<EditorToolProps & { compact?: boolean }> = ({
  settings,
  onSettingChange,
  compact = false,
}) => {
  const { state, dispatch } = usePDFEditor();
  const { selectedElementId, selectedElementType, imageElements, currentPage } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImageSelected = selectedElementType === 'image' && selectedElementId;

  const selectedImage = isImageSelected 
    ? Object.values(imageElements).flat().find(el => el.id === selectedElementId) 
    : null;

  const opacity = selectedImage?.opacity ?? settings.opacity ?? 1;
  const rotation = selectedImage?.rotation ?? settings.rotation ?? 0;
  const borderWidth = selectedImage?.borderWidth ?? settings.borderWidth ?? 0;
  const borderColor = selectedImage?.borderColor ?? settings.borderColor ?? '#000000';

  // Enhanced to support more image properties
  const handleSettingChangeForSelected = (key: 'opacity' | 'rotation' | 'borderWidth' | 'borderColor', value: number | string) => {
    if (isImageSelected && selectedImage) {
        dispatch({
            type: 'UPDATE_IMAGE_ELEMENT',
            payload: { page: selectedImage.page, id: selectedImage.id, updates: { [key]: value } }
        });
        dispatch({ type: 'SAVE_TO_HISTORY' });
    } else {
        onSettingChange(key, value);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, WebP, or SVG)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image file is too large. Please select a file smaller than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Calculate appropriate size (max 300px width/height)
        const maxSize = 300;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }

        const newImageElement = {
          id: `image-${Date.now()}`,
          page: currentPage,
          src,
          x: 100,
          y: 100,
          width,
          height,
          rotation: 0,
          opacity: 1,
          borderWidth: 0,
          borderColor: '#000000'
        };

        dispatch({ type: 'ADD_IMAGE_ELEMENT', payload: { page: currentPage, element: newImageElement } });
        dispatch({ type: 'SET_SELECTED_ELEMENTS', payload: { ids: [newImageElement.id], type: 'image' } });
        dispatch({ type: 'SAVE_TO_HISTORY' });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const rotateBy = (angle: number) => {
    handleSettingChangeForSelected('rotation', (rotation + angle) % 360);
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Upload Button */}
        <Button 
          onClick={() => fileInputRef.current?.click()} 
          size="sm"
          variant="outline"
        >
          <Upload className="h-3 w-3 mr-1" />
          Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
          onChange={handleImageUpload}
          className="hidden"
        />
        
        {/* Opacity */}
        <Input
          type="range"
          min={0}
          max={100}
          step={5}
          value={opacity * 100}
          onChange={(e) => handleSettingChangeForSelected("opacity", parseInt(e.target.value) / 100)}
          className="w-20"
          disabled={!isImageSelected}
          title={`Opacity: ${Math.round(opacity * 100)}%`}
        />
        
        {/* Rotation */}
        <Input
          type="number"
          value={rotation}
          onChange={(e) => handleSettingChangeForSelected("rotation", parseInt(e.target.value) || 0)}
          className="w-16"
          min={-360}
          max={360}
          disabled={!isImageSelected}
          title="Rotation"
        />
        
        {/* Rotate Buttons */}
        <Button variant="outline" size="sm" onClick={() => rotateBy(-90)} disabled={!isImageSelected}>
          <RotateCcw className="h-3 w-3"/>
        </Button>
        <Button variant="outline" size="sm" onClick={() => rotateBy(90)} disabled={!isImageSelected}>
          <RotateCw className="h-3 w-3"/>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {isImageSelected 
          ? "Adjust properties of the selected image." 
          : "Upload and place a new image on the page."
        }
      </p>
      
      {/* Image Upload */}
      {!isImageSelected && (
        <div className="space-y-2">
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            className="w-full"
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
            onChange={handleImageUpload}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground">
            Supports JPEG, PNG, GIF, WebP, SVG (max 10MB)
          </p>
        </div>
      )}
      
      {/* Opacity Slider */}
      <div className="space-y-1.5">
        <Label className="text-xs">
          Opacity: {Math.round(opacity * 100)}%
        </Label>
        <Slider
          value={[opacity * 100]}
          onValueChange={([val]) => handleSettingChangeForSelected("opacity", val / 100)}
          min={0}
          max={100}
          step={5}
          disabled={!isImageSelected}
        />
      </div>

      {/* Rotation Controls */}
      <div className="space-y-1.5">
          <Label className="text-xs">Rotation: {rotation}°</Label>
          <div className="flex items-center gap-2">
              <Input
                  type="number"
                  value={rotation}
                  onChange={(e) => handleSettingChangeForSelected("rotation", parseInt(e.target.value) || 0)}
                  className="w-full"
                  min={-360}
                  max={360}
                  disabled={!isImageSelected}
              />
              <Button variant="outline" size="icon" onClick={() => rotateBy(-90)} disabled={!isImageSelected}>
                  <RotateCcw size={16}/>
              </Button>
               <Button variant="outline" size="icon" onClick={() => rotateBy(90)} disabled={!isImageSelected}>
                  <RotateCw size={16}/>
               </Button>
          </div>
          <Slider
            value={[rotation]}
            onValueChange={([val]) => handleSettingChangeForSelected("rotation", val)}
            min={0}
            max={360}
            step={1}
            disabled={!isImageSelected}
        />
      </div>

      {/* Border Controls */}
      <div className="space-y-1.5">
        <Label className="text-xs">Border Width: {borderWidth}px</Label>
        <Slider
          value={[borderWidth]}
          onValueChange={([val]) => handleSettingChangeForSelected("borderWidth", val)}
          min={0}
          max={20}
          step={1}
          disabled={!isImageSelected}
        />
      </div>

      {/* Border Color */}
      {borderWidth > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs">Border Color</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={borderColor}
              onChange={(e) => handleSettingChangeForSelected("borderColor", e.target.value)}
              className="w-12 h-8 p-1 border rounded"
              disabled={!isImageSelected}
            />
            <Input
              type="text"
              value={borderColor}
              onChange={(e) => handleSettingChangeForSelected("borderColor", e.target.value)}
              className="flex-1"
              placeholder="#000000"
              disabled={!isImageSelected}
            />
          </div>
        </div>
      )}

      {/* Image Info */}
      {isImageSelected && selectedImage && (
        <div className="pt-2 border-t space-y-1">
          <p className="text-xs text-muted-foreground">
            Size: {Math.round(selectedImage.width)} × {Math.round(selectedImage.height)}px
          </p>
          <p className="text-xs text-muted-foreground">
            Position: ({Math.round(selectedImage.x)}, {Math.round(selectedImage.y)})
          </p>
        </div>
      )}
    </div>
  );
};