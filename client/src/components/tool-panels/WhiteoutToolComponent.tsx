import React from 'react';
import { EditorToolProps } from '../pdf-editor/toolRegistry';

const WhiteoutToolComponent: React.FC<EditorToolProps> = ({ 
  isActive, 
  settings, 
  onSettingChange 
}) => {
  if (!isActive) return null;
  
  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">Whiteout Tool</h3>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Brush Size: {(settings.brushSize as number) || 20}px</label>
        <input 
          type="range" 
          value={(settings.brushSize as number) || 20}
          onChange={(e) => onSettingChange('brushSize', parseInt(e.target.value))}
          className="w-full"
          min="5"
          max="100"
          step="5"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Whiteout Color</label>
        <div className="flex gap-2">
          <input 
            type="color" 
            value={(settings.color as string) || '#FFFFFF'}
            onChange={(e) => onSettingChange('color', e.target.value)}
            className="w-8 h-8 border rounded"
          />
          <select 
            value={(settings.color as string) || '#FFFFFF'}
            onChange={(e) => onSettingChange('color', e.target.value)}
            className="flex-1 px-2 py-1 text-xs border rounded"
          >
            <option value="#FFFFFF">White</option>
            <option value="#F5F5F5">Off-White</option>
            <option value="#FFFACD">Cream</option>
            <option value="#FFF8DC">Cornsilk</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Opacity: {Math.round(((settings.opacity as number) || 1) * 100)}%</label>
        <input 
          type="range" 
          value={(settings.opacity as number) || 1}
          onChange={(e) => onSettingChange('opacity', parseFloat(e.target.value))}
          className="w-full"
          min="0.5"
          max="1"
          step="0.1"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Brush Shape</label>
        <select 
          value={(settings.brushShape as string) || 'round'}
          onChange={(e) => onSettingChange('brushShape', e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="round">Round</option>
          <option value="square">Square</option>
          <option value="soft">Soft Round</option>
        </select>
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Application Mode</label>
        <select 
          value={(settings.mode as string) || 'paint'}
          onChange={(e) => onSettingChange('mode', e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="paint">Paint Over</option>
          <option value="block">Block Selection</option>
          <option value="precise">Precise Coverage</option>
        </select>
      </div>
      
      <div className="flex gap-2">
        <label className="flex items-center text-xs">
          <input 
            type="checkbox" 
            checked={(settings.smoothing as boolean) || true}
            onChange={(e) => onSettingChange('smoothing', e.target.checked)}
            className="mr-1"
          />
          Smooth Edges
        </label>
        <label className="flex items-center text-xs">
          <input 
            type="checkbox" 
            checked={(settings.pressure as boolean) || false}
            onChange={(e) => onSettingChange('pressure', e.target.checked)}
            className="mr-1"
          />
          Pressure Sensitive
        </label>
      </div>
      
      <div className="p-2 border rounded bg-gray-50 flex justify-center">
        <div 
          style={{ 
            width: `${Math.min((settings.brushSize as number) || 20, 40)}px`,
            height: `${Math.min((settings.brushSize as number) || 20, 40)}px`,
            backgroundColor: ((settings.color as string) || '#FFFFFF'),
            opacity: ((settings.opacity as number) || 1),
            borderRadius: settings.brushShape === 'round' ? '50%' : settings.brushShape === 'soft' ? '30%' : '0',
            border: '1px solid #ccc'
          }}
        />
      </div>
    </div>
  );
};

export default WhiteoutToolComponent;