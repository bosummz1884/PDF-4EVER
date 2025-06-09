import { PDFDocument } from 'pdf-lib';

export async function fillPdfForm(pdfBytes, formData = {}) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  Object.entries(formData).forEach(([fieldName, value]) => {
    const field = form.getFieldMaybe(fieldName);
    if (field) field.setText(String(value));
  });

  const modifiedPdfBytes = await pdfDoc.save();
  return modifiedPdfBytes;
}
export async function fillPdfFormWithCheckboxes(pdfBytes, formData = {}) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  Object.entries(formData).forEach(([fieldName, value]) => {
    const field = form.getFieldMaybe(fieldName);
    if (field) {
      if (field.constructor.name === 'PDFCheckBox') {
        field.check(value);
      } else {
        field.setText(String(value));
      }
    }
  });

  const modifiedPdfBytes = await pdfDoc.save();
  return modifiedPdfBytes;
}