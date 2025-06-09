import React from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";

export default function TextDetector({ onTextExtracted }) {
  const extractText = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";

    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const textPages = [];

      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const content = await page.getTextContent();
        const text = content.items.map((item) => item.str).join(" ");
        textPages.push({ pageIndex: i, text });
      }

      onTextExtracted && onTextExtracted(textPages);
    };

    input.click();
  };

  return (
    <button
      onClick={extractText}
      style={{
        padding: "10px 16px",
        background: "#d63031",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer"
      }}
    >
      🔍 Detect Text in PDF
    </button>
  );
}
