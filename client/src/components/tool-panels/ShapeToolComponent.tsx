// src/components/tool-panels/ShapeToolComponent.tsx

import React from "react";
import { EditorToolProps, ToolType } from "@/types/pdf-types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePDFEditor } from "@/features/pdf-editor/PDFEditorContext";

// A new component to visually preview the current shape style
const StylePreview: React.FC<{
  settings: EditorToolProps["settings"];
  tool: ToolType;
}> = ({ settings, tool }) => {
  const isLine = tool === "line";
  const style: React.CSSProperties = {
    width: "100%",
    height: isLine ? "2px" : "50px",
    backgroundColor: settings.fillColor === "transparent" ? "#ffffff" : settings.fillColor,
    borderStyle: settings.strokeStyle || "solid",
    borderWidth: `${settings.strokeWidth || 2}px`,
    borderColor: settings.strokeColor || "#000000",
    borderRadius: tool === "rectangle" ? `${settings.cornerRadius || 0}px` : (tool === "circle" ? "50%" : "0"),
    opacity: settings.opacity,
  };

  if (isLine) {
    style.backgroundColor = settings.strokeColor || "#000000";
    style.border = "none";
  }

  return (
    <div className="p-2 border rounded-md bg-white dark:bg-gray-800 flex items-center justify-center">
      <div style={style} />
    </div>
  );
};

export const ShapeToolComponent: React.FC<EditorToolProps & { compact?: boolean }> = ({
  settings,
  onSettingChange,
  compact = false,
}) => {
  const { state } = usePDFEditor();
  const { currentTool } = state;

  const isLine = currentTool === "line";
  const isRectangle = currentTool === "rectangle";

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Stroke Color */}
        <Input
          type="color"
          value={settings.strokeColor || "#000000"}
          onChange={(e) => onSettingChange("strokeColor", e.target.value)}
          className="w-8 h-8 p-0 cursor-pointer"
          title="Stroke Color"
        />
        
        {/* Fill Color (Not for lines) */}
        {!isLine && (
          <Input
            type="color"
            value={settings.fillColor === "transparent" ? "#ffffff" : settings.fillColor}
            onChange={(e) => onSettingChange("fillColor", e.target.value)}
            className="w-8 h-8 p-0 cursor-pointer"
            title="Fill Color"
          />
        )}
        
        {/* Stroke Width */}
        <Input
          type="number"
          value={settings.strokeWidth || 2}
          onChange={(e) => onSettingChange("strokeWidth", parseInt(e.target.value) || 2)}
          className="w-16"
          min={1}
          max={50}
          title="Stroke Width"
        />
        
        {/* Stroke Style */}
        <Select
          value={settings.strokeStyle || "solid"}
          onValueChange={(value) => onSettingChange("strokeStyle", value as "solid" | "dashed" | "dotted")}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Solid</SelectItem>
            <SelectItem value="dashed">Dashed</SelectItem>
            <SelectItem value="dotted">Dotted</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Corner Radius (Only for rectangles) */}
        {isRectangle && (
          <Input
            type="number"
            value={settings.cornerRadius || 0}
            onChange={(e) => onSettingChange("cornerRadius", parseInt(e.target.value) || 0)}
            className="w-16"
            min={0}
            max={50}
            title="Corner Radius"
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stroke Color */}
      <div className="space-y-1.5">
        <Label className="text-xs">Stroke Color</Label>
        <Input
          type="color"
          value={settings.strokeColor || "#000000"}
          onChange={(e) => onSettingChange("strokeColor", e.target.value)}
          className="w-full h-8 p-0 cursor-pointer"
        />
      </div>

      {/* Fill Color (Not for lines) */}
      {!isLine && (
        <div className="space-y-1.5">
          <Label className="text-xs">Fill Color</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={settings.fillColor === "transparent" ? "#ffffff" : settings.fillColor}
              onChange={(e) => onSettingChange("fillColor", e.target.value)}
              className="w-full h-8 p-0 cursor-pointer"
            />
            <Button
              variant={settings.fillColor === "transparent" ? "secondary" : "ghost"}
              className="text-xs p-2 h-8"
              onClick={() => onSettingChange("fillColor", "transparent")}
            >
              Transparent
            </Button>
          </div>
        </div>
      )}

      {/* Opacity (Not for lines) */}
      {!isLine && (
          <div className="space-y-1.5">
              <Label className="text-xs">Fill Opacity: {Math.round((settings.opacity ?? 1) * 100)}%</Label>
              <Slider
                  value={[(settings.opacity ?? 1) * 100]}
                  onValueChange={([val]) => onSettingChange("opacity", val / 100)}
                  min={0}
                  max={100}
                  step={5}
              />
          </div>
      )}

      {/* Stroke Width */}
      <div className="space-y-1.5">
        <Label className="text-xs">Stroke Width: {settings.strokeWidth || 2}px</Label>
        <Slider
          value={[settings.strokeWidth || 2]}
          onValueChange={([val]) => onSettingChange("strokeWidth", val)}
          min={1}
          max={50}
          step={1}
        />
      </div>
      
      {/* Stroke Style */}
      <div className="space-y-1.5">
          <Label className="text-xs">Stroke Style</Label>
          <Select
              value={settings.strokeStyle || "solid"}
              onValueChange={(value) => onSettingChange("strokeStyle", value as "solid" | "dashed" | "dotted")}
          >
              <SelectTrigger>
                  <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
              </SelectContent>
          </Select>
      </div>

      {/* Corner Radius (Only for rectangles) */}
      {isRectangle && (
        <div className="space-y-1.5">
          <Label className="text-xs">Corner Radius: {settings.cornerRadius || 0}px</Label>
          <Slider
            value={[settings.cornerRadius || 0]}
            onValueChange={([val]) => onSettingChange("cornerRadius", val)}
            min={0}
            max={50}
            step={1}
          />
        </div>
      )}

      {/* Live Style Preview */}
      <div className="space-y-1.5">
          <Label className="text-xs">Preview</Label>
          <StylePreview settings={settings} tool={currentTool} />
      </div>
    </div>
  );
};