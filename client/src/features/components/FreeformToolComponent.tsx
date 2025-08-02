import React from 'react';
import { EditorToolProps } from '../pdf-editor/toolRegistry';

const FreeformToolComponent: React.FC<EditorToolProps> = ({
  isActive,
  settings,
  onSettingChange,
}) => {
  if (!isActive) return null;

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">Freeform Tool</h3>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={(settings.color as string) || "#000000"}
            onChange={(e) => onSettingChange("color", e.target.value)}
            className="w-8 h-8 border rounded"
          />
          <input
            type="text"
            value={(settings.color as string) || "#000000"}
            onChange={(e) => onSettingChange("color", e.target.value)}
            className="flex-1 px-2 py-1 text-xs border rounded"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">
          Brush Size: {(settings.brushSize as number) || 3}px
        </label>
        <input
          type="range"
          value={(settings.brushSize as number) || 3}
          onChange={(e) => onSettingChange("brushSize", parseInt(e.target.value))}
          className="w-full"
          min="1"
          max="20"
          step="1"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Brush Style</label>
        <select
          value={(settings.brushStyle as string) || "solid"}
          onChange={(e) => onSettingChange("brushStyle", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Smoothing</label>
        <select
          value={(settings.smoothing as string) || "medium"}
          onChange={(e) => onSettingChange("smoothing", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="none">None</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
    </div>
  );
};

export default FreeformToolComponent;