import React from 'react';
import { EditorToolProps } from '@/types/pdf-types';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export const EraserToolComponent: React.FC<EditorToolProps> = ({ settings, onSettingChange }) => {
  return (
    <div className="space-y-4 p-4">
      <div>
        <Label className="text-xs">Eraser Size: {settings.size || 20}px</Label>
        <Slider value={[settings.size || 20]} onValueChange={([val]) => onSettingChange('size', val)} min={5} max={100} step={5} />
      </div>
    </div>
  );
};