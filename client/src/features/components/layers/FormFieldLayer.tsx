// src/features/components/layers/FormFieldLayer.tsx

import React, { useState, useCallback } from "react";
import { Rnd, DraggableData } from "react-rnd";
import { DraggableEvent } from "react-draggable";
import { FormField, PDFEditorAction } from "@/types/pdf-types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface FormFieldLayerProps {
  formFields: FormField[];
  selectedElementId: string | null;
  selectedElementIds: string[];
  scale: number;
  page: number;
  dispatch: React.Dispatch<PDFEditorAction>;
  currentTool: string;
}

export const FormFieldLayer: React.FC<FormFieldLayerProps> = ({
  formFields,
  selectedElementId,
  selectedElementIds,
  scale,
  page,
  dispatch,
  currentTool,
}) => {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  const handleUpdate = useCallback((id: string, updates: Partial<FormField>) => {
    dispatch({ type: "UPDATE_FORM_FIELD", payload: { page, id, updates } });
  }, [dispatch, page]);

  const handleSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Only allow selection when using select tool
    if (currentTool === 'select') {
      const isCtrl = e.ctrlKey || e.metaKey;
      
      if (isCtrl) {
        // Multi-select: add/remove from selection
        dispatch({ type: "ADD_TO_SELECTION", payload: { id, type: "form" } });
      } else {
        // Single select: replace selection
        dispatch({ type: "SET_SELECTED_ELEMENT", payload: { id, type: "form" } });
      }
    }
  }, [currentTool, dispatch]);

  const handleSaveHistory = useCallback(() => {
    dispatch({ type: "SAVE_TO_HISTORY" });
  }, [dispatch]);

  const handleFieldValueChange = useCallback((fieldId: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
    handleUpdate(fieldId, { value });
  }, [handleUpdate]);

  const renderFormField = useCallback((field: FormField) => {
    const fieldValue = fieldValues[field.id] || field.value || "";

    switch (field.type) {
      case "text":
        return (
          <Input
            value={fieldValue}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={field.readonly}
            className="w-full h-full text-xs border-gray-300 bg-white"
            style={{ fontSize: `${Math.max(10, 12 * scale)}px` }}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={fieldValue}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={field.readonly}
            className="w-full h-full text-xs border-gray-300 bg-white resize-none"
            style={{ fontSize: `${Math.max(10, 12 * scale)}px` }}
          />
        );

      case "checkbox":
        return (
          <div className="flex items-center justify-center w-full h-full">
            <Checkbox
              checked={fieldValue === "true"}
              onCheckedChange={(checked) => handleFieldValueChange(field.id, checked ? "true" : "false")}
              disabled={field.readonly}
              className="border-gray-300"
            />
          </div>
        );

      case "radio":
        return (
          <div className="flex items-center justify-center w-full h-full">
            <RadioGroup
              value={fieldValue}
              onValueChange={(value) => handleFieldValueChange(field.id, value)}
              disabled={field.readonly}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={field.id} id={field.id} />
                <Label htmlFor={field.id} className="text-xs">
                  {field.placeholder || "Option"}
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      case "dropdown":
        return (
          <Select
            value={fieldValue}
            onValueChange={(value) => handleFieldValueChange(field.id, value)}
            disabled={field.readonly}
          >
            <SelectTrigger className="w-full h-full text-xs border-gray-300 bg-white">
              <SelectValue placeholder={field.placeholder || "Select option"} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "date":
        return (
          <Input
            type="date"
            value={fieldValue}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            disabled={field.readonly}
            className="w-full h-full text-xs border-gray-300 bg-white"
          />
        );

      case "signature":
        return (
          <div className="w-full h-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-500"
              onClick={() => {
                // TODO: Implement signature capture
                handleFieldValueChange(field.id, "Signed");
              }}
            >
              {fieldValue ? "✍️ Signed" : "Click to Sign"}
            </Button>
          </div>
        );

      default:
        return (
          <div className="w-full h-full bg-gray-100 border border-gray-300 flex items-center justify-center text-xs text-gray-500">
            Unknown field type
          </div>
        );
    }
  }, [fieldValues, handleFieldValueChange, scale]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {formFields.map((field) => {
        const isSelected = selectedElementIds.includes(field.id);
        const isSelectable = currentTool === 'select';

        // For non-selectable fields or when not using select tool, render as static
        if (!isSelectable && !isSelected) {
          return (
            <div
              key={field.id}
              className="absolute pointer-events-auto"
              style={{
                left: field.x * scale,
                top: field.y * scale,
                width: field.width * scale,
                height: field.height * scale,
              }}
            >
              {/* Field Label */}
              {field.placeholder && (
                <Label className="absolute -top-5 left-0 text-xs text-gray-600 bg-white px-1">
                  {field.placeholder}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
              )}
              {renderFormField(field)}
            </div>
          );
        }

        // For selectable fields, use Rnd for manipulation
        return (
          <Rnd
            key={field.id}
            className={`absolute ${isSelectable ? 'pointer-events-auto' : 'pointer-events-none'} ${
              isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""
            } ${selectedElementIds.length > 1 && isSelected ? "ring-offset-0" : ""}`}
            size={{ 
              width: field.width * scale, 
              height: field.height * scale 
            }}
            position={{ 
              x: field.x * scale, 
              y: field.y * scale 
            }}
            onDragStop={(e: DraggableEvent, d: DraggableData) => {
              handleUpdate(field.id, { x: d.x / scale, y: d.y / scale });
              handleSaveHistory();
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              handleUpdate(field.id, {
                width: ref.offsetWidth / scale,
                height: ref.offsetHeight / scale,
                x: position.x / scale,
                y: position.y / scale,
              });
              handleSaveHistory();
            }}
            onClick={(e: React.MouseEvent) => handleSelect(field.id, e)}
            // Disable manipulation when not selected or not using select tool
            disableDragging={!isSelected || currentTool !== 'select'}
            enableResizing={isSelected && currentTool === 'select'}
            // Hide resize handles when not selected
            disableResizing={!isSelected || currentTool !== 'select'}
          >
            <div className="w-full h-full relative">
              {/* Field Label */}
              {field.placeholder && (
                <Label className="absolute -top-5 left-0 text-xs text-gray-600 bg-white px-1 z-10">
                  {field.placeholder}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
              )}
              {renderFormField(field)}
            </div>
          </Rnd>
        );
      })}
    </div>
  );
};
