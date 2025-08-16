// src/components/tool-panels/FormToolComponent.tsx

import React from "react";
import { EditorToolProps } from "@/types/pdf-types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

const FORM_FIELD_TYPES = [
  { value: "text", label: "Text Field", icon: "📝" },
  { value: "textarea", label: "Text Area", icon: "📄" },
  { value: "checkbox", label: "Checkbox", icon: "☑️" },
  { value: "radio", label: "Radio Button", icon: "🔘" },
  { value: "dropdown", label: "Dropdown", icon: "📋" },
  { value: "date", label: "Date Field", icon: "📅" },
  { value: "signature", label: "Signature", icon: "✍️" },
];

export const FormToolComponent: React.FC<EditorToolProps & { compact?: boolean }> = ({
  settings,
  onSettingChange,
  editorState,
  compact = false,
}) => {
  const currentFieldType = settings.fieldType || "text";
  const currentPageFormFields = editorState?.formFields?.[editorState?.currentPage] || [];

  const handleFieldTypeChange = (type: string) => {
    onSettingChange("fieldType", type);
    
    // Set default properties based on field type
    const defaults = {
      text: { width: 150, height: 30, placeholder: "Enter text" },
      textarea: { width: 200, height: 80, placeholder: "Enter text" },
      checkbox: { width: 20, height: 20 },
      radio: { width: 20, height: 20 },
      dropdown: { width: 150, height: 30, options: ["Option 1", "Option 2", "Option 3"] },
      date: { width: 120, height: 30 },
      signature: { width: 200, height: 60 },
    };

    const typeDefaults = defaults[type as keyof typeof defaults] || defaults.text;
    Object.entries(typeDefaults).forEach(([key, value]) => {
      onSettingChange(key as any, value);
    });
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Field Type */}
        <Select value={currentFieldType} onValueChange={handleFieldTypeChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Field type" />
          </SelectTrigger>
          <SelectContent>
            {FORM_FIELD_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-1">
                  <span className="text-xs">{type.icon}</span>
                  <span className="text-xs">{type.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Size Inputs */}
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={settings.width || 150}
            onChange={(e) => onSettingChange("width", parseInt(e.target.value))}
            className="w-16 h-8"
            placeholder="W"
          />
          <span className="text-xs text-muted-foreground">×</span>
          <Input
            type="number"
            value={settings.height || 30}
            onChange={(e) => onSettingChange("height", parseInt(e.target.value))}
            className="w-16 h-8"
            placeholder="H"
          />
        </div>
        
        {/* Required checkbox */}
        <div className="flex items-center gap-1">
          <Checkbox
            checked={settings.required || false}
            onCheckedChange={(checked) => onSettingChange("required", checked)}
          />
          <span className="text-xs text-muted-foreground">Required</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Field Type Selection */}
      <div className="space-y-1.5">
        <Label className="text-xs">Field Type</Label>
        <Select value={currentFieldType} onValueChange={handleFieldTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select field type" />
          </SelectTrigger>
          <SelectContent>
            {FORM_FIELD_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Field Properties */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground">Field Properties</h4>
        
        {/* Placeholder Text */}
        {["text", "textarea", "date"].includes(currentFieldType) && (
          <div className="space-y-1.5">
            <Label className="text-xs">Placeholder Text</Label>
            <Input
              value={settings.placeholder || ""}
              onChange={(e) => onSettingChange("placeholder", e.target.value)}
              placeholder="Enter placeholder text"
              className="text-xs"
            />
          </div>
        )}

        {/* Field Label */}
        <div className="space-y-1.5">
          <Label className="text-xs">Field Label</Label>
          <Input
            value={settings.label || ""}
            onChange={(e) => onSettingChange("label", e.target.value)}
            placeholder="Enter field label"
            className="text-xs"
          />
        </div>

        {/* Default Value */}
        {["text", "textarea"].includes(currentFieldType) && (
          <div className="space-y-1.5">
            <Label className="text-xs">Default Value</Label>
            <Input
              value={settings.defaultValue || ""}
              onChange={(e) => onSettingChange("defaultValue", e.target.value)}
              placeholder="Enter default value"
              className="text-xs"
            />
          </div>
        )}

        {/* Dropdown Options */}
        {currentFieldType === "dropdown" && (
          <div className="space-y-1.5">
            <Label className="text-xs">Options (one per line)</Label>
            <Textarea
              value={(settings.options as string[])?.join('\n') || ""}
              onChange={(e) => onSettingChange("options", e.target.value.split('\n').filter(Boolean))}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
              className="text-xs h-20"
            />
          </div>
        )}

        {/* Radio Group Name */}
        {currentFieldType === "radio" && (
          <div className="space-y-1.5">
            <Label className="text-xs">Group Name</Label>
            <Input
              value={settings.groupName || ""}
              onChange={(e) => onSettingChange("groupName", e.target.value)}
              placeholder="radio-group-1"
              className="text-xs"
            />
          </div>
        )}

        {/* Field Size */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Width</Label>
            <Input
              type="number"
              value={settings.width || 150}
              onChange={(e) => onSettingChange("width", parseInt(e.target.value))}
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Height</Label>
            <Input
              type="number"
              value={settings.height || 30}
              onChange={(e) => onSettingChange("height", parseInt(e.target.value))}
              className="text-xs"
            />
          </div>
        </div>

        {/* Field Options */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={settings.required || false}
              onCheckedChange={(checked) => onSettingChange("required", checked)}
            />
            <Label htmlFor="required" className="text-xs">Required field</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="readonly"
              checked={settings.readonly || false}
              onCheckedChange={(checked) => onSettingChange("readonly", checked)}
            />
            <Label htmlFor="readonly" className="text-xs">Read-only</Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Current Page Fields Summary */}
      <div className="space-y-1.5">
        <Label className="text-xs">Current Page Fields</Label>
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          {currentPageFormFields.length === 0 ? (
            "No form fields on this page"
          ) : (
            `${currentPageFormFields.length} field(s) on page ${editorState.currentPage}`
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-[11px] text-muted-foreground p-2 bg-blue-50 dark:bg-blue-950 rounded">
        <p className="font-medium mb-1">How to use:</p>
        <ol className="space-y-1 list-decimal list-inside">
          <li>Select field type and configure properties</li>
          <li>Click on the PDF to place the field</li>
          <li>Use Select tool to move and resize fields</li>
        </ol>
      </div>
    </div>
  );
};
