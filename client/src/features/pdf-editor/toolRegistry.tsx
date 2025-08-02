import React, {
  ReactNode,
  ComponentType,
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import {
  MousePointer,
  Type,
  Highlighter,
  Square,
  Circle,
  Edit3,
  Signature,
  Eraser,
  FormInput,
  Image as ImageIcon,
  CheckSquare,
  X as XIcon,
  Minus,
  FileText,
} from "lucide-react";
import { PDFEditorState } from "./PDFEditorContext";
import WhiteoutToolComponent from "../components/WhiteoutToolComponent";
import { ImageToolComponent } from "../components/ImageToolComponent";
import FreeformToolComponent from "../components/FreeformToolComponent";

export interface EditorToolProps {
  isActive: boolean;
  settings: Record<string, unknown>;
  onSettingChange: (key: string, value: unknown) => void;
  onToolAction?: (action: string, data?: unknown) => void;
  editorState: PDFEditorState;
}

export interface EditorState {
  currentTool: ToolType;
  hasSelection: boolean;
  hasContent: boolean;
  selectedElements: string[];
  zoom: number;
  currentPage: number;
  totalPages: number;
  canUndo: boolean;
  canRedo: boolean;
}

export type ToolType =
  | "select"
  | "whiteout"
  | "text"
  | "highlight"
  | "rectangle"
  | "circle"
  | "freeform"
  | "form"
  | "signature"
  | "eraser"
  | "checkmark"
  | "x-mark"
  | "line"
  | "image"
  | "inlineEdit"
  | "ocr";

export interface EditorTool {
  name: string;
  label: string;
  icon: ReactNode;
  component: ComponentType<EditorToolProps>;
  condition?: (state: EditorState) => boolean;
  category: string;
  shortcut?: string;
  requiresColor?: boolean;
  requiresFont?: boolean;
  requiresSize?: boolean;
  defaultSettings: Record<string, unknown>;
  description: string;
}

export interface ToolRegistryContextType {
  tools: Record<ToolType, EditorTool>;
  currentTool: ToolType;
  setCurrentTool: (tool: ToolType) => void;
  toolSettings: Record<ToolType, Record<string, unknown>>;
  updateToolSetting: (toolId: ToolType, key: string, value: unknown) => void;
  getToolSettings: (toolId: ToolType) => Record<string, unknown>;
  resetToolSettings: (toolId: ToolType) => void;
  getAvailableTools: (state: EditorState) => EditorTool[];
  getToolsByCategory: (category: string) => EditorTool[];
  editorState: EditorState;
  updateEditorState: (updates: Partial<EditorState>) => void;
}

const ToolRegistryContext = createContext<ToolRegistryContextType | undefined>(
  undefined
);

export const useToolRegistry = (): ToolRegistryContextType => {
  const context = useContext(ToolRegistryContext);
  if (!context) {
    throw new Error(
      "useToolRegistry must be used within a ToolRegistryProvider"
    );
  }
  return context;
};

const SelectToolComponent: React.FC<EditorToolProps> = ({
  isActive,
}) => {
  if (!isActive) return null;

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">Selection Tool</h3>
      <p className="text-xs text-gray-600">
        Click and drag to select elements. Hold Ctrl/Cmd to multi-select.
      </p>
    </div>
  );
};

