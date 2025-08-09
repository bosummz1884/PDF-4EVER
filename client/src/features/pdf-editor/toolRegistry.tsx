import React, { ComponentType } from "react";
import {
  CheckSquare,
  Circle,
  Edit3,
  Eraser,
  FileText,
  FormInput,
  Highlighter,
  ImageIcon,
  Minus,
  MousePointer,
  Signature,
  Square,
  Type,
  X as XIcon,
} from "lucide-react";
import { EditorTool, EditorToolProps, ToolType } from "@/types/pdf-types";

// Import the rich tool setting components.
// We will create/refactor these files in the subsequent steps.
import { TextToolComponent } from "@/components/tool-panels/TextToolComponent";
import { EraserToolComponent } from "@/components/tool-panels/EraserToolComponent";
import { FreeformToolComponent } from "@/components/tool-panels/FreeformToolComponent";
import { HighlightToolComponent } from "@/components/tool-panels/HighlightToolComponent";
import { ImageToolComponent } from "@/components/tool-panels/ImageToolComponent";
import { SelectToolComponent } from "@/components/tool-panels/SelectToolComponent";
import { ShapeToolComponent } from "@/components/tool-panels/ShapeToolComponent";
import WhiteoutToolComponent from "@/components/tool-panels/WhiteoutToolComponent";
import { OCRToolComponent } from "@/components/tool-panels/OCRToolComponent";

// A generic, clean component for tools that do not have settings.
const NullSettingsPanel: ComponentType<EditorToolProps> = () => (
  <div className="p-4 text-xs text-gray-500">This tool has no settings.</div>
);

export const toolRegistry: Record<ToolType, EditorTool> = {
  select: {
    name: "select",
    label: "Select",
    icon: <MousePointer size={16} />,
    component: SelectToolComponent,
    category: "basic",
    shortcut: "V",
    defaultSettings: {
      selectionMode: "single",
      showBounds: true,
      snapToGrid: false,
    },
    description: "Select and manipulate elements",
  },
  text: {
    name: "text",
    label: "Text",
    icon: <Type size={16} />,
    component: TextToolComponent,
    category: "content",
    shortcut: "T",
    defaultSettings: {
      fontFamily: "Helvetica",
      fontSize: 16,
      color: "#000000",
      bold: false,
      italic: false,
      underline: false,
      lineHeight: 1.2,
      textAlign: "left",
    },
    description: "Add and edit text boxes",
  },
  highlight: {
    name: "highlight",
    label: "Highlight",
    icon: <Highlighter size={16} />,
    component: HighlightToolComponent,
    category: "annotation",
    shortcut: "H",
    defaultSettings: {
      color: "#FFFF00",
      opacity: 0.5,
      style: "solid",
      blendMode: "multiply",
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
    defaultSettings: {
      strokeColor: "#000000",
      fillColor: "transparent",
      strokeWidth: 2,
      strokeStyle: "solid",
      cornerRadius: 0,
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
    defaultSettings: {
      strokeColor: "#000000",
      fillColor: "transparent",
      strokeWidth: 2,
      strokeStyle: "solid",
    },
    description: "Draw circles and ellipses",
  },
  line: {
    name: "line",
    label: "Line",
    icon: <Minus size={16} />,
    component: ShapeToolComponent,
    category: "shapes",
    shortcut: "L",
    defaultSettings: {
      strokeColor: "#000000",
      strokeWidth: 2,
      strokeStyle: "solid",
    },
    description: "Draw straight lines",
  },
  freeform: {
    name: "freeform",
    label: "Draw",
    icon: <Edit3 size={16} />,
    component: FreeformToolComponent,
    category: "drawing",
    shortcut: "F",
    defaultSettings: { color: "#000000", brushSize: 3, smoothing: "medium" },
    description: "Draw freeform shapes and lines",
  },
  eraser: {
    name: "eraser",
    label: "Eraser",
    icon: <Eraser size={16} />,
    component: EraserToolComponent,
    category: "editing",
    shortcut: "E",
    defaultSettings: { size: 20 },
    description: "Remove annotations",
  },
  whiteout: {
    name: "whiteout",
    label: "Whiteout",
    icon: <Square size={16} className="fill-black" />,
    component: WhiteoutToolComponent,
    category: "editing",
    shortcut: "W",
    defaultSettings: { color: "#FFFFFF", opacity: 1 },
    description: "Cover areas of the document",
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
        rotation: 0 
    },
    description: "Insert images onto the document",
  },
  signature: {
    name: "signature",
    label: "Signature",
    icon: <Signature size={16} />,
    component: NullSettingsPanel,
    category: "content",
    shortcut: "S",
    defaultSettings: {},
    description: "Add digital signatures",
  },
  ocr: {
    name: "ocr",
    label: "OCR",
    icon: <FileText size={16} />,
    component: OCRToolComponent,
    category: "advanced",
    shortcut: "Shift+O",
    defaultSettings: {},
    description: "Recognize text in images",
  },
  inlineEdit: {
    name: "inlineEdit",
    label: "Edit Text",
    icon: <Edit3 size={16} />,
    component: NullSettingsPanel,
    category: "editing",
    shortcut: "Shift+E",
    defaultSettings: {},
    description: "Edit the underlying text of the PDF",
  },
  form: {
    name: "form",
    label: "Form Field",
    icon: <FormInput size={16} />,
    component: NullSettingsPanel,
    category: "forms",
    shortcut: "Shift+F",
    defaultSettings: {},
    description: "Create interactive form fields",
  },
  checkmark: {
    name: "checkmark",
    label: "Checkmark",
    icon: <CheckSquare size={16} />,
    component: NullSettingsPanel,
    category: "annotation",
    shortcut: "Shift+C",
    defaultSettings: {},
    description: "Add checkmarks",
  },
  "x-mark": {
    name: "x-mark",
    label: "X-Mark",
    icon: <XIcon size={16} />,
    component: NullSettingsPanel,
    category: "annotation",
    shortcut: "X",
    defaultSettings: {},
    description: "Add X marks",
  },
};
