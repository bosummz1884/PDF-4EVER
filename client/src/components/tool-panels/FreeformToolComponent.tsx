import React from "react";
import { EditorToolProps } from "@/types/pdf-types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export const FreeformToolComponent: React.FC<EditorToolProps> = ({
  settings,
  onSettingChange,
}) => {
  return (
    <div className="space-y-4 p-4" data-oid="7xogdns">
      <div data-oid="b_tshoo">
        <Label className="text-xs" data-oid="3::qtlj">
          Brush Color
        </Label>
        <Input
          type="color"
          value={settings.color || "#000000"}
          onChange={(e) => onSettingChange("color", e.target.value)}
          className="w-full h-8 mt-1 p-0 cursor-pointer"
          data-oid="g23wxkj"
        />
      </div>
      <div data-oid="3gcwz8g">
        <Label className="text-xs" data-oid="zg44w4y">
          Brush Size: {settings.brushSize || 3}px
        </Label>
        <Slider
          value={[settings.brushSize || 3]}
          onValueChange={([val]) => onSettingChange("brushSize", val)}
          min={1}
          max={50}
          step={1}
          data-oid="fd991-y"
        />
      </div>
    </div>
  );
};
