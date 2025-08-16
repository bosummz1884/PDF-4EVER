// src/features/hooks/usePDFExport.ts

import { useCallback, useState } from 'react';
import { usePDFEditor } from '../pdf-editor/PDFEditorContext';
import { savePdfWithAnnotations, triggerDownload } from '@/lib/savePdf';
import { useToast } from './use-toast';

interface ExportProgress {
  progress: number;
  status: string;
  isExporting: boolean;
}

export const usePDFExport = () => {
  const { state } = usePDFEditor();
  const { toast } = useToast();
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    progress: 0,
    status: '',
    isExporting: false
  });

  const exportPDF = useCallback(async (filename?: string) => {
    if (!state.pdfDocument || !state.originalPdfData) {
      toast({
        title: "Export Failed",
        description: "No PDF document loaded",
        variant: "destructive"
      });
      return;
    }

    setExportProgress({ progress: 0, status: 'Starting export...', isExporting: true });

    try {
      // Collect all elements from all pages
      const allTextElements = Object.values(state.textElements).flat();
      const allAnnotations = Object.values(state.annotations).flat();
      const allWhiteoutBlocks = Object.values(state.whiteoutBlocks).flat();
      const allImageElements = Object.values(state.imageElements).flat();
      const allFreeformElements = Object.values(state.freeformElements).flat();

      // Progress callback
      const onProgress = (progress: number, status: string) => {
        setExportProgress({ progress, status, isExporting: true });
      };

      // Save PDF with all annotations
      const savedBytes = await savePdfWithAnnotations(
        state.originalPdfData,
        allTextElements,
        allAnnotations,
        allWhiteoutBlocks,
        allImageElements,
        allFreeformElements,
        onProgress
      );

      // Generate filename
      const exportFilename = filename || 
        (state.fileName ? 
          state.fileName.replace('.pdf', '_edited.pdf') : 
          'edited_document.pdf'
        );

      // Trigger download
      triggerDownload(savedBytes, exportFilename);

      toast({
        title: "Export Successful",
        description: `PDF exported as ${exportFilename}`
      });

      setExportProgress({ progress: 100, status: 'Export complete!', isExporting: false });

    } catch (error) {
      console.error('PDF export failed:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      setExportProgress({ progress: 0, status: 'Export failed', isExporting: false });
    }
  }, [state, toast]);

  const exportWithProgress = useCallback(async (filename?: string) => {
    return exportPDF(filename);
  }, [exportPDF]);

  return {
    exportPDF,
    exportWithProgress,
    exportProgress,
    isExporting: exportProgress.isExporting
  };
};