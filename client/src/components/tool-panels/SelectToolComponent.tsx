import React from 'react';
import { EditorToolProps } from '@/types/pdf-types';

export const SelectToolComponent: React.FC<EditorToolProps> = () => {
  return (
    <div className="p-4">
      <h3 className="text-sm font-medium">Selection Tool</h3>
      <p className="text-xs text-muted-foreground mt-2">Click elements on the page to select, move, or resize them.</p>
    </div>
  );
};