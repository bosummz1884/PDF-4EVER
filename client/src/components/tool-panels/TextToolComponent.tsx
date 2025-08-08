import React from "react";
import { EditorToolProps } from "../toolRegistry";

export const TextToolComponent: React.FC<EditorToolProps> = ({
  isActive,
  settings,
  onSettingChange,
}) => {
  if (!isActive) return null;

  return (
    <div className="space-y-4 p-4" data-oid="u7f4ya7">
      <h3 className="text-sm font-medium" data-oid="d1nfb-.">
        Text Tool
      </h3>

      <div className="space-y-2" data-oid="_6z86s0">
        <label className="text-xs font-medium" data-oid="in43akb">
          Font Family
        </label>
        <select
          value={settings.fontFamily || "Arial"}
          onChange={(e) => onSettingChange("fontFamily", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
          data-oid="p_v8-9h"
        >
          <option value="Arial" data-oid="fzdqr1x">
            Arial
          </option>
          <option value="Helvetica" data-oid="8id:uze">
            Helvetica
          </option>
          <option value="Times New Roman" data-oid="xcezkea">
            Times New Roman
          </option>
          <option value="Courier New" data-oid="lyj8lyg">
            Courier New
          </option>
          <option value="Georgia" data-oid="lzvr:tc">
            Georgia
          </option>
          <option value="Verdana" data-oid="_s94kx5">
            Verdana
          </option>
          <option value="Trebuchet MS" data-oid="qbmun6y">
            Trebuchet MS
          </option>
          <option value="Comic Sans MS" data-oid="n-lr:vh">
            Comic Sans MS
          </option>
        </select>
      </div>

      <div className="space-y-2" data-oid="fukqxu9">
        <label className="text-xs font-medium" data-oid="0x9_gts">
          Font Size: {settings.fontSize || 16}px
        </label>
        <input
          type="range"
          value={settings.fontSize || 16}
          onChange={(e) =>
            onSettingChange("fontSize", parseInt(e.target.value))
          }
          className="w-full"
          min="8"
          max="72"
          step="1"
          data-oid="2x-v.vq"
        />
      </div>

      <div className="space-y-2" data-oid="hcamt66">
        <label className="text-xs font-medium" data-oid="vjj44bs">
          Text Color
        </label>
        <div className="flex gap-2" data-oid="2r.18n9">
          <input
            type="color"
            value={settings.color || "#000000"}
            onChange={(e) => onSettingChange("color", e.target.value)}
            className="w-8 h-8 border rounded"
            data-oid="9fcwgd3"
          />

          <input
            type="text"
            value={settings.color || "#000000"}
            onChange={(e) => onSettingChange("color", e.target.value)}
            className="flex-1 px-2 py-1 text-xs border rounded"
            data-oid="d_qubc6"
          />
        </div>
      </div>

      <div className="space-y-2" data-oid="r3xho7k">
        <label className="text-xs font-medium" data-oid="92nhdyr">
          Text Style
        </label>
        <div className="flex gap-2" data-oid="g6aim.o">
          <button
            onClick={() => onSettingChange("bold", !settings.bold)}
            className={`px-2 py-1 text-xs border rounded font-bold ${
              settings.bold ? "bg-blue-100 border-blue-300" : "bg-white"
            }`}
            data-oid="hn89i2c"
          >
            B
          </button>
          <button
            onClick={() => onSettingChange("italic", !settings.italic)}
            className={`px-2 py-1 text-xs border rounded italic ${
              settings.italic ? "bg-blue-100 border-blue-300" : "bg-white"
            }`}
            data-oid="e4.ef6m"
          >
            I
          </button>
          <button
            onClick={() => onSettingChange("underline", !settings.underline)}
            className={`px-2 py-1 text-xs border rounded underline ${
              settings.underline ? "bg-blue-100 border-blue-300" : "bg-white"
            }`}
            data-oid="6.b504r"
          >
            U
          </button>
        </div>
      </div>

      <div className="space-y-2" data-oid="077mpxr">
        <label className="text-xs font-medium" data-oid="o8r-oxu">
          Text Alignment
        </label>
        <select
          value={settings.textAlign || "left"}
          onChange={(e) => onSettingChange("textAlign", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
          data-oid="888k_.j"
        >
          <option value="left" data-oid="2vv28x-">
            Left
          </option>
          <option value="center" data-oid="zuri5am">
            Center
          </option>
          <option value="right" data-oid="cp833o6">
            Right
          </option>
          <option value="justify" data-oid="5_30zj0">
            Justify
          </option>
        </select>
      </div>

      <div className="space-y-2" data-oid="2z-z8.h">
        <label className="text-xs font-medium" data-oid="tzl8zls">
          Line Height: {settings.lineHeight || 1.2}
        </label>
        <input
          type="range"
          value={settings.lineHeight || 1.2}
          onChange={(e) =>
            onSettingChange("lineHeight", parseFloat(e.target.value))
          }
          className="w-full"
          min="0.8"
          max="3"
          step="0.1"
          data-oid="_i4ufsv"
        />
      </div>

      <div className="p-2 border rounded bg-gray-50" data-oid="a36lxdo">
        <div
          style={{
            fontFamily: settings.fontFamily || "Arial",
            fontSize: `${Math.min(settings.fontSize || 16, 14)}px`,
            color: settings.color || "#000000",
            fontWeight: settings.bold ? "bold" : "normal",
            fontStyle: settings.italic ? "italic" : "normal",
            textDecoration: settings.underline ? "underline" : "none",
            textAlign: settings.textAlign || "left",
            lineHeight: settings.lineHeight || 1.2,
          }}
          data-oid="njcafbl"
        >
          Sample Text
        </div>
      </div>
    </div>
  );
};
