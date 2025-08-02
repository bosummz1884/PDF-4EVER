import React from 'react';
import { EditorToolProps } from '../toolRegistry';

export const EraserToolComponent: React.FC<EditorToolProps> = ({ 
  isActive, 
  settings, 
  onSettingChange 
}) => {
  if (!isActive) return null;
  
  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">Eraser Tool</h3>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Eraser Size: {settings.size || 20}px</label>
        <input 
          type="range" 
          value={settings.size || 20}
          onChange={(e) => onSettingChange('size', parseInt(e.target.value))}
          className="w-full"
          min="5"
          max="100"
          step="5"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Eraser Mode</label>
        <select 
          value={settings.mode || 'precise'}
          onChange={(e) => onSettingChange('mode', e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="precise">Precise</option>
          <option value="soft">Soft Edge</option>
          <option value="hard">Hard Edge</option>
          <option value="magic">Magic Eraser</option>
        </select>
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Eraser Shape</label>
        <select 
          value={settings.shape || 'circle'}
          onChange={(e) => onSettingChange('shape', e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="circle">Circle</option>
          <option value="square">Square</option>
          <option value="brush">Brush</option>
        </select>
      </div>
      
      {settings.mode === 'soft' && (
        <div className="space-y-2">
          <label className="text-xs font-medium">Edge Softness: {settings.softness || 50}%</label>
          <input 
            type="range" 
            value={settings.softness || 50}
            onChange={(e) => onSettingChange('softness', parseInt(e.target.value))}
            className="w-full"
            min="0"
            max="100"
            step="10"
          />
        </div>
      )}
      
      {settings.mode === 'magic' && (
        <div className="space-y-2">
          <label className="text-xs font-medium">Tolerance: {settings.tolerance || 30}%</label>
          <input 
            type="range" 
            value={settings.tolerance || 30}
            onChange={(e) => onSettingChange('tolerance', parseInt(e.target.value))}
            className="w-full"
            min="0"
            max="100"
            step="5"
          />
        </div>
      )}
      
      <div className="flex gap-2">
        <label className="flex items-center text-xs">
          <input 
            type="checkbox" 
            checked={settings.eraseAnnotations || true}
            onChange={(e) => onSettingChange('eraseAnnotations', e.target.checked)}
            className="mr-1"
          />
          Erase Annotations
        </label>
        <label className="flex items-center text-xs">
          <input 
            type="checkbox" 
            checked={settings.eraseText || false}
            onChange={(e) => onSettingChange('eraseText', e.target.checked)}
            className="mr-1"
          />
          Erase Text
        </label>
      </div>
      
      <div className="p-2 border rounded bg-gray-50 flex justify-center">
        <div 
          style={{ 
            width: `${Math.min(settings.size || 20, 40)}px`,
            height: `${Math.min(settings.size || 20, 40)}px`,
            border: '2px dashed #666',
            borderRadius: settings.shape === 'circle' ? '50%' : settings.shape === 'square' ? '0' : '20%',
            backgroundColor: 'rgba(255, 255, 255, 0.8)'
          }}
        />
      </div>
    </div>
  );
};