import React from "react";
import { Edit3 } from "lucide-react";
import { EditorTool, EditorToolProps } from "@/types/pdf-types";
import { FontRecognitionPanel } from "@/components/pdf-editor/FontRecognitionPanel";

function InlineEditToolComponent({ settings, onSettingChange, editorState }: EditorToolProps) {
  const allDetectedFonts = Object.values(editorState.detectedFonts).flat();

  return (
    <div className="space-y-4" data-testid="inline-edit-tool">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Inline Text Editing</h4>
        <p className="text-xs text-blue-600">
          Click on any text in the PDF to edit it directly. Font recognition will automatically 
          match the original styling.
        </p>
      </div>

      <FontRecognitionPanel
        detectedFonts={allDetectedFonts}
        isAnalyzing={false}
        analysisProgress={0}
        onFontMappingChange={() => {}}
        settings={{
          autoFontMatch: settings.autoFontMatch ?? true,
          useFallbackFonts: settings.useFallbackFonts ?? true,
          showFontWarnings: settings.showFontWarnings ?? false
        }}
        onSettingsChange={(newSettings) => {
          Object.entries(newSettings).forEach(([key, value]) => {
            onSettingChange(key as any, value);
          });
        }}
      />
    </div>
  );
}

export const inlineEditTool: EditorTool = {
  name: "inlineEdit",
  label: "Inline Edit",
  icon: <Edit3 className="h-4 w-4" />,
  component: InlineEditToolComponent,
  category: "text",
  shortcut: "E",
  defaultSettings: {
    autoFontMatch: true,
    useFallbackFonts: true,
    realTimePreview: true,
    showFontWarnings: false,
    fontFamily: "Arial",
    fontSize: 14,
    color: "#000000",
    bold: false,
    italic: false,
    textAlign: "left"
  },
  description: "Click on text in the PDF to edit it inline with automatic font matching"
};
