import React from "react";
import { EditorToolProps } from "../pdf-editor/toolRegistry";

const WhiteoutToolComponent: React.FC<EditorToolProps> = ({
  isActive,
  settings,
  onSettingChange,
}) => {
  if (!isActive) return null;

  return (
    <div className="space-y-4 p-4" data-oid=".efsi3s">
      <h3 className="text-sm font-medium" data-oid="oh367.o">
        Whiteout Tool
      </h3>

      <div className="space-y-2" data-oid="yqabywb">
        <label className="text-xs font-medium" data-oid="zh9d9uy">
          Brush Size: {(settings.brushSize as number) || 20}px
        </label>
        <input
          type="range"
          value={(settings.brushSize as number) || 20}
          onChange={(e) =>
            onSettingChange("brushSize", parseInt(e.target.value))
          }
          className="w-full"
          min="5"
          max="100"
          step="5"
          data-oid="ghalo8-"
        />
      </div>

      <div className="space-y-2" data-oid="fnrjr9f">
        <label className="text-xs font-medium" data-oid="w:4miya">
          Whiteout Color
        </label>
        <div className="flex gap-2" data-oid="9bugqg-">
          <input
            type="color"
            value={(settings.color as string) || "#FFFFFF"}
            onChange={(e) => onSettingChange("color", e.target.value)}
            className="w-8 h-8 border rounded"
            data-oid="9o8a3hx"
          />

          <select
            value={(settings.color as string) || "#FFFFFF"}
            onChange={(e) => onSettingChange("color", e.target.value)}
            className="flex-1 px-2 py-1 text-xs border rounded"
            data-oid="jwppj5d"
          >
            <option value="#FFFFFF" data-oid="g9rjy_y">
              White
            </option>
            <option value="#F5F5F5" data-oid="7xtx20n">
              Off-White
            </option>
            <option value="#FFFACD" data-oid="kurx9v2">
              Cream
            </option>
            <option value="#FFF8DC" data-oid=":xnfbpt">
              Cornsilk
            </option>
            <option value="custom" data-oid="t1orfw7">
              Custom
            </option>
          </select>
        </div>
      </div>

      <div className="space-y-2" data-oid="4cd4wcc">
        <label className="text-xs font-medium" data-oid="rq.5jh2">
          Opacity: {Math.round(((settings.opacity as number) || 1) * 100)}%
        </label>
        <input
          type="range"
          value={(settings.opacity as number) || 1}
          onChange={(e) =>
            onSettingChange("opacity", parseFloat(e.target.value))
          }
          className="w-full"
          min="0.5"
          max="1"
          step="0.1"
          data-oid="wj63zfh"
        />
      </div>

      <div className="space-y-2" data-oid="cr4xhry">
        <label className="text-xs font-medium" data-oid="40rmf0h">
          Brush Shape
        </label>
        <select
          value={(settings.brushShape as string) || "round"}
          onChange={(e) => onSettingChange("brushShape", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
          data-oid="lkw8luy"
        >
          <option value="round" data-oid="p18lhhg">
            Round
          </option>
          <option value="square" data-oid=".sup2ff">
            Square
          </option>
          <option value="soft" data-oid="8z4rnn_">
            Soft Round
          </option>
        </select>
      </div>

      <div className="space-y-2" data-oid="zk:qj_4">
        <label className="text-xs font-medium" data-oid="p6mh4bg">
          Application Mode
        </label>
        <select
          value={(settings.mode as string) || "paint"}
          onChange={(e) => onSettingChange("mode", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
          data-oid="v3juqwg"
        >
          <option value="paint" data-oid="39k6xcm">
            Paint Over
          </option>
          <option value="block" data-oid="sdp5ty:">
            Block Selection
          </option>
          <option value="precise" data-oid=".xxt9-4">
            Precise Coverage
          </option>
        </select>
      </div>

      <div className="flex gap-2" data-oid="ue61xdp">
        <label className="flex items-center text-xs" data-oid="1rs-:sx">
          <input
            type="checkbox"
            checked={(settings.smoothing as boolean) || true}
            onChange={(e) => onSettingChange("smoothing", e.target.checked)}
            className="mr-1"
            data-oid="vokth2z"
          />
          Smooth Edges
        </label>
        <label className="flex items-center text-xs" data-oid="cjy84w5">
          <input
            type="checkbox"
            checked={(settings.pressure as boolean) || false}
            onChange={(e) => onSettingChange("pressure", e.target.checked)}
            className="mr-1"
            data-oid="cpeepfu"
          />
          Pressure Sensitive
        </label>
      </div>

      <div
        className="p-2 border rounded bg-gray-50 flex justify-center"
        data-oid="3j:qz5n"
      >
        <div
          style={{
            width: `${Math.min((settings.brushSize as number) || 20, 40)}px`,
            height: `${Math.min((settings.brushSize as number) || 20, 40)}px`,
            backgroundColor: (settings.color as string) || "#FFFFFF",
            opacity: (settings.opacity as number) || 1,
            borderRadius:
              settings.brushShape === "round"
                ? "50%"
                : settings.brushShape === "soft"
                  ? "30%"
                  : "0",
            border: "1px solid #ccc",
          }}
          data-oid="dwzck-."
        />
      </div>
    </div>
  );
};

export default WhiteoutToolComponent;