const TextToolComponent: React.FC<EditorToolProps> = ({
  isActive,
  settings,
  onSettingChange,
}) => {
  if (!isActive) return null;

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">Text Tool</h3>

      <div className="space-y-2">
        <label className="text-xs font-medium">Font Size</label>
        <input
          type="number"
          value={(settings.fontSize as number) || 16}
          onChange={(e) =>
            onSettingChange("fontSize", parseInt(e.target.value))
          }
          className="w-full px-2 py-1 text-xs border rounded"
          min="8"
          max="72"
        />
      </div>

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
        <label className="text-xs font-medium">Font Family</label>
        <select
          value={(settings.fontFamily as string) || "Arial"}
          onChange={(e) => onSettingChange("fontFamily", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Georgia">Georgia</option>
        </select>
      </div>

      <div className="flex gap-2">
        <label className="flex items-center text-xs">
          <input
            type="checkbox"
            checked={(settings.bold as boolean) || false}
            onChange={(e) => onSettingChange("bold", e.target.checked)}
            className="mr-1"
          />
          Bold
        </label>
        <label className="flex items-center text-xs">
          <input
            type="checkbox"
            checked={(settings.italic as boolean) || false}
            onChange={(e) => onSettingChange("italic", e.target.checked)}
            className="mr-1"
          />
          Italic
        </label>
      </div>
    </div>
  );
};

const HighlightToolComponent: React.FC<EditorToolProps> = ({
  isActive,
  settings,
  onSettingChange,
}) => {
  if (!isActive) return null;

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">Highlight Tool</h3>

      <div className="space-y-2">
        <label className="text-xs font-medium">Highlight Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={(settings.color as string) || "#FFFF00"}
            onChange={(e) => onSettingChange("color", e.target.value)}
            className="w-8 h-8 border rounded"
          />
          <input
            type="text"
            value={(settings.color as string) || "#FFFF00"}
            onChange={(e) => onSettingChange("color", e.target.value)}
            className="flex-1 px-2 py-1 text-xs border rounded"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">
          Opacity: {Math.round(((settings.opacity as number) || 0.5) * 100)}%
        </label>
        <input
          type="range"
          value={(settings.opacity as number) || 0.5}
          onChange={(e) =>
            onSettingChange("opacity", parseFloat(e.target.value))
          }
          className="w-full"
          min="0.1"
          max="1"
          step="0.1"
        />
      </div>
    </div>
  );
};

const ShapeToolComponent: React.FC<EditorToolProps> = ({
  isActive,
  settings,
  onSettingChange,
}) => {
  if (!isActive) return null;

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">Shape Tool</h3>

      <div className="space-y-2">
        <label className="text-xs font-medium">Stroke Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={(settings.strokeColor as string) || "#000000"}
            onChange={(e) => onSettingChange("strokeColor", e.target.value)}
            className="w-8 h-8 border rounded"
          />
          <input
            type="text"
            value={(settings.strokeColor as string) || "#000000"}
            onChange={(e) => onSettingChange("strokeColor", e.target.value)}
            className="flex-1 px-2 py-1 text-xs border rounded"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Fill Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={(settings.fillColor as string) || "transparent"}
            onChange={(e) => onSettingChange("fillColor", e.target.value)}
            className="w-8 h-8 border rounded"
          />
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={(settings.fillColor as string) !== "transparent"}
              onChange={(e) =>
                onSettingChange(
                  "fillColor",
                  e.target.checked ? "#FFFFFF" : "transparent"
                )
              }
              className="mr-1"
            />
            Fill
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">
          Stroke Width: {(settings.strokeWidth as number) || 2}px
        </label>
        <input
          type="range"
          value={(settings.strokeWidth as number) || 2}
          onChange={(e) =>
            onSettingChange("strokeWidth", parseInt(e.target.value))
          }
          className="w-full"
          min="1"
          max="10"
          step="1"
        />
      </div>
    </div>
  );
};

