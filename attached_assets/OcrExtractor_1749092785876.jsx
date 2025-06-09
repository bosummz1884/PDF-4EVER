import React from "react";
import Tesseract from "tesseract.js";

export default function OcrExtractor({ onTextExtracted }) {
  const handleImageUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const result = await Tesseract.recognize(file, "eng", {
        logger: (m) => console.log(m)
      });

      onTextExtracted && onTextExtracted(result.data.text);
    };

    input.click();
  };

  return (
    <button
      onClick={handleImageUpload}
      style={{
        padding: "10px 16px",
        background: "#0984e3",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer"
      }}
    >
      🔎 Extract Text from Image (OCR)
    </button>
  );
}
