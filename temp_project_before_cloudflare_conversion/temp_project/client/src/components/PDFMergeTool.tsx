import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, X, ArrowUp, ArrowDown } from "lucide-react";
import { mergePDFs } from "@/lib/pdfUtils";

interface PDFFile {
  file: File;
  id: string;
  name: string;
  size: number;
}

interface PDFMergeToolProps {
  onClose: () => void;
}

const PDFMergeTool: React.FC<PDFMergeToolProps> = ({ onClose }) => {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFileObjects = files
      .filter(file => file.type === 'application/pdf')
      .map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size
      }));
    
    setPdfFiles(prev => [...prev, ...pdfFileObjects]);
  };

  const removeFile = (id: string) => {
    setPdfFiles(prev => prev.filter(file => file.id !== id));
  };

  const moveFileUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...pdfFiles];
    [newFiles[index], newFiles[index - 1]] = [newFiles[index - 1], newFiles[index]];
    setPdfFiles(newFiles);
  };

  const moveFileDown = (index: number) => {
    if (index === pdfFiles.length - 1) return;
    const newFiles = [...pdfFiles];
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    setPdfFiles(newFiles);
  };

  const handleMerge = async () => {
    if (pdfFiles.length < 2) {
      alert('Please select at least 2 PDF files to merge');
      return;
    }

    setIsProcessing(true);
    try {
      const pdfBuffers = await Promise.all(
        pdfFiles.map(async ({ file }) => {
          const arrayBuffer = await file.arrayBuffer();
          return new Uint8Array(arrayBuffer);
        })
      );

      const mergedPdf = await mergePDFs(pdfBuffers);
      const blob = new Blob([mergedPdf], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged_document.pdf';
      a.click();
      
      URL.revokeObjectURL(url);
      alert('PDFs merged successfully!');
    } catch (error) {
      alert('Error merging PDFs: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Merge PDF Files</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Select PDF files to merge
            </p>
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload">
              <Button variant="outline" className="cursor-pointer">
                Choose PDF Files
              </Button>
            </label>
          </div>

          {pdfFiles.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <h3 className="font-medium">Files to merge ({pdfFiles.length}):</h3>
              {pdfFiles.map((pdfFile, index) => (
                <div key={pdfFile.id} className="flex items-center gap-2 p-2 border rounded">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{pdfFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(pdfFile.size)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveFileUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveFileDown(index)}
                      disabled={index === pdfFiles.length - 1}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(pdfFile.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleMerge}
              disabled={pdfFiles.length < 2 || isProcessing}
              className="flex-1 bg-gradient-to-r from-primary via-secondary to-accent text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              {isProcessing ? 'Merging...' : 'Merge PDFs'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFMergeTool;