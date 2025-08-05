import React from 'react';
import { EditorToolProps } from '@/types/pdf-types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

export const ShapeToolComponent: React.FC<EditorToolProps> = ({ settings, onSettingChange }) => {
  return (
    <div className="space-y-4 p-4">
      <div>
        <Label className="text-xs">Stroke Color</Label>
        <Input type="color" value={settings.strokeColor || '#000000'} onChange={(e) => onSettingChange('strokeColor', e.target.value)} className="w-full h-8 mt-1 p-0 cursor-pointer" />
      </div>
      <div>
        <Label className="text-xs">Fill Color</Label>
        <Input type="color" value={settings.fillColor === 'transparent' ? '#ffffff' : settings.fillColor} onChange={(e) => onSettingChange('fillColor', e.target.value)} className="w-full h-8 mt-1 p-0 cursor-pointer" />
        <Button variant="link" className="text-xs p-0 h-auto font-normal" onClick={() => onSettingChange('fillColor', 'transparent')}>Set Transparent</Button>
      </div>
      <div>
        <Label className="text-xs">Stroke Width: {settings.strokeWidth || 2}px</Label>
        <Slider value={[settings.strokeWidth || 2]} onValueChange={([val]) => onSettingChange('strokeWidth', val)} min={1} max={50} step={1} />
      </div>
      <div>
        <Label className="text-xs">Corner Radius: {settings.cornerRadius || 0}px</Label>
        <Slider value={[settings.cornerRadius || 0]} onValueChange={([val]) => onSettingChange('cornerRadius', val)} min={0} max={50} step={1} />
      </div>
    </div>
  );
};