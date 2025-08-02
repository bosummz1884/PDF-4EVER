import React from 'react';
import { EditorToolProps } from '../toolRegistry';

export const SelectToolComponent: React.FC<EditorToolProps> = ({ 
  isActive, 
  settings, 
  onSettingChange,
  editorState 
}) => {
  if (!isActive) return null;
  
  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium">Selection Tool</h3>
      <p className="text-xs text-gray-600">Click and drag to select elements on the page.</p>
      
      <div className="space-y-2">
        <label className="text-xs font-medium">Selection Mode</label>
        <select 
          value={settings.selectionMode || 'single'}
          onChange={(e) => onSettingChange('selectionMode', e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="single">Single Selection</option>
          <option value="multiple">Multiple Selection</option>
          <option value="area">Area Selection</option>
        </select>
      </div>
      
      <div className="flex gap-2">
        <label className="flex items-center text-xs">
          <input 
            type="checkbox" 
            checked={settings.showBounds || true}
            onChange={(e) => onSettingChange('showBounds', e.target.checked)}
            className="mr-1"
          />
          Show Bounds
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
      
      {editorState?.hasSelection && (
        <div className="space-y-2 p-2 bg-blue-50 border border-blue-200 rounded">
          <div className="text-xs font-medium text-blue-800">
            Selected: {editorState.selectedElements?.length || 0} element(s)
          </div>
          <div className="flex gap-1">
            <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 border border-blue-300 rounded hover:bg-blue-200">
              Copy
            </button>
            <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 border border-blue-300 rounded hover:bg-blue-200">
              Cut
            </button>
            <button className="px-2 py-1 text-xs bg-red-100 text-red-700 border border-red-300 rounded hover:bg-red-200">
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};