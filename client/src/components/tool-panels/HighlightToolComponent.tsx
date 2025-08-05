import React from 'react';
import { EditorToolProps } from '@/types/pdf-types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

export const HighlightToolComponent: React.FC<EditorToolProps> = ({ settings, onSettingChange }) => {
  return (
    <div className="space-y-4 p-4">
      <div>
        <Label className="text-xs">Highlight Color</Label>
        <Input type="color" value={settings.color || '#FFFF00'} onChange={(e) => onSettingChange('color', e.target.value)} className="w-full h-8 mt-1 p-0 cursor-pointer" />
      </div>
      <div>
        <Label className="text-xs">Opacity: {Math.round((settings.opacity || 0.5) * 100)}%</Label>
        <Slider value={[(settings.opacity || 0.5) * 100]} onValueChange={([val]) => onSettingChange('opacity', val / 100)} min={10} max={100} step={5} />
      </div>
    </div>
  );
};