import React from 'react';
import { EditorToolProps } from '../toolRegistry';

export const ShapeToolComponent: React.FC<EditorToolProps> = ({ 
  isActive, 
  settings, 
  onSettingChange 
}) => {
  if (!isActive) return null;
  
  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">Shape Tool</h3>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Stroke Color</label>
        <div className="flex gap-2">
          <input 
            type="color" 
            value={settings.strokeColor || '#000000'}
            onChange={(e) => onSettingChange('strokeColor', e.target.value)}
            className="w-8 h-8 border rounded"
          />
          <input 
            type="text" 
            value={settings.strokeColor || '#000000'}
            onChange={(e) => onSettingChange('strokeColor', e.target.value)}
            className="flex-1 px-2 py-1 text-xs border rounded"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Fill Color</label>
        <div className="flex gap-2">
          <input 
            type="color" 
            value={settings.fillColor === 'transparent' ? '#FFFFFF' : settings.fillColor || '#FFFFFF'}
            onChange={(e) => onSettingChange('fillColor', e.target.value)}
            className="w-8 h-8 border rounded"
            disabled={settings.fillColor === 'transparent'}
          />
          <select 
            value={settings.fillColor || 'transparent'}
            onChange={(e) => onSettingChange('fillColor', e.target.value)}
            className="flex-1 px-2 py-1 text-xs border rounded"
          >
            <option value="transparent">Transparent</option>
            <option value="#FFFFFF">White</option>
            <option value="#000000">Black</option>
            <option value="#FF0000">Red</option>
            <option value="#00FF00">Green</option>
            <option value="#0000FF">Blue</option>
            <option value="#FFFF00">Yellow</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Stroke Width: {settings.strokeWidth || 2}px</label>
        <input 
          type="range" 
          value={settings.strokeWidth || 2}
          onChange={(e) => onSettingChange('strokeWidth', parseInt(e.target.value))}
          className="w-full"
          min="1"
          max="10"
          step="1"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Stroke Style</label>
        <select 
          value={settings.strokeStyle || 'solid'}
          onChange={(e) => onSettingChange('strokeStyle', e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
          <option value="double">Double</option>
        </select>
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Corner Radius: {settings.cornerRadius || 0}px</label>
        <input 
          type="range" 
          value={settings.cornerRadius || 0}
          onChange={(e) => onSettingChange('cornerRadius', parseInt(e.target.value))}
          className="w-full"
          min="0"
          max="20"
          step="1"
        />
      </div>
      
      <div className="flex gap-2">
        <label className="flex items-center text-xs">
          <input 
            type="checkbox" 
            checked={settings.maintainAspectRatio || false}
            onChange={(e) => onSettingChange('maintainAspectRatio', e.target.checked)}
            className="mr-1"
          />
          Lock Aspect
        </label>
        <label className="flex items-center text-xs">
          <input 
            type="checkbox" 
            checked={settings.snapToGrid || false}
            onChange={(e) => onSettingChange('snapToGrid', e.target.checked)}
            className="mr-1"
          />
          Snap to Grid
        </label>
      </div>
      
      <div className="p-2 border rounded bg-gray-50 flex justify-center">
        <div 
          style={{ 
            width: '40px',
            height: '30px',
            border: `${settings.strokeWidth || 2}px ${settings.strokeStyle || 'solid'} ${settings.strokeColor || '#000000'}`,
            backgroundColor: settings.fillColor === 'transparent' ? 'transparent' : settings.fillColor || 'transparent',
            borderRadius: `${settings.cornerRadius || 0}px`
          }}
        />
      </div>
    </div>
  );
};