import React from "react";
import { TextExtractionLayerProps } from "@/types/pdf-types";
import { cn } from "@/lib/utils";

export function TextExtractionLayer({
  page,
  textRegions,
  scale,
  rotation,
  onRegionClick,
  showRegions
}: TextExtractionLayerProps) {
  const handleRegionClick = (region: typeof textRegions[0], event: React.MouseEvent) => {
    event.stopPropagation();
    onRegionClick(region);
  };

  if (!showRegions || textRegions.length === 0) {
    return null;
  }

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-10"
      data-testid="text-extraction-layer"
      data-page={page}
    >
      {textRegions.map((region) => (
        <div
          key={region.id}
          className={cn(
            "absolute border-2 border-transparent transition-all duration-200 cursor-text pointer-events-auto",
            "hover:border-blue-500 hover:bg-blue-50/20",
            region.isEditing && "border-blue-500 bg-blue-50/30"
          )}
          style={{
            left: region.x * scale,
            top: region.y * scale,
            width: region.width * scale,
            height: region.height * scale,
            transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
            transformOrigin: 'top left'
          }}
          onClick={(e) => handleRegionClick(region, e)}
          title={`Click to edit: ${region.text.substring(0, 50)}${region.text.length > 50 ? '...' : ''}`}
          data-testid={`text-region-${region.id}`}
          data-font-name={region.fontName}
          data-font-size={region.fontSize}
          data-text={region.text}
        />
      ))}
    </div>
  );
}
