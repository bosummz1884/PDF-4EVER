import React from 'react';
import { EditorToolProps } from '../toolRegistry';

export const ImageToolComponent: React.FC<EditorToolProps> = ({ 
  isActive, 
  settings, 
  onSettingChange,
  onToolAction 
}) => {
  if (!isActive) return null;
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onToolAction?.('uploadImage', file);
    }
  };
  
  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">Image Tool</h3>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Upload Image</label>
        <input 
          type="file" 
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full px-2 py-1 text-xs border rounded"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Width: {settings.width || 100}px</label>
        <input 
          type="range" 
          value={settings.width || 100}
          onChange={(e) => onSettingChange('width', parseInt(e.target.value))}
          className="w-full"
          min="20"
          max="500"
          step="10"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Height: {settings.height || 100}px</label>
        <input           type="range" 
          value={settings.height || 100}
          onChange={(e) => onSettingChange('height', parseInt(e.target.value))}
          className="w-full"
          min="20"
          max="500"
          step="10"
          disabled={settings.maintainAspectRatio}
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Opacity: {Math.round((settings.opacity || 1) * 100)}%</label>
        <input 
          type="range" 
          value={settings.opacity || 1}
          onChange={(e) => onSettingChange('opacity', parseFloat(e.target.value))}
          className="w-full"
          min="0.1"
          max="1"
          step="0.1"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Rotation: {settings.rotation || 0}°</label>
        <input 
          type="range" 
          value={settings.rotation || 0}
          onChange={(e) => onSettingChange('rotation', parseInt(e.target.value))}
          className="w-full"
          min="0"
          max="360"
          step="15"
        />
      </div>
      
      <div className="flex gap-2">
        <label className="flex items-center text-xs">
          <input 
            type="checkbox" 
            checked={settings.maintainAspectRatio || true}
            onChange={(e) => onSettingChange('maintainAspectRatio', e.target.checked)}
            className="mr-1"
          />
          Lock Aspect
        </label>
        <label className="flex items-center text-xs">
          <input 
            type="checkbox" 
            checked={settings.allowResize || true}
            onChange={(e) => onSettingChange('allowResize', e.target.checked)}
            className="mr-1"
          />
          Allow Resize
        </label>
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Border</label>
        <div className="flex gap-2">
          <input 
            type="color" 
            value={settings.borderColor || '#000000'}
            onChange={(e) => onSettingChange('borderColor', e.target.value)}
            className="w-8 h-8 border rounded"
          />
          <input 
            type="number" 
            value={settings.borderWidth || 0}
            onChange={(e) => onSettingChange('borderWidth', parseInt(e.target.value))}
            className="flex-1 px-2 py-1 text-xs border rounded"
            min="0"
            max="10"
            placeholder="Width"
          />
        </div>
      </div>
      
      <div className="p-2 border rounded bg-gray-50 flex justify-center">
        <div 
          style={{ 
            width: `${Math.min(settings.width || 100, 60)}px`,
            height: `${Math.min(settings.height || 100, 60)}px`,
            border: `${settings.borderWidth || 0}px solid ${settings.borderColor || '#000000'}`,
            backgroundColor: '#f0f0f0',
            opacity: settings.opacity || 1,
            transform: `rotate(${settings.rotation || 0}deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: '#666'
          }}
        >
          IMG
        </div>
      </div>
    </div>
  );
};