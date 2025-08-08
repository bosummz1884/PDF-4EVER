import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/types/pdf-types";

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
      value: "",
      placeholder: `Enter ${newFieldType}`,
      required: false,
      rect: {
        x: 100,
        y: 100,
        width: 150,
        height: 30,
      },
    };

    onFormFieldAdd(newField);
    setNewFieldType("");
  };

  return (
    <div
      className="absolute top-4 left-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border z-50"
      data-oid="59-5o73"
    >
      <h3 className="text-sm font-medium mb-3" data-oid="5:9yzo3">
        Form Tool
      </h3>
      <div className="space-y-3" data-oid="4n0dnhq">
        <Select
          value={newFieldType}
          onValueChange={setNewFieldType}
          data-oid="hur4tzr"
        >
          <SelectTrigger className="w-40" data-oid="ekvltrc">
            <SelectValue placeholder="Field type" data-oid="1vbh9yw" />
          </SelectTrigger>
          <SelectContent data-oid="r0on_im">
            <SelectItem value="text" data-oid="4pm5vj3">
              Text Field
            </SelectItem>
            <SelectItem value="textarea" data-oid="_ol12de">
              Text Area
            </SelectItem>
            <SelectItem value="checkbox" data-oid="p2v_kq4">
              Checkbox
            </SelectItem>
            <SelectItem value="radio" data-oid="8-640ui">
              Radio Button
            </SelectItem>
            <SelectItem value="select" data-oid="rb01h.6">
              Dropdown
            </SelectItem>
            <SelectItem value="date" data-oid="4w8dsf1">
              Date Field
            </SelectItem>
            <SelectItem value="signature" data-oid="68re1h-">
              Signature Field
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={handleAddField}
          disabled={!newFieldType}
          className="w-full"
          data-oid="pew6hyx"
        >
          Add Field
        </Button>
        {formFields.length > 0 && (
          <div className="text-xs text-gray-500" data-oid="wwwtr04">
            {formFields.length} field(s) on page {currentPage}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormTool;
