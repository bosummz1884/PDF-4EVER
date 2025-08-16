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
        className="flex items-center gap-1"
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
          className="flex items-center gap-1 rounded-r-none border-r-0"
        >
          {icon}
          <span className="text-xs">{label}</span>
        </Button>
        
        {/* Dropdown Trigger */}
        <DropdownMenuTrigger asChild>
          <Button
            variant={isActive ? "default" : "outline"}
            size="sm"
            className="px-1 rounded-l-none"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
      </div>
      
      <DropdownMenuContent 
        align="start" 
        className="w-auto min-w-[300px] p-3"
        sideOffset={5}
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
