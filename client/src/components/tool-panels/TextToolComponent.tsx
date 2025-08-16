// src/components/tool-panels/TextToolComponent.tsx

import React from "react";
import { EditorToolProps } from "@/types/pdf-types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FontManager } from "@/components/managers/FontManager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "../ui/slider";

// A component to visually preview the current text style
const TextPreview: React.FC<{ settings: EditorToolProps["settings"] }> = ({
  settings,
}) => {
  const style: React.CSSProperties = {
    fontFamily: settings.fontFamily || "Helvetica",
    fontSize: `${settings.fontSize || 16}px`,
    color: settings.color || "#000000",
    fontWeight: settings.bold ? "bold" : "normal",
    fontStyle: settings.italic ? "italic" : "normal",
    textDecoration: settings.underline ? "underline" : "none",
    textAlign: settings.textAlign as React.CSSProperties["textAlign"],
    lineHeight: settings.lineHeight || 1.2,
    padding: "8px",
    border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius)",
    backgroundColor: "hsl(var(--background))",
    whiteSpace: "nowrap",
    overflow: "hidden",
  };

  return <div style={style}>The quick brown fox...</div>;
};

export const TextToolComponent: React.FC<EditorToolProps & { compact?: boolean }> = ({
  settings,
  onSettingChange,
  compact = false,
}) => {
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Font Family */}
        <Select
          value={settings.fontFamily || "Helvetica"}
          onValueChange={(value) => onSettingChange("fontFamily", value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Helvetica">Helvetica</SelectItem>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Times">Times</SelectItem>
            <SelectItem value="Courier">Courier</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Font Size */}
        <Input
          type="number"
          value={settings.fontSize || 16}
          onChange={(e) => onSettingChange("fontSize", parseInt(e.target.value) || 16)}
          className="w-16"
          min={8}
          max={72}
        />
        
        {/* Text Color */}
        <Input
          type="color"
          value={settings.color || "#000000"}
          onChange={(e) => onSettingChange("color", e.target.value)}
          className="w-8 h-8 p-0 cursor-pointer"
        />
        
        {/* Text Alignment */}
        <Select
          value={settings.textAlign || "left"}
          onValueChange={(value) => onSettingChange("textAlign", value as "left" | "center" | "right" | "justify")}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
            <SelectItem value="justify">Justify</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Font Manager Integration */}
      <FontManager
        selectedFont={settings.fontFamily || "Helvetica"}
        onFontChange={(font) => onSettingChange("fontFamily", font)}
        fontSize={settings.fontSize || 16}
        onFontSizeChange={(size) => onSettingChange("fontSize", size)}
        styles={{ bold: !!settings.bold, italic: !!settings.italic }}
        onStyleChange={(newStyles) => {
            onSettingChange("bold", newStyles.bold);
            onSettingChange("italic", newStyles.italic);
        }}
      />
      
      {/* Text Color */}
      <div className="space-y-1.5">
        <Label className="text-xs">Text Color</Label>
        <Input
          type="color"
          value={settings.color || "#000000"}
          onChange={(e) => onSettingChange("color", e.target.value)}
          className="w-full h-8 p-0 cursor-pointer"
        />
      </div>

      {/* Text Alignment */}
      <div className="space-y-1.5">
        <Label className="text-xs">Alignment</Label>
        <Select
          value={settings.textAlign || "left"}
          onValueChange={(value) =>
            onSettingChange(
              "textAlign",
              value as "left" | "center" | "right" | "justify",
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select alignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
            <SelectItem value="justify">Justify</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Line Height */}
      <div className="space-y-1.5">
        <Label className="text-xs">Line Height: {settings.lineHeight || 1.2}</Label>
        <Slider
          value={[(settings.lineHeight || 1.2) * 10]}
          onValueChange={([val]) => onSettingChange("lineHeight", val / 10)}
          min={8}
          max={30}
          step={1}
        />
      </div>

      {/* Live Style Preview */}
      <div className="space-y-1.5">
        <Label className="text-xs">Preview</Label>
        <TextPreview settings={settings} />
      </div>
    </div>
  );
};