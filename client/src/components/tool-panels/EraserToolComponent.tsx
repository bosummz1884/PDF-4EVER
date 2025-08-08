import React from "react";
import { EditorToolProps } from "@/types/pdf-types";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export const EraserToolComponent: React.FC<EditorToolProps> = ({
  settings,
  onSettingChange,
}) => {
  return (
    <div className="space-y-4 p-4" data-oid="iwi7rp0">
      <div data-oid="w6ukkc7">
        <Label className="text-xs" data-oid="rs0y1ga">
          Eraser Size: {settings.size || 20}px
        </Label>
        <Slider
          value={[settings.size || 20]}
          onValueChange={([val]) => onSettingChange("size", val)}
          min={5}
          max={100}
          step={5}
          data-oid="wah94m0"
        />
      </div>
    </div>
  );
};
