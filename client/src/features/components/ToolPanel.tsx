import React from 'react';
import { useToolRegistry, ToolType } from '../pdf-editor/toolRegistry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePDFEditor } from '../pdf-editor/PDFEditorContext';
import { Annotation, TextElement, FormField } from '../../types/pdf-types';


interface ToolPanelProps {
  className?: string;
  onToolAction?: (action: string, data?: unknown) => void;
}

export const ToolPanel: React.FC<ToolPanelProps> = ({ className = '', onToolAction }) => {
  const { state } = usePDFEditor();
  const {
    tools,
    currentTool,
    setCurrentTool,
    getToolSettings,
    updateToolSetting,
    resetToolSettings,
    getAvailableTools,
    getToolsByCategory,
  } = useToolRegistry();


    const mapToEditorState = (pdfState: {
  selectedAnnotationId?: string | null;
  selectedFieldId?: string | null;
  textElements?: Record<string, TextElement[]>;
  annotations?: Annotation[];
  formFields?: FormField[];
  scale?: number;
  currentPage?: number;
  totalPages?: number;
  historyIndex?: number;
  history?: unknown[];
}) => ({
  currentTool: currentTool,
  hasSelection: pdfState.selectedAnnotationId !== null || pdfState.selectedFieldId !== null,
  hasContent: Object.keys(pdfState.textElements || {}).length > 0 || 
              (pdfState.annotations?.length ?? 0) > 0 || 
              (pdfState.formFields?.length ?? 0) > 0,
  selectedElements: pdfState.selectedAnnotationId ? [pdfState.selectedAnnotationId] : [],
  zoom: pdfState.scale || 1,
  currentPage: pdfState.currentPage || 1,
  totalPages: pdfState.totalPages || 1,
  canUndo: (pdfState.historyIndex ?? 0) > 0,
  canRedo: (pdfState.historyIndex ?? 0) < ((pdfState.history?.length ?? 1) - 1),
});

  const availableTools = getAvailableTools(mapToEditorState(state));
  const categories = ['basic', 'annotation', 'shapes', 'drawing', 'forms', 'media', 'editing', 'advanced'];


  const handleToolSelect = (toolName: string) => {
    setCurrentTool(toolName as ToolType);
  };

  const handleSettingChange = (key: string, value: unknown) => {
  updateToolSetting(currentTool, key, value);
};

  const handleToolAction = (action: string, data?: unknown) => {
    onToolAction?.(action, data);
  };

  const currentToolData = tools[currentTool];
  const currentSettings = getToolSettings(currentTool);

  return (
    <div className={`w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tools</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {categories.map(category => {
          const categoryTools = getToolsByCategory(category).filter(tool => 
            availableTools.some(availableTool => availableTool.name === tool.name)
          );

          if (categoryTools.length === 0) return null;

          return (
            <div key={category} className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 capitalize">
                {category}
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {categoryTools.map(tool => (
                  <TooltipProvider key={tool.name}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={currentTool === tool.name ? 'default' : 'outline'}
                          size="sm"
                          className="h-12 w-12 p-0 flex flex-col items-center justify-center"
                          onClick={() => handleToolSelect(tool.name)}
                        >
                          {tool.icon}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <div className="text-center">
                          <div className="font-medium">{tool.label}</div>
                          <div className="text-xs text-gray-500">{tool.description}</div>
                          {tool.shortcut && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {tool.shortcut}
                            </Badge>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {currentToolData && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <Card className="border-0 rounded-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentToolData.icon}
                  {currentToolData.label}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetToolSettings(currentTool)}
                  className="text-xs"
                >
                  Reset
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <currentToolData.component
                isActive={true}
                settings={currentSettings}
                onSettingChange={handleSettingChange}
                onToolAction={handleToolAction}
                editorState={state}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ToolPanel;