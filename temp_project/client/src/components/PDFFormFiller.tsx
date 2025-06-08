import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Save, 
  Download, 
  RefreshCw, 
  CheckSquare,
  Square,
  Circle,
  Type,
  Calendar,
  Mail,
  Phone,
  MapPin,
  User,
  Hash
} from "lucide-react";
import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from 'pdf-lib';

interface FormField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'checkbox' | 'radio' | 'dropdown' | 'signature' | 'date' | 'email' | 'phone' | 'number';
  value: string | boolean;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  page?: number;
}

interface PDFFormFillerProps {
  pdfDocument?: PDFDocument;
  onFormFilled?: (filledPdf: Uint8Array) => void;
  onFieldsDetected?: (fields: FormField[]) => void;
}

export function PDFFormFiller({ pdfDocument, onFormFilled, onFieldsDetected }: PDFFormFillerProps) {
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [autoSave, setAutoSave] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (pdfDocument) {
      detectFormFields();
    }
  }, [pdfDocument]);

  const detectFormFields = async () => {
    if (!pdfDocument) return;

    try {
      setIsProcessing(true);
      
      const form = pdfDocument.getForm();
      const fields = form.getFields();
      const pages = pdfDocument.getPageCount();
      setTotalPages(pages);

      const detectedFields: FormField[] = [];

      fields.forEach((field, index) => {
        const fieldName = field.getName();
        let fieldType: FormField['type'] = 'text';
        let value: string | boolean = '';
        let options: string[] | undefined;

        // Determine field type and extract properties
        if (field instanceof PDFTextField) {
          fieldType = field.isMultiline() ? 'textarea' : 'text';
          value = field.getText() || '';
          
          // Detect special field types based on name patterns
          const nameLower = fieldName.toLowerCase();
          if (nameLower.includes('email')) fieldType = 'email';
          else if (nameLower.includes('phone') || nameLower.includes('tel')) fieldType = 'phone';
          else if (nameLower.includes('date') || nameLower.includes('birth')) fieldType = 'date';
          else if (nameLower.includes('number') || nameLower.includes('amount') || nameLower.includes('quantity')) fieldType = 'number';
          
        } else if (field instanceof PDFCheckBox) {
          fieldType = 'checkbox';
          value = field.isChecked();
          
        } else if (field instanceof PDFRadioGroup) {
          fieldType = 'radio';
          options = field.getOptions();
          value = field.getSelected() || '';
          
        } else if (field instanceof PDFDropdown) {
          fieldType = 'dropdown';
          options = field.getOptions();
          value = field.getSelected()?.[0] || '';
        }

        // Get field positioning (if available)
        const widgets = field.acroField.getWidgets();
        let position;
        if (widgets.length > 0) {
          const widget = widgets[0];
          const rect = widget.getRectangle();
          position = {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          };
        }

        detectedFields.push({
          id: `field_${index}`,
          name: fieldName,
          type: fieldType,
          value,
          options,
          required: false, // PDF forms don't always have required flag
          placeholder: `Enter ${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
          position,
          page: 1 // Default to page 1, would need more complex logic to determine actual page
        });
      });

      setFormFields(detectedFields);
      onFieldsDetected?.(detectedFields);
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Error detecting form fields:', error);
      setIsProcessing(false);
    }
  };

  const updateFieldValue = (fieldId: string, newValue: string | boolean) => {
    setFormFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, value: newValue } : field
    ));
    setIsDirty(true);
    
    // Clear validation error for this field
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }

    // Auto-save if enabled
    if (autoSave) {
      setTimeout(() => fillPDFForm(), 100);
    }
  };

  const validateField = (field: FormField): string | null => {
    const { value, validation, required, type } = field;
    const stringValue = value.toString();

    if (required && (!stringValue || stringValue.trim() === '')) {
      return 'This field is required';
    }

    if (stringValue && validation) {
      if (validation.minLength && stringValue.length < validation.minLength) {
        return `Minimum length is ${validation.minLength} characters`;
      }
      
      if (validation.maxLength && stringValue.length > validation.maxLength) {
        return `Maximum length is ${validation.maxLength} characters`;
      }
      
      if (validation.pattern && !new RegExp(validation.pattern).test(stringValue)) {
        return 'Invalid format';
      }
      
      if (type === 'number') {
        const numValue = parseFloat(stringValue);
        if (isNaN(numValue)) return 'Must be a valid number';
        if (validation.min !== undefined && numValue < validation.min) {
          return `Minimum value is ${validation.min}`;
        }
        if (validation.max !== undefined && numValue > validation.max) {
          return `Maximum value is ${validation.max}`;
        }
      }
    }

    // Type-specific validation
    if (stringValue) {
      switch (type) {
        case 'email':
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(stringValue)) return 'Invalid email format';
          break;
        case 'phone':
          const phonePattern = /^[\+]?[\d\s\-\(\)]{10,}$/;
          if (!phonePattern.test(stringValue)) return 'Invalid phone number format';
          break;
        case 'date':
          if (isNaN(Date.parse(stringValue))) return 'Invalid date format';
          break;
      }
    }

    return null;
  };

  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    formFields.forEach(field => {
      const error = validateField(field);
      if (error) {
        errors[field.id] = error;
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const fillPDFForm = async () => {
    if (!pdfDocument) return;

    try {
      setIsProcessing(true);
      
      const form = pdfDocument.getForm();
      
      // Fill each field
      formFields.forEach(field => {
        try {
          const pdfField = form.getField(field.name);
          
          if (pdfField instanceof PDFTextField) {
            pdfField.setText(field.value.toString());
          } else if (pdfField instanceof PDFCheckBox) {
            if (field.value) {
              pdfField.check();
            } else {
              pdfField.uncheck();
            }
          } else if (pdfField instanceof PDFRadioGroup) {
            if (field.value) {
              pdfField.select(field.value.toString());
            }
          } else if (pdfField instanceof PDFDropdown) {
            if (field.value) {
              pdfField.select(field.value.toString());
            }
          }
        } catch (error) {
          console.error(`Error filling field ${field.name}:`, error);
        }
      });

      // Generate filled PDF
      const pdfBytes = await pdfDocument.save();
      onFormFilled?.(pdfBytes);
      setIsDirty(false);
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Error filling PDF form:', error);
      setIsProcessing(false);
    }
  };

  const downloadFilledPDF = async () => {
    if (!validateAllFields()) {
      return;
    }

    await fillPDFForm();
    
    if (pdfDocument) {
      const pdfBytes = await pdfDocument.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'filled-form.pdf';
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const resetForm = () => {
    setFormFields(prev => prev.map(field => ({
      ...field,
      value: field.type === 'checkbox' ? false : ''
    })));
    setValidationErrors({});
    setIsDirty(true);
  };

  const getFieldIcon = (type: FormField['type']) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'date': return <Calendar className="h-4 w-4" />;
      case 'number': return <Hash className="h-4 w-4" />;
      case 'checkbox': return <CheckSquare className="h-4 w-4" />;
      case 'radio': return <Circle className="h-4 w-4" />;
      case 'dropdown': return <Square className="h-4 w-4" />;
      case 'textarea': return <FileText className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  const renderField = (field: FormField) => {
    const error = validationErrors[field.id];
    const commonProps = {
      id: field.id,
      className: error ? 'border-red-300' : ''
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'date':
      case 'number':
        return (
          <Input
            {...commonProps}
            type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
            value={field.value.toString()}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
        
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            value={field.value.toString()}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        );
        
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={!!field.value}
              onCheckedChange={(checked) => updateFieldValue(field.id, !!checked)}
            />
            <Label htmlFor={field.id} className="text-sm">
              {field.name}
            </Label>
          </div>
        );
        
      case 'radio':
        return (
          <RadioGroup
            value={field.value.toString()}
            onValueChange={(value) => updateFieldValue(field.id, value)}
          >
            {field.options?.map(option => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}_${option}`} />
                <Label htmlFor={`${field.id}_${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
        
      case 'dropdown':
        return (
          <Select
            value={field.value.toString()}
            onValueChange={(value) => updateFieldValue(field.id, value)}
          >
            <SelectTrigger className={error ? 'border-red-300' : ''}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      default:
        return (
          <Input
            {...commonProps}
            value={field.value.toString()}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  if (!pdfDocument) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No PDF Loaded</h3>
          <p className="text-gray-600">Load a PDF document to detect and fill form fields</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PDF Form Filler
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={formFields.length > 0 ? "default" : "secondary"}>
                {formFields.length} fields detected
              </Badge>
              {isDirty && <Badge variant="outline">Unsaved changes</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={detectFormFields}
                disabled={isProcessing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                {isProcessing ? 'Detecting...' : 'Refresh Fields'}
              </Button>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autosave"
                  checked={autoSave}
                  onCheckedChange={(checked) => setAutoSave(checked === true)}
                />
                <Label htmlFor="autosave" className="text-sm">Auto-save</Label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetForm}>
                Reset Form
              </Button>
              <Button onClick={downloadFilledPDF} disabled={isProcessing}>
                <Download className="h-4 w-4 mr-2" />
                Download Filled PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Fields */}
      {formFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Form Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {formFields.map((field, index) => (
                  <div key={field.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getFieldIcon(field.type)}
                      <Label htmlFor={field.id} className="font-medium">
                        {field.name}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Badge variant="outline" className="text-xs">
                        {field.type}
                      </Badge>
                    </div>
                    
                    {renderField(field)}
                    
                    {validationErrors[field.id] && (
                      <p className="text-sm text-red-600">
                        {validationErrors[field.id]}
                      </p>
                    )}
                    
                    {index < formFields.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {formFields.length === 0 && !isProcessing && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Form Fields Detected</h3>
            <p className="text-gray-600 mb-4">
              This PDF doesn't appear to contain fillable form fields, or they couldn't be detected.
            </p>
            <Button variant="outline" onClick={detectFormFields}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}