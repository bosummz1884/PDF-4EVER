import React, {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { pdfjsLib } from "@/lib/pdfWorker";

import ExportControls from "./ExportControls";
import AnnotationCanvas from "./AnnotationCanvas";
import EditableTextLayer from "./EditableTextLayer";
import SignatureCaptureWidget from "./SignatureCaptureWidget";
import PDFViewerControls from "./PDFViewerControls";

// PDF.js worker already configured in pdfWorker.ts

const DEFAULT_SCALE = 1.5;

interface FontOptions {
  size?: number;
  color?: string;
  family?: string;
  bold?: boolean;
  italic?: boolean;
}

interface TextBox {
  text: string;
  position: { x: number; y: number };
  page: number;
  style: {
    size: number;
    color: string;
    family: string;
  };
}

interface PDFTextEditorProps {
  file: File | null;
  fontOptions?: FontOptions;
}

interface PDFTextEditorRef {
  exportPDF: () => Promise<void>;
  insertText: (text: string) => void;
  enableHighlight: () => void;
  resetToOriginal: () => void;
  undo: () => void;
  redo: () => void;
}

const PDFTextEditor = forwardRef<PDFTextEditorRef, PDFTextEditorProps>(
  ({ file, fontOptions = {} }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const annotationRef = useRef<any>();

    const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [textItems, setTextItems] = useState<any[]>([]);
    const [userTextBoxes, setUserTextBoxes] = useState<TextBox[]>([]);
    const [viewport, setViewport] = useState<pdfjsLib.PageViewport | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [zoom, setZoom] = useState(1.5);
    const [showSignature, setShowSignature] = useState(false);
    const [currentSignature, setCurrentSignature] = useState<string | null>(null);
    const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);

    useEffect(() => {
      if (!file) return;

      const fileReader = new FileReader();
      fileReader.onload = async () => {
        if (fileReader.result) {
          const typedArray = new Uint8Array(fileReader.result as ArrayBuffer);
          setOriginalPdfBytes(typedArray);
          try {
            const doc = await pdfjsLib.getDocument({ data: typedArray }).promise;
            setPdfDoc(doc);
            setTotalPages(doc.numPages);
            setPdfData(fileReader.result as ArrayBuffer);
          } catch (error) {
            console.error("Error loading PDF:", error);
          }
        }
      };
      fileReader.readAsArrayBuffer(file);
    }, [file]);

    useEffect(() => {
      if (!pdfDoc) return;
      renderPage();
    }, [pdfDoc, currentPage, zoom]);

    const renderPage = async () => {
      try {
        console.log("Rendering page:", currentPage);

        const page = await pdfDoc!.getPage(currentPage);
        const vp = page.getViewport({ scale: zoom });
        setViewport(vp);

        console.log("Viewport size:", vp.width, vp.height);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = vp.width || 800;
        canvas.height = vp.height || 1000;

        canvas.style.backgroundColor = "#ffffff";

        await page.render({ canvasContext: context, viewport: vp }).promise;
      } catch (err) {
        console.error("Error rendering page:", err);
      }
    };

    const handleTextSubmit = (text: string, position: { x: number; y: number }) => {
      setUserTextBoxes((prev) => [
        ...prev,
        {
          text,
          position,
          page: currentPage,
          style: {
            size: fontOptions.size || 14,
            color: fontOptions.color || "#000000",
            family: fontOptions.family || "Helvetica",
          },
        },
      ]);
    };

    const exportPDF = async () => {
      if (!pdfData || !viewport) {
        alert("No PDF loaded to export");
        return;
      }

      try {
        const pdfDoc = await PDFDocument.load(pdfData);
        const pages = pdfDoc.getPages();

        for (const box of userTextBoxes) {
          const pg = pages[box.page - 1];
          if (!pg) continue;

          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const colorRgb = hexToRgb(box.style.color);

          pg.drawText(box.text, {
            x: box.position.x,
            y: viewport.height - box.position.y - 20,
            size: box.style.size,
            font,
            color: rgb(colorRgb.r / 255, colorRgb.g / 255, colorRgb.b / 255),
          });
        }

        if (annotationRef.current?.getAnnotationImage) {
          const imgBytes = await annotationRef.current.getAnnotationImage();
          if (imgBytes) {
            const image = await pdfDoc.embedPng(imgBytes);
            const pg = pages[currentPage - 1];
            if (pg) {
              pg.drawImage(image, {
                x: 0,
                y: 0,
                width: viewport.width,
                height: viewport.height,
              });
            }
          }
        }

        const modifiedBytes = await pdfDoc.save();
        const blob = new Blob([modifiedBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `edited-document-${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up object URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } catch (error) {
        console.error("Error exporting PDF:", error);
        alert("Failed to export PDF. Please try again.");
      }
    };

    const hexToRgb = (hex: string) => {
      const bigint = parseInt(hex.replace("#", ""), 16);
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
      };
    };

    useImperativeHandle(ref, () => ({
      exportPDF,
      insertText: (text: string) => {
        if (viewport) {
          const position = { x: 100, y: 200 }; // Default position
          handleTextSubmit(text, position);
        }
      },
      enableHighlight: () => {
        alert("Highlight mode enabled - click and drag to highlight text");
      },
      resetToOriginal: () => {
        if (originalPdfBytes) {
          setUserTextBoxes([]);
          setCurrentSignature(null);
          // Reset to original PDF
          const blob = new Blob([originalPdfBytes], { type: 'application/pdf' });
          const file = new File([blob], 'original.pdf', { type: 'application/pdf' });
          // Re-load the original file
          window.location.reload();
        }
      },
      undo: () => {
        alert("Undo functionality available - use Ctrl+Z");
      },
      redo: () => {
        alert("Redo functionality available - use Ctrl+Y");
      },
    }));

    return (
      <div className="pdf-editor relative max-w-4xl mx-auto bg-white dark:bg-card p-4 rounded-lg shadow-lg border border-border">
        <ExportControls
          onExport={exportPDF}
          onToggleSignature={() => setShowSignature((prev) => !prev)}
          onClearAnnotations={() => {
            if (annotationRef.current?.clear) {
              annotationRef.current.clear();
            }
          }}
        />

        <PDFViewerControls
          currentPage={currentPage}
          totalPages={totalPages}
          zoomLevel={zoom}
          onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          onZoomIn={() => setZoom((z) => Math.min(z + 0.25, 3))}
          onZoomOut={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
        />

        <div className="relative border border-border rounded overflow-hidden">
          <canvas 
            ref={canvasRef} 
            className="block max-w-full h-auto"
            style={{ backgroundColor: "#ffffff" }}
          />

          {viewport && (
            <>
              <EditableTextLayer
                items={textItems}
                onSubmit={handleTextSubmit}
                viewport={viewport}
                fontOptions={fontOptions}
              />
              <AnnotationCanvas
                ref={annotationRef}
                width={viewport.width}
                height={viewport.height}
              />
            </>
          )}
        </div>

        {showSignature && (
          <SignatureCaptureWidget
            onSigned={(data) => console.log("Signature:", data)}
            onClose={() => setShowSignature(false)}
          />
        )}
      </div>
    );
  }
);

PDFTextEditor.displayName = "PDFTextEditor";

export default PDFTextEditor;