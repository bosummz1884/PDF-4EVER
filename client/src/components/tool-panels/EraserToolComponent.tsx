// src/components/tool-panels/EraserToolComponent.tsx

import React from "react";
import { EditorToolProps } from "@/types/pdf-types";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export const EraserToolComponent: React.FC<EditorToolProps & { compact?: boolean }> = ({
  settings,
  onSettingChange,
  compact = false,
}) => {
  const eraserSize = settings.size || 20;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Size:</span>
        <Slider
          value={[eraserSize]}
          onValueChange={([val]) => onSettingChange("size", val)}
          min={5}
          max={100}
          step={1}
          className="w-24"
        />
        <span className="text-xs font-mono w-8">{eraserSize}px</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Eraser Size Slider */}
      <div className="space-y-1.5">
        <Label className="text-xs">Eraser Size: {eraserSize}px</Label>
        <Slider
          value={[eraserSize]}
          onValueChange={([val]) => onSettingChange("size", val)}
          min={5}
          max={100}
          step={1}
        />
      </div>

      {/* Eraser Size Preview */}
      <div className="space-y-1.5">
        <Label className="text-xs">Preview</Label>
        <div className="p-2 border rounded-md bg-white dark:bg-gray-800 flex items-center justify-center h-28">
          <div
            style={{
              width: `${eraserSize}px`,
              height: `${eraserSize}px`,
              borderRadius: "50%",
              backgroundColor: "hsl(var(--muted-foreground) / 0.5)",
              border: "1px dashed hsl(var(--muted-foreground))",
            }}
          />
        </div>
      </div>
    </div>
  );
};