// Create a wrapper component for SignatureToolComponent to match EditorToolProps
const SignatureToolWrapper: React.FC<EditorToolProps> = ({
  isActive,
  settings,
  onSettingChange,
  onToolAction,
}) => {
  if (!isActive) return null;

  return (
        <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">Signature Tool</h3>

      <div className="space-y-2">
        <label className="text-xs font-medium">Signature Text</label>
        <input
          type="text"
          value={(settings.signatureText as string) || ""}
          onChange={(e) => onSettingChange("signatureText", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
          placeholder="Enter your signature text"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Font Family</label>
        <select
          value={(settings.signatureFont as string) || "Dancing Script"}
          onChange={(e) => onSettingChange("signatureFont", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="Dancing Script">Dancing Script</option>
          <option value="Pacifico">Pacifico</option>
          <option value="Great Vibes">Great Vibes</option>
          <option value="Satisfy">Satisfy</option>
          <option value="Kaushan Script">Kaushan Script</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Font Size</label>
        <input
          type="number"
          value={(settings.fontSize as number) || 24}
          onChange={(e) =>
            onSettingChange("fontSize", parseInt(e.target.value))
          }
          className="w-full px-2 py-1 text-xs border rounded"
          min="12"
          max="48"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={(settings.color as string) || "#000080"}
            onChange={(e) => onSettingChange("color", e.target.value)}
            className="w-8 h-8 border rounded"
          />
          <input
            type="text"
            value={(settings.color as string) || "#000080"}
            onChange={(e) => onSettingChange("color", e.target.value)}
            className="flex-1 px-2 py-1 text-xs border rounded"
          />
        </div>
      </div>

      <button
        onClick={() => onToolAction?.("createSignature")}
        className="w-full px-2 py-2 text-xs bg-blue-100 text-blue-700 border border-blue-300 rounded hover:bg-blue-200"
      >
        Create Signature
      </button>
    </div>
  );
};

const EraserToolComponent: React.FC<EditorToolProps> = ({
  isActive,
  settings,
  onSettingChange,
}) => {
  if (!isActive) return null;

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">Eraser Tool</h3>

      <div className="space-y-2">
        <label className="text-xs font-medium">
          Eraser Size: {(settings.size as number) || 20}px
        </label>
        <input
          type="range"
          value={(settings.size as number) || 20}
          onChange={(e) => onSettingChange("size", parseInt(e.target.value))}
          className="w-full"
          min="5"
          max="50"
          step="1"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">
          Opacity: {Math.round(((settings.opacity as number) || 1) * 100)}%
        </label>
        <input
          type="range"
          value={(settings.opacity as number) || 1}
          onChange={(e) =>
            onSettingChange("opacity", parseFloat(e.target.value))
          }
          className="w-full"
          min="0.1"
          max="1"
          step="0.1"
        />
      </div>
    </div>
  );
};

const FormToolComponent: React.FC<EditorToolProps> = ({
  isActive,
  settings,
  onSettingChange,
}) => {
  if (!isActive) return null;

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">Form Tool</h3>

      <div className="space-y-2">
        <label className="text-xs font-medium">Field Type</label>
        <select
          value={(settings.fieldType as string) || "text"}
          onChange={(e) => onSettingChange("fieldType", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="text">Text Field</option>
          <option value="textarea">Text Area</option>
          <option value="checkbox">Checkbox</option>
          <option value="radio">Radio Button</option>
          <option value="select">Dropdown</option>
          <option value="date">Date Picker</option>
          <option value="number">Number Field</option>
          <option value="email">Email Field</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Field Label</label>
        <input
          type="text"
          value={(settings.fieldLabel as string) || ""}
          onChange={(e) => onSettingChange("fieldLabel", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
          placeholder="Enter field label"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Placeholder</label>
        <input
          type="text"
          value={(settings.placeholder as string) || ""}
          onChange={(e) => onSettingChange("placeholder", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
          placeholder="Enter placeholder text"
        />
      </div>

      <div className="flex gap-2">
        <label className="flex items-center text-xs">
          <input
            type="checkbox"
            checked={(settings.required as boolean) || false}
            onChange={(e) => onSettingChange("required", e.target.checked)}
            className="mr-1"
          />
          Required
        </label>
        <label className="flex items-center text-xs">
          <input
            type="checkbox"
            checked={(settings.readonly as boolean) || false}
            onChange={(e) => onSettingChange("readonly", e.target.checked)}
            className="mr-1"
          />
          Read Only
        </label>
      </div>

      {(settings.fieldType === "select" || settings.fieldType === "radio") && (
        <div className="space-y-2">
          <label className="text-xs font-medium">Options (one per line)</label>
          <textarea
            value={(settings.options as string) || ""}
            onChange={(e) => onSettingChange("options", e.target.value)}
            className="w-full px-2 py-1 text-xs border rounded"
            rows={3}
            placeholder="Option 1&#10;Option 2&#10;Option 3"
          />
        </div>
      )}
    </div>
  );
};

const CheckmarkToolComponent: React.FC<EditorToolProps> = ({
  isActive,
  settings,
  onSettingChange,
}) => {
  if (!isActive) return null;

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">Checkmark Tool</h3>

      <div className="space-y-2">
        <label className="text-xs font-medium">Checkmark Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={(settings.color as string) || "#00AA00"}
            onChange={(e) => onSettingChange("color", e.target.value)}
            className="w-8 h-8 border rounded"
          />
          <input
            type="text"
            value={(settings.color as string) || "#00AA00"}
            onChange={(e) => onSettingChange("color", e.target.value)}
            className="flex-1 px-2 py-1 text-xs border rounded"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">
          Size: {(settings.size as number) || 20}px
        </label>
        <input
          type="range"
          value={(settings.size as number) || 20}
          onChange={(e) => onSettingChange("size", parseInt(e.target.value))}
          className="w-full"
          min="10"
          max="50"
          step="1"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Style</label>
        <select
          value={(settings.style as string) || "check"}
          onChange={(e) => onSettingChange("style", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="check">✓ Checkmark</option>
          <option value="tick">✔ Tick</option>
          <option value="heavy">✔️ Heavy Check</option>
          <option value="circle">⭕ Circle Check</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">
          Stroke Width: {(settings.strokeWidth as number) || 2}px
        </label>
        <input
          type="range"
          value={(settings.strokeWidth as number) || 2}
          onChange={(e) =>
            onSettingChange("strokeWidth", parseInt(e.target.value))
          }
          className="w-full"
          min="1"
          max="5"
          step="1"
        />
      </div>
    </div>
  );
};

const XMarkToolComponent: React.FC<EditorToolProps> = ({
  isActive,
  settings,
  onSettingChange,
}) => {
  if (!isActive) return null;

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">X-Mark Tool</h3>

      <div className="space-y-2">
        <label className="text-xs font-medium">X-Mark Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={(settings.color as string) || "#FF0000"}
            onChange={(e) => onSettingChange("color", e.target.value)}
            className="w-8 h-8 border rounded"
          />
          <input
            type="text"
            value={(settings.color as string) || "#FF0000"}
            onChange={(e) => onSettingChange("color", e.target.value)}
            className="flex-1 px-2 py-1 text-xs border rounded"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">
          Size: {(settings.size as number) || 20}px
        </label>
        <input
          type="range"
          value={(settings.size as number) ||          20}
          onChange={(e) => onSettingChange("size", parseInt(e.target.value))}
          className="w-full"
          min="10"
          max="50"
          step="1"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Style</label>
        <select
          value={(settings.style as string) || "x"}
          onChange={(e) => onSettingChange("style", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="x">✗ X Mark</option>
          <option value="cross">✕ Cross</option>
          <option value="heavy">✖ Heavy X</option>
          <option value="circle">⊗ Circle X</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">
          Stroke Width: {(settings.strokeWidth as number) || 2}px
        </label>
        <input
          type="range"
          value={(settings.strokeWidth as number) || 2}
          onChange={(e) =>
            onSettingChange("strokeWidth", parseInt(e.target.value))
          }
          className="w-full"
          min="1"
          max="5"
          step="1"
        />
      </div>
    </div>
  );
};

const LineToolComponent: React.FC<EditorToolProps> = ({
  isActive,
  settings,
  onSettingChange,
}) => {
  if (!isActive) return null;

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">Line Tool</h3>

      <div className="space-y-2">
        <label className="text-xs font-medium">Line Color</label>
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
          Line Width: {(settings.strokeWidth as number) || 2}px
        </label>
        <input
          type="range"
          value={(settings.strokeWidth as number) || 2}
          onChange={(e) =>
            onSettingChange("strokeWidth", parseInt(e.target.value))
          }
          className="w-full"
          min="1"
          max="10"
          step="1"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Line Style</label>
        <select
          value={(settings.lineStyle as string) || "solid"}
          onChange={(e) => onSettingChange("lineStyle", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
          <option value="dashdot">Dash-Dot</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Arrow Style</label>
        <select
          value={(settings.arrowStyle as string) || "none"}
          onChange={(e) => onSettingChange("arrowStyle", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="none">No Arrow</option>
          <option value="start">Arrow at Start</option>
          <option value="end">Arrow at End</option>
          <option value="both">Arrows at Both Ends</option>
        </select>
      </div>

      <div className="flex gap-2">
        <label className="flex items-center text-xs">
          <input
            type="checkbox"
            checked={(settings.snapToGrid as boolean) || false}
            onChange={(e) => onSettingChange("snapToGrid", e.target.checked)}
            className="mr-1"
          />
          Snap to Grid
        </label>
        <label className="flex items-center text-xs">
          <input
            type="checkbox"
            checked={(settings.constrainAngle as boolean) || false}
            onChange={(e) =>
              onSettingChange("constrainAngle", e.target.checked)
            }
            className="mr-1"
          />
          45° Angles
        </label>
      </div>
    </div>
  );
};

const InlineEditToolComponent: React.FC<EditorToolProps> = ({
  isActive,
  settings,
  onSettingChange,
}) => {
  if (!isActive) return null;

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">Inline Edit Tool</h3>
      <p className="text-xs text-gray-600">
        Click on existing text in the PDF to edit it directly.
      </p>

      <div className="space-y-2">
        <label className="text-xs font-medium">Edit Mode</label>
        <select
          value={(settings.editMode as string) || "replace"}
          onChange={(e) => onSettingChange("editMode", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="replace">Replace Text</option>
          <option value="overlay">Overlay Text</option>
          <option value="highlight">Highlight & Replace</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Detection Sensitivity</label>
        <select
          value={(settings.sensitivity as string) || "medium"}
          onChange={(e) => onSettingChange("sensitivity", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="low">Low (Exact matches)</option>
          <option value="medium">Medium (Similar text)</option>
          <option value="high">High (All text areas)</option>
        </select>
      </div>

      <div className="flex gap-2">
        <label className="flex items-center text-xs">
          <input
            type="checkbox"
            checked={(settings.preserveFormatting as boolean) || true}
            onChange={(e) =>
              onSettingChange("preserveFormatting", e.target.checked)
            }
            className="mr-1"
          />
          Preserve Formatting
        </label>
        <label className="flex items-center text-xs">
          <input
            type="checkbox"
            checked={(settings.showOriginal as boolean) || false}
            onChange={(e) => onSettingChange("showOriginal", e.target.checked)}
            className="mr-1"
          />
          Show Original
        </label>
      </div>
    </div>
  );
};

const OCRToolComponent: React.FC<EditorToolProps> = ({
  isActive,
  settings,
  onSettingChange,
  onToolAction,
}) => {
  if (!isActive) return null;

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">OCR Tool</h3>
      <p className="text-xs text-gray-600">
        Extract and recognize text from images and scanned documents.
      </p>

      <div className="space-y-2">
        <label className="text-xs font-medium">OCR Language</label>
        <select
          value={(settings.language as string) || "eng"}
          onChange={(e) => onSettingChange("language", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="eng">English</option>
          <option value="spa">Spanish</option>
          <option value="fra">French</option>
          <option value="deu">German</option>
          <option value="ita">Italian</option>
          <option value="por">Portuguese</option>
          <option value="rus">Russian</option>
          <option value="chi_sim">Chinese (Simplified)</option>
          <option value="jpn">Japanese</option>
          <option value="kor">Korean</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Recognition Mode</label>
        <select
          value={(settings.mode as string) || "auto"}
          onChange={(e) => onSettingChange("mode", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="auto">Auto Detect</option>
          <option value="single_block">Single Text Block</option>
          <option value="single_line">Single Line</option>
          <option value="single_word">Single Word</option>
          <option value="sparse_text">Sparse Text</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">
          Confidence Threshold: {Math.round(((settings.confidence as number) || 0.7) * 100)}%
        </label>
        <input
          type="range"
          value={(settings.confidence as number) || 0.7}
          onChange={(e) =>
            onSettingChange("confidence", parseFloat(e.target.value))
          }
          className="w-full"
          min="0.1"
          max="1"
          step="0.1"
        />
      </div>

      <div className="flex gap-2">
        <label className="flex items-center text-xs">
          <input
            type="checkbox"
            checked={(settings.autoCorrect as boolean) || false}
            onChange={(e) => onSettingChange("autoCorrect", e.target.checked)}
            className="mr-1"
          />
          Auto Correct
        </label>
        <label className="flex items-center text-xs">
          <input
            type="checkbox"
            checked={(settings.preserveLayout as boolean) || true}
            onChange={(e) =>
              onSettingChange("preserveLayout", e.target.checked)
            }
            className="mr-1"
          />
          Preserve Layout
        </label>
      </div>

      <button
        onClick={() => onToolAction?.("startOCR")}
        className="w-full px-2 py-2 text-xs bg-blue-100 text-blue-700 border border-blue-300 rounded hover:bg-blue-200"
      >
        Start OCR Recognition
      </button>
    </div>
  );
};

// Tool Registry Definition
const toolRegistry: Record<ToolType, EditorTool> = {
  select: {
    name: "select",
    label: "Select",
    icon: <MousePointer size={16} />,
    component: SelectToolComponent,
    category: "basic",
    shortcut: "V",
    defaultSettings: {},
    description: "Select and manipulate elements",
  },
  whiteout: {
    name: "whiteout",
    label: "Whiteout",
    icon: <Square size={16} />,
    component:     WhiteoutToolComponent,
    category: "editing",
    shortcut: "W",
    defaultSettings: {
      opacity: 1,
      color: "#FFFFFF",
    },
    description: "Cover text with white overlay",
  },
  text: {
    name: "text",
    label: "Text",
    icon: <Type size={16} />,
    component: TextToolComponent,
    category: "content",
    shortcut: "T",
    requiresFont: true,
    defaultSettings: {
      fontSize: 16,
      color: "#000000",
      fontFamily: "Arial",
      bold: false,
      italic: false,
    },
    description: "Add text annotations",
  },
  highlight: {
    name: "highlight",
    label: "Highlight",
    icon: <Highlighter size={16} />,
    component: HighlightToolComponent,
    category: "annotation",
    shortcut: "H",
    requiresColor: true,
    defaultSettings: {
      color: "#FFFF00",
      opacity: 0.5,
    },
    description: "Highlight text and content",
  },
  rectangle: {
    name: "rectangle",
    label: "Rectangle",
    icon: <Square size={16} />,
    component: ShapeToolComponent,
    category: "shapes",
    shortcut: "R",
    requiresColor: true,
    requiresSize: true,
    defaultSettings: {
      strokeColor: "#000000",
      fillColor: "transparent",
      strokeWidth: 2,
    },
    description: "Draw rectangles and squares",
  },
  circle: {
    name: "circle",
    label: "Circle",
    icon: <Circle size={16} />,
    component: ShapeToolComponent,
    category: "shapes",
    shortcut: "C",
    requiresColor: true,
    requiresSize: true,
    defaultSettings: {
      strokeColor: "#000000",
      fillColor: "transparent",
      strokeWidth: 2,
    },
    description: "Draw circles and ellipses",
  },
  freeform: {
    name: "freeform",
    label: "Freeform",
    icon: <Edit3 size={16} />,
    component: FreeformToolComponent,
    category: "drawing",
    shortcut: "F",
    requiresColor: true,
    requiresSize: true,
    defaultSettings: {
      strokeColor: "#000000",
      strokeWidth: 2,
      smoothing: 0.5,
    },
    description: "Draw freeform shapes and lines",
  },
  form: {
    name: "form",
    label: "Form Field",
    icon: <FormInput size={16} />,
    component: FormToolComponent,
    category: "forms",
    shortcut: "Shift+F",
    defaultSettings: {
      fieldType: "text",
      fieldLabel: "",
      placeholder: "",
      required: false,
      readonly: false,
      options: "",
    },
    description: "Create interactive form fields",
  },
  signature: {
    name: "signature",
    label: "Signature",
    icon: <Signature size={16} />,
    component: SignatureToolWrapper,
    category: "content",
    shortcut: "S",
    requiresFont: true,
    defaultSettings: {
      signatureText: "",
      signatureFont: "Dancing Script",
      fontSize: 24,
      color: "#000080",
    },
    description: "Add digital signatures",
  },
  eraser: {
    name: "eraser",
    label: "Eraser",
    icon: <Eraser size={16} />,
    component: EraserToolComponent,
    category: "editing",
    shortcut: "E",
    requiresSize: true,
    defaultSettings: {
      size: 20,
      opacity: 1,
    },
    description: "Remove annotations and content",
  },
  checkmark: {
    name: "checkmark",
    label: "Checkmark",
    icon: <CheckSquare size={16} />,
    component: CheckmarkToolComponent,
    category: "annotation",
    shortcut: "Shift+C",
    requiresColor: true,
    requiresSize: true,
    defaultSettings: {
      color: "#00AA00",
      size: 20,
      style: "check",
      strokeWidth: 2,
    },
    description: "Add checkmarks and approval marks",
  },
  "x-mark": {
    name: "x-mark",
    label: "X-Mark",
    icon: <XIcon size={16} />,
    component: XMarkToolComponent,
    category: "annotation",
    shortcut: "Shift+X",
    requiresColor: true,
    requiresSize: true,
    defaultSettings: {
      color: "#FF0000",
      size: 20,
      style: "x",
      strokeWidth: 2,
    },
    description: "Add X marks and rejection marks",
  },
  line: {
    name: "line",
    label: "Line",
    icon: <Minus size={16} />,
    component: LineToolComponent,
    category: "shapes",
    shortcut: "L",
    requiresColor: true,
    requiresSize: true,
    defaultSettings: {
      color: "#000000",
      strokeWidth: 2,
      lineStyle: "solid",
      arrowStyle: "none",
      snapToGrid: false,
      constrainAngle: false,
    },
    description: "Draw straight lines and arrows",
  },
  image: {
    name: "image",
    label: "Image",
    icon: <ImageIcon size={16} />,
    component: ImageToolComponent,
    category: "media",
    shortcut: "I",
    defaultSettings: {
      opacity: 1,
      maintainAspectRatio: true,
      allowResize: true,
    },
    description: "Insert and manage images",
  },
  inlineEdit: {
    name: "inlineEdit",
    label: "Inline Edit",
    icon: <Edit3 size={16} />,
    component: InlineEditToolComponent,
    category: "editing",
    shortcut: "Shift+E",
    condition: (state: EditorState) => state.hasContent,
    defaultSettings: {
      editMode: "replace",
      sensitivity: "medium",
      preserveFormatting: true,
      showOriginal: false,
    },
    description: "Edit existing text in place",
  },
  ocr: {
    name: "ocr",
    label: "OCR",
    icon: <FileText size={16} />,
    component: OCRToolComponent,
    category: "advanced",
    shortcut: "Shift+O",
    defaultSettings: {
      language: "eng",
      mode: "auto",
      confidence: 0.7,
      autoCorrect: false,
      preserveLayout: true,
    },
    description: "Extract text from images using OCR",
  },
};

export interface ToolRegistryProviderProps {
  children: React.ReactNode;
  initialTool?: ToolType;
  initialEditorState?: Partial<EditorState>;
}

export const ToolRegistryProvider: React.FC<ToolRegistryProviderProps> = ({
  children,
  initialTool = "select",
  initialEditorState = {},
}) => {
  const [currentTool, setCurrentTool] = useState<ToolType>(initialTool);
    const [toolSettings, setToolSettings] = useState<
    Record<ToolType, Record<string, unknown>>
  >(() => {
    const initialSettings: Record<ToolType, Record<string, unknown>> = {} as Record<ToolType, Record<string, unknown>>;
    Object.entries(toolRegistry).forEach(([key, tool]) => {
      initialSettings[key as ToolType] = { ...tool.defaultSettings };
    });
    return initialSettings;
  });

  const [editorState, setEditorState] = useState<EditorState>({
    currentTool: initialTool,
    hasSelection: false,
    hasContent: false,
    selectedElements: [],
    zoom: 1,
    currentPage: 1,
    totalPages: 1,
    canUndo: false,
    canRedo: false,
    ...initialEditorState,
  });

  const updateToolSetting = useCallback(
    (toolId: ToolType, key: string, value: unknown) => {
      setToolSettings((prev) => ({
        ...prev,
        [toolId]: {
          ...prev[toolId],
          [key]: value,
        },
      }));
    },
    []
  );

  const getToolSettings = useCallback(
    (toolId: ToolType) => {
      return toolSettings[toolId] || {};
    },
    [toolSettings]
  );

  const resetToolSettings = useCallback((toolId: ToolType) => {
    const tool = toolRegistry[toolId];
    if (tool) {
      setToolSettings((prev) => ({
        ...prev,
        [toolId]: { ...tool.defaultSettings },
      }));
    }
  }, []);

  const getAvailableTools = useCallback(
    (state: EditorState) => {
      return Object.values(toolRegistry).filter((tool) => {
        if (tool.condition) {
          return tool.condition(state);
        }
        return true;
      });
    },
    []
  );

  const getToolsByCategory = useCallback((category: string) => {
    return Object.values(toolRegistry).filter(
      (tool) => tool.category === category
    );
  }, []);

  const updateEditorState = useCallback((updates: Partial<EditorState>) => {
    setEditorState((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const contextValue: ToolRegistryContextType = {
    tools: toolRegistry,
    currentTool,
    setCurrentTool,
    toolSettings,
    updateToolSetting,
    getToolSettings,
    resetToolSettings,
    getAvailableTools,
    getToolsByCategory,
    editorState,
    updateEditorState,
  };

  return (
    <ToolRegistryContext.Provider value={contextValue}>
      {children}
    </ToolRegistryContext.Provider>
  );
};

// Export types and interfaces for external use
export type { EditorTool as ToolDefinition };