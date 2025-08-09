// src/components/tool-panels/FreeformToolComponent.tsx

import React from "react";
import { EditorToolProps } from "@/types/pdf-types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// A component to visually preview the current brush style
const BrushPreview: React.FC<{ settings: EditorToolProps["settings"] }> = ({ settings }) => {
  const style: React.CSSProperties = {
    width: `${settings.brushSize || 3}px`,
    height: `${settings.brushSize || 3}px`,
    backgroundColor: settings.color || "#000000",
    borderRadius: "50%",
    opacity: settings.opacity ?? 1,
  };

  return (
    <div className="p-2 border rounded-md bg-white dark:bg-gray-800 flex items-center justify-center h-20">
      <div style={style} />
    </div>
  );
};


export const FreeformToolComponent: React.FC<EditorToolProps> = ({
  settings,
  onSettingChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Brush Color */}
      <div className="space-y-1.5">
        <Label className="text-xs">Brush Color</Label>
        <Input
          type="color"
          value={settings.color || "#000000"}
          onChange={(e) => onSettingChange("color", e.target.value)}
          className="w-full h-8 p-0 cursor-pointer"
        />
      </div>
      
      {/* Opacity Slider */}
      <div className="space-y-1.5">
        <Label className="text-xs">
          Opacity: {Math.round((settings.opacity ?? 1) * 100)}%
        </Label>
        <Slider
          value={[(settings.opacity ?? 1) * 100]}
          onValueChange={([val]) => onSettingChange("opacity", val / 100)}
          min={10}
          max={100}
          step={5}
        />
      </div>

      {/* Brush Size Slider */}
      <div className="space-y-1.5">
        <Label className="text-xs">Brush Size: {settings.brushSize || 3}px</Label>
        <Slider
          value={[settings.brushSize || 3]}
          onValueChange={([val]) => onSettingChange("brushSize", val)}
          min={1}
          max={50}
          step={1}
        />
      </div>
      
      {/* Smoothing Control */}
      <div className="space-y-1.5">
          <Label className="text-xs">Smoothing</Label>
          <Select
              value={settings.smoothing || "medium"}
              onValueChange={(value) => onSettingChange("smoothing", value as "none" | "low" | "medium" | "high")}
          >
              <SelectTrigger>
                  <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
              </SelectContent>
          </Select>
      </div>

      {/* Live Brush Preview */}
      <div className="space-y-1.5">
          <Label className="text-xs">Preview</Label>
          <BrushPreview settings={settings} />
      </div>
    </div>
  );
};