import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/types/pdf-types';

interface FormToolProps {
  newFieldType: string;
  setNewFieldType: (type: string) => void;
  onFormFieldAdd: (field: FormField) => void;
  formFields: FormField[];
  setFormFields: (fields: FormField[]) => void;
  currentPage: number;
}

const FormTool: React.FC<FormToolProps> = ({
  newFieldType,
  setNewFieldType,
  onFormFieldAdd,
  formFields,
  setFormFields,
  currentPage,
}) => {
  const handleAddField = () => {
    if (!newFieldType) return;

    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: newFieldType as any,
      x: 100,
      y: 100,
      width: 150,
      height: 30,
      page: currentPage,
      value: '',
      placeholder: `Enter ${newFieldType}`,
      required: false,
      rect: {
        x: 100,
        y: 100,
        width: 150,
        height: 30
      }
    };

    onFormFieldAdd(newField);
    setNewFieldType('');
  };

  return (
    <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border z-50">
      <h3 className="text-sm font-medium mb-3">Form Tool</h3>
      <div className="space-y-3">
        <Select value={newFieldType} onValueChange={setNewFieldType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Field type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text Field</SelectItem>
            <SelectItem value="textarea">Text Area</SelectItem>
            <SelectItem value="checkbox">Checkbox</SelectItem>
            <SelectItem value="radio">Radio Button</SelectItem>
            <SelectItem value="select">Dropdown</SelectItem>
            <SelectItem value="date">Date Field</SelectItem>
            <SelectItem value="signature">Signature Field</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          size="sm" 
          onClick={handleAddField}
          disabled={!newFieldType}
          className="w-full"
        >
          Add Field
        </Button>
        {formFields.length > 0 && (
          <div className="text-xs text-gray-500">
            {formFields.length} field(s) on page {currentPage}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormTool;