import React from 'react';
import { useToolRegistry } from '../pdf-editor/toolRegistry';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Undo, Redo, ZoomIn, ZoomOut, RotateCw, 
  Download, Upload, Save, Settings 
} from 'lucide-react';

interface ToolbarCompactProps {
  className?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onRotate?: () => void;
  onSave?: () => void;
  onDownload?: () => void;
  onUpload?: () => void;
  onSettings?: () => void;
  showToolPanel?: boolean;
  onToggleToolPanel?: () => void;
}

export const ToolbarCompact: React.FC<ToolbarCompactProps> = ({
  className = '',
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onRotate,
  onSave,
  onDownload,
  onUpload,
  onSettings,
  showToolPanel,
  onToggleToolPanel
}) => {
  const {
    tools,
    currentTool,
    setCurrentTool,
    getAvailableTools,
    editorState
  } = useToolRegistry();

  const availableTools = getAvailableTools(editorState);
  const primaryTools = availableTools.filter(tool => 
    ['select', 'text', 'highlight', 'signature', 'freeform'].includes(tool.name)
  );

  const handleToolSelect = (toolName: string) => {
    setCurrentTool(toolName as any);
  };

  return (
    <div className={`flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onUpload}
                className="h-8 w-8 p-0"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Upload PDF</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSave}
                className="h-8 w-8 p-0"
              >
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Save PDF</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Download PDF</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onUndo}
                disabled={!editorState.canUndo}
                className="h-8 w-8 p-0"
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Undo</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRedo}
                disabled={!editorState.canRedo}
                className="h-8 w-8 p-0"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Redo</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onZoomOut}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Zoom Out</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded">
          {editorState.zoom}%
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onZoomIn}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Zoom In</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRotate}
                className="h-8 w-8 p-0"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Rotate</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1">
        {primaryTools.map(tool => (
          <TooltipProvider key={tool.name}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentTool === tool.name ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleToolSelect(tool.name)}
                  className="h-8 w-8 p-0"
                >
                  {tool.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <div>{tool.label}</div>
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

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <div className="text-xs text-gray-500">
          Page {editorState.currentPage} of {editorState.totalPages}
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showToolPanel ? 'default' : 'ghost'}
                size="sm"
                onClick={onToggleToolPanel}
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>{showToolPanel ? 'Hide' : 'Show'} Tool Panel</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default ToolbarCompact;