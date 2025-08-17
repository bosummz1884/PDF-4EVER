// src/components/tool-panels/ToolDropdown.tsx

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { EditorToolProps, ToolType } from "@/types/pdf-types";
import { toolRegistry } from "./toolRegistry";

interface ToolDropdownProps extends EditorToolProps {
  toolName: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onToolSelect: (tool: ToolType) => void;
}

export const ToolDropdown: React.FC<ToolDropdownProps> = ({
  toolName,
  icon,
  label,
  isActive,
  onToolSelect,
  settings,
  onSettingChange,
  editorState,
}) => {
  const toolInfo = toolRegistry[toolName as keyof typeof toolRegistry];
  const ToolComponent = toolInfo?.component;

  // Handle tool selection
  const handleToolClick = () => {
    onToolSelect(toolName as ToolType);
  };

  // If no tool component exists, just render a simple button
  if (!ToolComponent) {
    return (
      <Button
        variant={isActive ? "default" : "outline"}
        size="sm"
        onClick={handleToolClick}
        className={`flex items-center gap-1 ${
          // reason: Improve contrast of inactive buttons against white/gray backgrounds
          // by giving them a subtle white bg and light shadow. Keep active buttons filled.
          isActive ? '' : 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
        }`}
      >
        {icon}
        <span className="text-xs">{label}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <div className="flex items-center">
        {/* Tool Button */}
        <Button
          variant={isActive ? "default" : "outline"}
          size="sm"
          onClick={handleToolClick}
          className={`flex items-center gap-1 rounded-r-none border-r-0 ${
            // reason: Add subtle background/shadow only when inactive so active stays high-contrast
            isActive ? '' : 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
          }`}
        >
          {icon}
          <span className="text-xs">{label}</span>
        </Button>
        
        {/* Dropdown Trigger */}
        <DropdownMenuTrigger asChild>
          <Button
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={`px-1 rounded-l-none ${
              // reason: Match main button; only add bg/shadow when inactive
              isActive ? '' : 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
            }`}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
      </div>
      
      <DropdownMenuContent 
        align="start" 
        // reason: Make panel clearly visible over the PDF: solid background, border, and stronger shadow.
        className="z-50 w-auto min-w-[300px] p-3 bg-white/95 backdrop-blur-md border shadow-xl rounded-md"
        sideOffset={8}
      >
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground border-b pb-2">
            {label} Settings
          </div>
          
          {/* Render the tool component in compact mode */}
          {React.createElement(ToolComponent, {
            settings,
            onSettingChange,
            editorState,
            compact: true
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
