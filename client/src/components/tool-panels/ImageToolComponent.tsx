import React from 'react';
import { EditorToolProps } from '@/types/pdf-types';

export const ImageToolComponent: React.FC<EditorToolProps> = () => {
  return (
    <div className="p-4">
        <h3 className="text-sm font-medium">Image Tool</h3>
        <p className="text-xs text-muted-foreground mt-2">Click on the page to open a file dialog, then select an image to place on the document.</p>
    </div>
  );
};