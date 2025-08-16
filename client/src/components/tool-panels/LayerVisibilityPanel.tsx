// src/components/tool-panels/LayerVisibilityPanel.tsx

import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Eye, EyeOff, Move3D } from "lucide-react";
import { PDFEditorState } from "@/types/pdf-types";

interface LayerVisibilityPanelProps {
  editorState: PDFEditorState;
  layerVisibility: {
    whiteout: boolean;
    annotations: boolean;
    text: boolean;
    images: boolean;
    textExtraction: boolean;
  };
  onToggleLayer: (layer: keyof LayerVisibilityPanelProps['layerVisibility']) => void;
}

export function LayerVisibilityPanel({ 
  editorState, 
  layerVisibility, 
  onToggleLayer 
}: LayerVisibilityPanelProps) {
  const { currentPage, whiteoutBlocks, annotations, textElements, imageElements, extractedTextRegions } = editorState;
  
  // Count elements on current page
  const counts = {
    whiteout: whiteoutBlocks[currentPage]?.length || 0,
    annotations: annotations[currentPage]?.length || 0,
    text: textElements[currentPage]?.length || 0,
    images: imageElements[currentPage]?.length || 0,
    textExtraction: extractedTextRegions[currentPage]?.length || 0,
  };

  const layers = [
    { key: 'whiteout' as const, label: 'Whiteout Blocks', icon: <div className="w-4 h-4 bg-white border border-gray-400 rounded" />, count: counts.whiteout },
    { key: 'annotations' as const, label: 'Annotations', icon: <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded" />, count: counts.annotations },
    { key: 'text' as const, label: 'Text Elements', icon: <div className="w-4 h-4 bg-green-200 border border-green-400 rounded flex items-center justify-center text-xs">T</div>, count: counts.text },
    { key: 'images' as const, label: 'Images', icon: <div className="w-4 h-4 bg-purple-200 border border-purple-400 rounded flex items-center justify-center text-xs">📷</div>, count: counts.images },
    { key: 'textExtraction' as const, label: 'Text Regions', icon: <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded" />, count: counts.textExtraction },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Move3D className="h-4 w-4" />
          Layer Visibility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {layers.map((layer) => (
          <div key={layer.key} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2 flex-1">
              {layer.icon}
              <span className="text-sm">{layer.label}</span>
              <span className="text-xs text-muted-foreground">({layer.count})</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onToggleLayer(layer.key)}
              title={`${layerVisibility[layer.key] ? 'Hide' : 'Show'} ${layer.label}`}
            >
              {layerVisibility[layer.key] ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3 text-muted-foreground" />
              )}
            </Button>
          </div>
        ))}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Layers render from bottom to top. Use drag handles to reorder (coming soon).
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
