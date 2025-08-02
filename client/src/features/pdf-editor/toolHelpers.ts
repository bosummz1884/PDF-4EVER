import { ToolType, ToolDefinition } from '../../toolRegistry';

export const getToolIcon = (toolName: ToolType, tools: Record<ToolType, ToolDefinition>) => {
  return tools[toolName]?.icon || null;
};

export const getToolLabel = (toolName: ToolType, tools: Record<ToolType, ToolDefinition>) => {
  return tools[toolName]?.label || toolName;
};

export const getToolDescription = (toolName: ToolType, tools: Record<ToolType, ToolDefinition>) => {
  return tools[toolName]?.description || '';
};

export const getToolShortcut = (toolName: ToolType, tools: Record<ToolType, ToolDefinition>) => {
  return tools[toolName]?.shortcut || '';
};

export const getToolsByCategory = (category: string, tools: Record<ToolType, ToolDefinition>) => {
  return Object.values(tools).filter(tool => tool.category === category);
};

export const getToolCategories = (tools: Record<ToolType, ToolDefinition>) => {
  const categories = new Set(Object.values(tools).map(tool => tool.category));
  return Array.from(categories);
};

export const isToolAvailable = (toolName: ToolType, tools: Record<ToolType, ToolDefinition>, editorState: any) => {
  const tool = tools[toolName];
  if (!tool) return false;
  if (!tool.condition) return true;
  return tool.condition(editorState);
};

export const getRequiredToolFeatures = (toolName: ToolType, tools: Record<ToolType, ToolDefinition>) => {
  const tool = tools[toolName];
  if (!tool) return [];
  
  const features = [];
  if (tool.requiresColor) features.push('color');
  if (tool.requiresSize) features.push('size');
  if (tool.requiresFont) features.push('font');
  
  return features;
};

export const validateToolSettings = (toolName: ToolType, settings: any, tools: Record<ToolType, ToolDefinition>) => {
  const tool = tools[toolName];
  if (!tool) return false;
  
  // Basic validation - can be extended based on tool requirements
  if (tool.requiresColor && !settings.color) return false;
  if (tool.requiresSize && (!settings.size && !settings.fontSize && !settings.strokeWidth)) return false;
  if (tool.requiresFont && !settings.fontFamily) return false;
  
  return true;
};