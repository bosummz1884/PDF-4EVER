import React from "react";
import { EditorToolProps } from "@/types/pdf-types";

export const SelectToolComponent: React.FC<EditorToolProps> = () => {
  return (
    <div className="p-4" data-oid="r9amvuj">
      <h3 className="text-sm font-medium" data-oid="bxxyffh">
        Selection Tool
      </h3>
      <p className="text-xs text-muted-foreground mt-2" data-oid="hd_ro_6">
        Click elements on the page to select, move, or resize them.
      </p>
    </div>
  );
};
