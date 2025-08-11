// src/tools/toolRegistry.ts

import { EditorTool, ToolType } from "@/types/pdf-types";
import React from "react";
import { inlineEditTool } from "./inlineEditTool";
import { FreeformToolComponent } from "@/components/tool-panels/FreeformToolComponent";
import { HighlightToolComponent } from "@/components/tool-panels/HighlightToolComponent";
import { ImageToolComponent } from "@/components/tool-panels/ImageToolComponent";
import { OCRToolComponent } from "@/components/tool-panels/OCRToolComponent";
import { SelectToolComponent } from "@/components/tool-panels/SelectToolComponent";
import { ShapeToolComponent } from "@/components/tool-panels/ShapeToolComponent";
import { TextToolComponent } from "@/components/tool-panels/TextToolComponent";
import { WhiteoutToolComponent } from "@/components/tool-panels/WhiteoutToolComponent";

// Basic tool implementations
export const toolRegistry: Record<ToolType, EditorTool> = {
  select: {
    name: "select",
    label: "Select",
    icon: React.createElement("span", {}, "⚬"),
    component: SelectToolComponent,
    category: "basic",
    defaultSettings: {},
    description: "Select and move elements"
  },
  inlineEdit: inlineEditTool,
  text: {
    name: "text",
    label: "Text",
    icon: React.createElement("span", {}, "T"),
    component: TextToolComponent,
    category: "text",
    defaultSettings: { fontSize: 14, color: "#000000" },
    description: "Add text"
  },
  highlight: {
    name: "highlight",
    label: "Highlight",
    icon: React.createElement("span", {}, "🖍"),
    component: HighlightToolComponent,
    category: "annotation",
    defaultSettings: { color: "#FFFF00", opacity: 0.5 },
    description: "Highlight text"
  },
  rectangle: {
    name: "rectangle",
    label: "Rectangle",
    icon: React.createElement("span", {}, "▭"),
    component: ShapeToolComponent,
    category: "shape",
    defaultSettings: { strokeColor: "#000000", fillColor: "transparent" },
    description: "Draw rectangles"
  },
  circle: {
    name: "circle",
    label: "Circle",
    icon: React.createElement("span", {}, "○"),
    component: ShapeToolComponent,
    category: "shape",
    defaultSettings: { strokeColor: "#000000", fillColor: "transparent" },
    description: "Draw circles"
  },
  freeform: {
    name: "freeform",
    label: "Freeform",
    icon: React.createElement("span", {}, "✏"),
    component: FreeformToolComponent,
    category: "draw",
    defaultSettings: { color: "#000000", brushSize: 3 },
    description: "Free drawing"
  },
  form: {
    name: "form",
    label: "Form",
    icon: React.createElement("span", {}, "📝"),
    component: SelectToolComponent,
    category: "form",
    defaultSettings: {},
    description: "Add form fields"
  },
  signature: {
    name: "signature",
    label: "Signature",
    icon: React.createElement("span", {}, "✍"),
    component: SelectToolComponent,
    category: "annotation",
    defaultSettings: {},
    description: "Add signatures"
  },
  eraser: {
    name: "eraser",
    label: "Eraser",
    icon: React.createElement("span", {}, "🧽"),
    component: SelectToolComponent,
    category: "edit",
    defaultSettings: { size: 10 },
    description: "Erase content"
  },
  checkmark: {
    name: "checkmark",
    label: "Checkmark",
    icon: React.createElement("span", {}, "✓"),
    component: SelectToolComponent,
    category: "annotation",
    defaultSettings: { color: "#00FF00" },
    description: "Add checkmarks"
  },
  "x-mark": {
    name: "x-mark",
    label: "X Mark",
    icon: React.createElement("span", {}, "✗"),
    component: SelectToolComponent,
    category: "annotation",
    defaultSettings: { color: "#FF0000" },
    description: "Add X marks"
  },
  line: {
    name: "line",
    label: "Line",
    icon: React.createElement("span", {}, "―"),
    component: ShapeToolComponent,
    category: "shape",
    defaultSettings: { strokeColor: "#000000", strokeWidth: 2 },
    description: "Draw lines"
  },
  image: {
    name: "image",
    label: "Image",
    icon: React.createElement("span", {}, "🖼"),
    component: ImageToolComponent,
    category: "media",
    defaultSettings: { opacity: 1, rotation: 0 },
    description: "Add images"
  },
  whiteout: {
    name: "whiteout",
    label: "Whiteout",
    icon: React.createElement("span", {}, "⬜"),
    component: WhiteoutToolComponent,
    category: "edit",
    defaultSettings: { color: "#FFFFFF" },
    description: "Cover content"
  },
  ocr: {
    name: "ocr",
    label: "OCR",
    icon: React.createElement("span", {}, "👁"),
    component: OCRToolComponent,
    category: "utility",
    defaultSettings: {},
    description: "Extract text"
  }
};