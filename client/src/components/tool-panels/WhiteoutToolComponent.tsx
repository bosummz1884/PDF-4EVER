// src/components/tool-panels/WhiteoutToolComponent.tsx

import React from "react";
import { EditorToolProps } from "@/types/pdf-types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { commonColors } from "@/features/utils/colorUtils";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { cn } from "@/lib/utils";

export const WhiteoutToolComponent: React.FC<EditorToolProps & { compact?: boolean }> = ({
  settings,
  onSettingChange,
  compact = false,
}) => {
  const currentColor = settings.color || "#FFFFFF";

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Color Picker */}
        <Input
          type="color"
          value={currentColor}
          onChange={(e) => onSettingChange("color", e.target.value)}
          className="w-8 h-8 p-0 cursor-pointer"
          title="Cover-Up Color"
        />
        
        {/* Common Colors */}
        {commonColors.slice(0, 5).map((color) => (
          <button
            key={color.name}
            className={`w-6 h-6 rounded border-2 ${
              currentColor.toUpperCase() === color.hex.toUpperCase() ? 'border-primary' : 'border-gray-300'
            }`}
            style={{ backgroundColor: color.hex }}
            onClick={() => onSettingChange("color", color.hex)}
            title={color.name}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Color Palette & Picker */}
      <div className="space-y-1.5">
        <Label className="text-xs">Cover-Up Color</Label>
        <div className="flex items-center gap-2">
            <Input
              type="color"
              value={currentColor}
              onChange={(e) => onSettingChange("color", e.target.value)}
              className="w-10 h-10 p-0 cursor-pointer"
            />
             <p className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md">{currentColor.toUpperCase()}</p>
        </div>
      </div>
      
      {/* Quick Select Colors */}
      <div className="space-y-1.5">
          <Label className="text-xs">Common Colors</Label>
          <ToggleGroup
            type="single"
            value={currentColor.toUpperCase()}
            onValueChange={(value) => {
              if (value) {
                onSettingChange("color", value);
              }
            }}
            className="grid grid-cols-5 gap-1 w-full"
          >
            {commonColors.slice(0, 10).map((color) => (
              <ToggleGroupItem
                key={color.name}
                value={color.hex.toUpperCase()}
                aria-label={color.name}
                className={cn(
                  "w-full h-8 rounded-md border-2 border-transparent focus:z-10",
                  "data-[state=on]:border-primary",
                )}
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </ToggleGroup>
      </div>

      <p className="text-[11px] text-muted-foreground pt-1">
          The `&quot;` Whiteout `&quot;` tool covers content with a solid color. For irreversible, secure redaction, a dedicated redaction tool should be used.
      </p>
    </div>
  );
};

export default WhiteoutToolComponent;