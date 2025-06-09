import React, {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?worker";

import ExportControls from "./ExportControls.jsx";
import AnnotationCanvas from "./AnnotationCanvas.jsx";
import EditableTextLayer from "./EditableTextLayer.jsx";
import SignatureCaptureWidget from "./SignatureCaptureWidget.jsx";
import PDFViewerControls from "./PDFViewerControls.jsx";

const DEFAULT_SCALE = 1.5;
const workerBlob = new Blob([pdfjsWorker], { type: "application/javascript" });
const workerUrl = URL.createObjectURL(workerBlob);
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;


const PDFTextEditor = forwardRef(({ file, fontOptions = {} }, ref) => {
  const canvasRef = useRef(null);
  const annotationRef = useRef();

  const [pdfData, setPdfData] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [textItems, setTextItems] = useState([]);
  const [userTextBoxes, setUserTextBoxes] = useState([]);
  const [viewport, setViewport] = useState(DEFAULT_SCALE);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(1.5);
  const [showSignature, setShowSignature] = useState(false);

  useEffect(() => {
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = async () => {
      const typedArray = new Uint8Array(fileReader.result);
      const doc = await pdfjsLib.getDocument({ data: typedArray }).promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setPdfData(fileReader.result);
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

    const page = await pdfDoc.getPage(currentPage);
    const vp = page.getViewport({ scale: zoom });

    console.log("Viewport size:", vp.width, vp.height);

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    canvas.width = vp.width || 800;
    canvas.height = vp.height || 1000;

    canvas.style.backgroundColor = "#eee"; // makes canvas visible

    await page.render({ canvasContext: context, viewport: vp }).promise;
  } catch (err) {
    console.error("Error rendering page:", err);
  }
};

  const handleTextSubmit = (text, position) => {
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
    if (!pdfData || !viewport) return;

    const pdfDoc = await PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();

    for (const box of userTextBoxes) {
      const pg = pages[box.page - 1];
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
        pg.drawImage(image, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        });
      }
    }

    const modifiedBytes = await pdfDoc.save();
    const blob = new Blob([modifiedBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url);
  };

  const hexToRgb = (hex) => {
    const bigint = parseInt(hex.replace("#", ""), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  };

  useImperativeHandle(ref, () => ({
    exportPDF,
  }));

  return (
    <div
      className="pdf-editor"
      style={{
        position: "relative",
        maxInlineSize: "900px",
        margin: "0 auto",
        background: "#eee",
        padding: "10px",
        borderRadius: "6px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
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

      <canvas ref={canvasRef} style={{ border: "1px solid #000" }} />


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
          {showSignature && (
            <SignatureCaptureWidget
              onSigned={(data) => console.log("Signature:", data)}
              onClose={() => setShowSignature(false)}
            />
          )}
        </>
      )}
    </div>
  );
});

export default PDFTextEditor;
