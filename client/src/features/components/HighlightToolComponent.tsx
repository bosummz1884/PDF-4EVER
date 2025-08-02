import React from 'react';
import { EditorToolProps } from '../toolRegistry';

export const HighlightToolComponent: React.FC<EditorToolProps> = ({ 
  isActive, 
  settings, 
  onSettingChange 
}) => {
  if (!isActive) return null;
  
  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">Highlight Tool</h3>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Highlight Color</label>
        <div className="flex gap-2">
          <input 
            type="color" 
            value={settings.color || '#FFFF00'}
            onChange={(e) => onSettingChange('color', e.target.value)}
            className="w-8 h-8 border rounded"
          />
          <input 
            type="text" 
            value={settings.color || '#FFFF00'}
            onChange={(e) => onSettingChange('color', e.target.value)}
            className="flex-1 px-2 py-1 text-xs border rounded"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Opacity: {Math.round((settings.opacity || 0.5) * 100)}%</label>
        <input 
          type="range" 
          value={settings.opacity || 0.5}
          onChange={(e) => onSettingChange('opacity', parseFloat(e.target.value))}
          className="w-full"
          min="0.1"
          max="1"
          step="0.1"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Highlight Style</label>
        <select 
          value={settings.style || 'solid'}
          onChange={(e) => onSettingChange('style', e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="solid">Solid</option>
          <option value="underline">Underline</option>
          <option value="strikethrough">Strikethrough</option>
          <option value="squiggly">Squiggly</option>
        </select>
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Blend Mode</label>
        <select 
          value={settings.blendMode || 'multiply'}
          onChange={(e) => onSettingChange('blendMode', e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="multiply">Multiply</option>
          <option value="overlay">Overlay</option>
          <option value="screen">Screen</option>
          <option value="normal">Normal</option>
        </select>
      </div>
      
      <div className="p-2 border rounded bg-gray-50">
        <div 
          style={{ 
            backgroundColor: settings.color || '#FFFF00',
            opacity: settings.opacity || 0.5,
            padding: '2px 4px',
            borderRadius: '2px'
          }}
          className="text-center text-xs"
        >
          Sample Highlight
        </div>
      </div>
    </div>
  );
};