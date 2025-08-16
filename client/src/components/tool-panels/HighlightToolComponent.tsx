// src/components/tool-panels/HighlightToolComponent.tsx

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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#FFFF00" },
  { name: "Pink", value: "#FFC0CB" },
  { name: "Green", value: "#90EE90" },
  { name: "Blue", value: "#ADD8E6" },
];

export const HighlightToolComponent: React.FC<EditorToolProps & { compact?: boolean }> = ({
  settings,
  onSettingChange,
  compact = false,
}) => {
  const currentColor = settings.color || "#FFFF00";

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Color Picker */}
        <Input
          type="color"
          value={currentColor}
          onChange={(e) => onSettingChange("color", e.target.value)}
          className="w-8 h-8 p-0 cursor-pointer"
          title="Highlight Color"
        />
        
        {/* Color Presets */}
        {HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color.name}
            className={`w-6 h-6 rounded border-2 ${
              currentColor.toUpperCase() === color.value ? 'border-primary' : 'border-gray-300'
            }`}
            style={{ backgroundColor: color.value }}
            onClick={() => onSettingChange("color", color.value)}
            title={color.name}
          />
        ))}
        
        {/* Opacity */}
        <Input
          type="range"
          min={10}
          max={100}
          step={5}
          value={(settings.opacity || 0.5) * 100}
          onChange={(e) => onSettingChange("opacity", parseInt(e.target.value) / 100)}
          className="w-20"
          title={`Opacity: ${Math.round((settings.opacity || 0.5) * 100)}%`}
        />
        
        {/* Blend Mode */}
        <Select
          value={settings.blendMode || "multiply"}
          onValueChange={(value) => onSettingChange("blendMode", value as "multiply" | "overlay" | "screen" | "normal")}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="multiply">Multiply</SelectItem>
            <SelectItem value="overlay">Overlay</SelectItem>
            <SelectItem value="screen">Screen</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Highlight Style */}
      <div className="space-y-1.5">
        <Label className="text-xs">Highlight Style</Label>
        <Select
          value={settings.style || "solid"}
          onValueChange={(value) =>
            onSettingChange(
              "style",
              value as "solid" | "underline" | "strikethrough" | "squiggly",
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Solid</SelectItem>
            <SelectItem value="underline">Underline</SelectItem>
            <SelectItem value="strikethrough">Strikethrough</SelectItem>
            <SelectItem value="squiggly">Squiggly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Color Palette & Picker */}
      <div className="space-y-1.5">
        <Label className="text-xs">Highlight Color</Label>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={currentColor}
            onChange={(e) => onSettingChange("color", e.target.value)}
            className="w-10 h-10 p-0 cursor-pointer"
          />
          <ToggleGroup
            type="single"
            value={currentColor.toUpperCase()}
            onValueChange={(value) => {
              if (value) {
                onSettingChange("color", value);
              }
            }}
            className="grid grid-cols-4 gap-1 w-full"
          >
            {HIGHLIGHT_COLORS.map((color) => (
              <ToggleGroupItem
                key={color.name}
                value={color.value}
                aria-label={color.name}
                className={cn(
                  "w-full h-10 rounded-md border-2 border-transparent focus:z-10",
                  "data-[state=on]:border-primary",
                )}
                style={{ backgroundColor: color.value }}
              />
            ))}
          </ToggleGroup>
        </div>
      </div>

      {/* Opacity Slider */}
      <div className="space-y-1.5">
        <Label className="text-xs">
          Opacity: {Math.round((settings.opacity || 0.5) * 100)}%
        </Label>
        <Slider
          value={[(settings.opacity || 0.5) * 100]}
          onValueChange={([val]) => onSettingChange("opacity", val / 100)}
          min={10}
          max={100}
          step={5}
        />
      </div>

      {/* Blend Mode */}
      <div className="space-y-1.5">
        <Label className="text-xs">Blend Mode</Label>
        <Select
          value={settings.blendMode || "multiply"}
          onValueChange={(value) =>
            onSettingChange(
              "blendMode",
              value as "multiply" | "overlay" | "screen" | "normal",
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select blend mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="multiply">Multiply (Recommended)</SelectItem>
            <SelectItem value="overlay">Overlay</SelectItem>
            <SelectItem value="screen">Screen</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground pt-1">
          `&lsquo;` Multiply `&lsquo;` provides the most natural, ink-like appearance.
        </p>
      </div>
    </div>
  );
};