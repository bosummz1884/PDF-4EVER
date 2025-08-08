import React from "react";
import { EditorToolProps } from "@/types/pdf-types";

export const ImageToolComponent: React.FC<EditorToolProps> = () => {
  return (
    <div className="p-4" data-oid="d-br5h8">
      <h3 className="text-sm font-medium" data-oid="ida2az5">
        Image Tool
      </h3>
      <p className="text-xs text-muted-foreground mt-2" data-oid="_a6fl95">
        Click on the page to open a file dialog, then select an image to place
        on the document.
      </p>
    </div>
  );
};
