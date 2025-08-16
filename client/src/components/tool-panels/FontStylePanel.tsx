import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import { DetectedFont } from "@/types/pdf-types";
import { cn } from "@/lib/utils";

interface FontStylePanelProps {
  detectedFonts: DetectedFont[];
  selectedFont: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textColor: string;
  textAlign: "left" | "center" | "right" | "justify";
  onFontChange: (font: string) => void;
  onFontSizeChange: (size: number) => void;
  onFontWeightChange: (weight: "normal" | "bold") => void;
  onFontStyleChange: (style: "normal" | "italic") => void;
  onTextColorChange: (color: string) => void;
  onTextAlignChange: (align: "left" | "center" | "right" | "justify") => void;
  horizontal?: boolean;
}

export function FontStylePanel({
  detectedFonts,
  selectedFont,
  fontSize,
  fontWeight,
  fontStyle,
  textColor,
  textAlign,
  onFontChange,
  onFontSizeChange,
  onFontWeightChange,
  onFontStyleChange,
  onTextColorChange,
  onTextAlignChange,
  horizontal = false
}: FontStylePanelProps) {
  const systemFonts = [
    "Arial",
    "Times New Roman", 
    "Georgia",
    "Courier New",
    "Verdana",
    "Tahoma",
    "Impact",
    "Comic Sans MS"
  ];

  const availableFonts = [
    ...detectedFonts.map(font => ({
      value: font.fontFamily,
      label: `${font.fontFamily} (Detected)`,
      isDetected: true
    })),
    ...systemFonts.map(font => ({
      value: font,
      label: `${font} (System)`,
      isDetected: false
    }))
  ];

  // Remove duplicates
  const uniqueFonts = availableFonts.filter((font, index, self) => 
    index === self.findIndex(f => f.value === font.value)
  );

  if (horizontal) {
    return (
      <div className="flex items-center gap-4" data-testid="font-style-panel">
        {/* Font Family */}
        <Select value={selectedFont} onValueChange={onFontChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent>
            {uniqueFonts.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span className={cn(
                  font.isDetected ? "text-green-700" : "text-gray-700"
                )}>
                  {font.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Font Size */}
        <Input
          type="number"
          value={fontSize}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
          min="8"
          max="72"
          className="w-16"
        />
        
        {/* Style Buttons */}
        <div className="flex gap-1">
          <Button
            variant={fontWeight === "bold" ? "default" : "outline"}
            size="sm"
            onClick={() => onFontWeightChange(fontWeight === "bold" ? "normal" : "bold")}
            className="h-8 px-2"
          >
            <Bold className="h-3 w-3" />
          </Button>
          <Button
            variant={fontStyle === "italic" ? "default" : "outline"}
            size="sm"
            onClick={() => onFontStyleChange(fontStyle === "italic" ? "normal" : "italic")}
            className="h-8 px-2"
          >
            <Italic className="h-3 w-3" />
          </Button>
        </div>
        
        {/* Text Color */}
        <input
          type="color"
          value={textColor}
          onChange={(e) => onTextColorChange(e.target.value)}
          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
        />
        
        {/* Text Alignment */}
        <div className="flex gap-1">
          <Button
            variant={textAlign === "left" ? "default" : "outline"}
            size="sm"
            onClick={() => onTextAlignChange("left")}
            className="h-8 px-2"
          >
            <AlignLeft className="h-3 w-3" />
          </Button>
          <Button
            variant={textAlign === "center" ? "default" : "outline"}
            size="sm"
            onClick={() => onTextAlignChange("center")}
            className="h-8 px-2"
          >
            <AlignCenter className="h-3 w-3" />
          </Button>
          <Button
            variant={textAlign === "right" ? "default" : "outline"}
            size="sm"
            onClick={() => onTextAlignChange("right")}
            className="h-8 px-2"
          >
            <AlignRight className="h-3 w-3" />
          </Button>
          <Button
            variant={textAlign === "justify" ? "default" : "outline"}
            size="sm"
            onClick={() => onTextAlignChange("justify")}
            className="h-8 px-2"
          >
            <AlignJustify className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card data-testid="font-style-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Text Formatting</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Font Family Selector */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Font Family
          </Label>
          <Select value={selectedFont} onValueChange={onFontChange}>
            <SelectTrigger data-testid="select-font-family">
              <SelectValue placeholder="Select font..." />
            </SelectTrigger>
            <SelectContent>
              {uniqueFonts.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span className={cn(
                    font.isDetected ? "text-green-700" : "text-gray-700"
                  )}>
                    {font.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size and Style */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Size
            </Label>
            <Input
              type="number"
              value={fontSize}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
              min="8"
              max="72"
              className="text-sm"
              data-testid="input-font-size"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Style
            </Label>
            <div className="flex gap-1">
              <Button
                variant={fontWeight === "bold" ? "default" : "outline"}
                size="sm"
                onClick={() => onFontWeightChange(fontWeight === "bold" ? "normal" : "bold")}
                className="flex-1 h-8 px-2"
                data-testid="button-font-bold"
              >
                <Bold className="h-3 w-3" />
              </Button>
              
              <Button
                variant={fontStyle === "italic" ? "default" : "outline"}
                size="sm"
                onClick={() => onFontStyleChange(fontStyle === "italic" ? "normal" : "italic")}
                className="flex-1 h-8 px-2"
                data-testid="button-font-italic"
              >
                <Italic className="h-3 w-3" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 px-2"
                data-testid="button-font-underline"
              >
                <Underline className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Color Picker */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Text Color
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={textColor}
              onChange={(e) => onTextColorChange(e.target.value)}
              className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
              data-testid="input-text-color"
            />
            <Input
              type="text"
              value={textColor}
              onChange={(e) => onTextColorChange(e.target.value)}
              className="flex-1 text-sm font-mono"
              data-testid="input-color-hex"
            />
          </div>
        </div>

        {/* Text Alignment */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Alignment
          </Label>
          <div className="flex gap-1">
            <Button
              variant={textAlign === "left" ? "default" : "outline"}
              size="sm"
              onClick={() => onTextAlignChange("left")}
              className="flex-1 h-8"
              data-testid="button-align-left"
            >
              <AlignLeft className="h-3 w-3" />
            </Button>
            
            <Button
              variant={textAlign === "center" ? "default" : "outline"}
              size="sm"
              onClick={() => onTextAlignChange("center")}
              className="flex-1 h-8"
              data-testid="button-align-center"
            >
              <AlignCenter className="h-3 w-3" />
            </Button>
            
            <Button
              variant={textAlign === "right" ? "default" : "outline"}
              size="sm"
              onClick={() => onTextAlignChange("right")}
              className="flex-1 h-8"
              data-testid="button-align-right"
            >
              <AlignRight className="h-3 w-3" />
            </Button>
            
            <Button
              variant={textAlign === "justify" ? "default" : "outline"}
              size="sm"
              onClick={() => onTextAlignChange("justify")}
              className="flex-1 h-8"
              data-testid="button-align-justify"
            >
              <AlignJustify className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
