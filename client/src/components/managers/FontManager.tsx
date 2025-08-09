// src/components/managers/FontManager.tsx

import React from "react";
import { useFonts } from "@/contexts/FontContext";
import { FontManagerProps } from "@/types/pdf-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // FIXED: Added missing import
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Type, Bold, Italic } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

export const FontManager: React.FC<
  Omit<
    FontManagerProps,
    "onFontWeightChange" | "onFontStyleChange" | "fontWeight" | "fontStyle"
  > & {
    onStyleChange: (style: {
      bold: boolean;
      italic: boolean;
    }) => void;
    styles: {
      bold: boolean;
      italic: boolean;
    };
  }
> = ({
  selectedFont,
  onFontChange,
  fontSize,
  onFontSizeChange,
  onStyleChange,
  styles,
}) => {
  const { availableFonts, isLoading } = useFonts();

  const handleBoldToggle = () => {
    onStyleChange({ ...styles, bold: !styles.bold });
  };

  const handleItalicToggle = () => {
    onStyleChange({ ...styles, italic: !styles.italic });
  };

  return (
    <div className="space-y-4">
      {/* Font Family Selection */}
      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1.5">
          <Type size={12} /> Font Family
        </Label>
        <Select
          value={selectedFont}
          onValueChange={onFontChange}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={isLoading ? "Loading fonts..." : "Select font"} />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-64">
              {availableFonts.map((font) => (
                <SelectItem key={font} value={font}>
                  <span style={{ fontFamily: font }}>{font}</span>
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>

      {/* Font Size and Style */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Font Size</Label>
          <Input
            type="number"
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="w-full"
            min={6}
            max={288}
            placeholder="Size"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Style</Label>
          <ToggleGroup type="multiple" value={Object.keys(styles).filter(k => styles[k as keyof typeof styles])} className="w-full">
            <ToggleGroupItem
              value="bold"
              aria-label="Toggle bold"
              onClick={handleBoldToggle}
              className="w-full"
            >
              <Bold size={16} />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="italic"
              aria-label="Toggle italic"
              onClick={handleItalicToggle}
              className="w-full"
            >
              <Italic size={16} />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
};