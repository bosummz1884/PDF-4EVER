import React from 'react';
import { EditorToolProps } from '../toolRegistry';

export const TextToolComponent: React.FC<EditorToolProps> = ({ 
  isActive, 
  settings, 
  onSettingChange 
}) => {
  if (!isActive) return null;
  
  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">Text Tool</h3>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Font Family</label>
        <select 
          value={settings.fontFamily || 'Arial'}
          onChange={(e) => onSettingChange('fontFamily', e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
          <option value="Trebuchet MS">Trebuchet MS</option>
          <option value="Comic Sans MS">Comic Sans MS</option>
        </select>
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Font Size: {settings.fontSize || 16}px</label>
        <input 
          type="range" 
          value={settings.fontSize || 16}
          onChange={(e) => onSettingChange('fontSize', parseInt(e.target.value))}
          className="w-full"
          min="8"
          max="72"
          step="1"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Text Color</label>
        <div className="flex gap-2">
          <input 
            type="color" 
            value={settings.color || '#000000'}
            onChange={(e) => onSettingChange('color', e.target.value)}
            className="w-8 h-8 border rounded"
          />
          <input 
            type="text" 
            value={settings.color || '#000000'}
            onChange={(e) => onSettingChange('color', e.target.value)}
            className="flex-1 px-2 py-1 text-xs border rounded"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Text Style</label>
        <div className="flex gap-2">
          <button
            onClick={() => onSettingChange('bold', !settings.bold)}
            className={`px-2 py-1 text-xs border rounded font-bold ${
              settings.bold ? 'bg-blue-100 border-blue-300' : 'bg-white'
            }`}
          >
            B
          </button>
          <button
            onClick={() => onSettingChange('italic', !settings.italic)}
            className={`px-2 py-1 text-xs border rounded italic ${
              settings.italic ? 'bg-blue-100 border-blue-300' : 'bg-white'
            }`}
          >
            I
          </button>
          <button
            onClick={() => onSettingChange('underline', !settings.underline)}
            className={`px-2 py-1 text-xs border rounded underline ${
              settings.underline ? 'bg-blue-100 border-blue-300' : 'bg-white'
            }`}
          >
            U
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Text Alignment</label>
        <select 
          value={settings.textAlign || 'left'}
          onChange={(e) => onSettingChange('textAlign', e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
          <option value="justify">Justify</option>
        </select>
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Line Height: {settings.lineHeight || 1.2}</label>
        <input 
          type="range" 
          value={settings.lineHeight || 1.2}
          onChange={(e) => onSettingChange('lineHeight', parseFloat(e.target.value))}
          className="w-full"
          min="0.8"
          max="3"
          step="0.1"
        />
      </div>
      
      <div className="p-2 border rounded bg-gray-50">
        <div 
          style={{ 
            fontFamily: settings.fontFamily || 'Arial',
            fontSize: `${Math.min(settings.fontSize || 16, 14)}px`,
            color: settings.color || '#000000',
            fontWeight: settings.bold ? 'bold' : 'normal',
            fontStyle: settings.italic ? 'italic' : 'normal',
            textDecoration: settings.underline ? 'underline' : 'none',
            textAlign: settings.textAlign || 'left',
            lineHeight: settings.lineHeight || 1.2
          }}
        >
          Sample Text
        </div>
      </div>
    </div>
  );
};