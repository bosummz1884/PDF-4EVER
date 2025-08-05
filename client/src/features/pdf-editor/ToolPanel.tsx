import React from 'react';
import { toolRegistry } from './toolRegistry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePDFEditor } from './PDFEditorContext';
import { ToolSettings } from '@/types/pdf-types';

export default function ToolPanel() {
  const { state, dispatch } = usePDFEditor();
  const { currentTool, toolSettings } = state;

  const handleSettingChange = <K extends keyof ToolSettings>(key: K, value: ToolSettings[K]) => {
    dispatch({ type: 'UPDATE_TOOL_SETTING', payload: { toolId: currentTool, key, value } });
  };

  const currentToolData = toolRegistry[currentTool];
  const currentSettings = toolSettings[currentTool];
  const SettingsComponent = currentToolData.component;

  const categories = Array.from(new Set(Object.values(toolRegistry).map(t => t.category)));

  return (
    <div className="w-80 bg-gray-50 dark:bg-black/20 border-l flex flex-col flex-shrink-0">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Tools</h2>
      </div>

      <ScrollArea className="flex-1">
        {categories.map(category => (
          <div key={category} className="p-4 border-b">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 capitalize">{category}</h3>
            <div className="grid grid-cols-5 gap-2">
              {Object.values(toolRegistry)
                .filter(tool => tool.category === category)
                .map(tool => (
                  <Button
                    key={tool.name}
                    variant={currentTool === tool.name ? 'default' : 'outline'}
                    size="icon"
                    className="h-12 w-12"
                    title={tool.label}
                    onClick={() => dispatch({ type: 'SET_CURRENT_TOOL', payload: tool.name })}
                  >
                    {tool.icon}
                  </Button>
                ))}
            </div>
          </div>
        ))}
      </ScrollArea>

      {currentToolData && (
        <div className="border-t">
          <Card className="border-0 rounded-none shadow-none bg-transparent">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {currentToolData.icon}
                {currentToolData.label} Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SettingsComponent
                settings={currentSettings}
                onSettingChange={handleSettingChange}
                editorState={state}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}