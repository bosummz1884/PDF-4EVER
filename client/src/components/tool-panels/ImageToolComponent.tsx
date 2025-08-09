// src/components/tool-panels/ImageToolComponent.tsx

import React from "react";
import { EditorToolProps } from "@/types/pdf-types";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RotateCcw, RotateCw } from "lucide-react";
import { usePDFEditor } from "@/features/pdf-editor/PDFEditorContext";

export const ImageToolComponent: React.FC<EditorToolProps> = ({
  settings,
  onSettingChange,
}) => {
  const { state, dispatch } = usePDFEditor();
  const { selectedElementId, selectedElementType, imageElements } = state;

  const isImageSelected = selectedElementType === 'image' && selectedElementId;

  const selectedImage = isImageSelected 
    ? Object.values(imageElements).flat().find(el => el.id === selectedElementId) 
    : null;

  const opacity = selectedImage?.opacity ?? settings.opacity ?? 1;
  const rotation = selectedImage?.rotation ?? settings.rotation ?? 0;

  // CORRECTED: Replaced 'any' with a specific union type for the properties we are changing.
  const handleSettingChangeForSelected = (key: 'opacity' | 'rotation', value: number) => {
    if (isImageSelected && selectedImage) { // Ensure selectedImage is not null
        dispatch({
            type: 'UPDATE_IMAGE_ELEMENT',
            payload: { page: selectedImage.page, id: selectedImage.id, updates: { [key]: value } }
        });
        dispatch({ type: 'SAVE_TO_HISTORY' });
    } else {
        // This correctly passes the specific key and value to the generic onSettingChange handler.
        onSettingChange(key, value);
    }
  };

  const rotateBy = (angle: number) => {
    handleSettingChangeForSelected('rotation', (rotation + angle) % 360);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {isImageSelected 
          ? "Adjust properties of the selected image." 
          : "Click on the page to upload and place a new image."
        }
      </p>
      
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
    </div>
  );
};