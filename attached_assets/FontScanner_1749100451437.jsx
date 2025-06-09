import React, { useState } from "react";

const FONT_LIST = [
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Trebuchet MS",
  "Comic Sans MS"
];

export default function FontScanner({ onFontDetected }) {
  const [status, setStatus] = useState("");

  const handleFontScan = async () => {
    setStatus("Scanning...");

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const uploadedImage = new Image();
      uploadedImage.src = URL.createObjectURL(file);

      uploadedImage.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = uploadedImage.width;
        canvas.height = uploadedImage.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(uploadedImage, 0, 0);

        const uploadedPixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        const guess = await guessFont(uploadedPixels, uploadedImage.width, uploadedImage.height);
        setStatus(`Detected font: ${guess}`);
        onFontDetected && onFontDetected(guess);
      };
    };

    input.click();
  };

  const guessFont = async (targetPixels, width, height) => {
    const text = "Sample Text";
    let bestMatch = "";
    let bestDiff = Infinity;

    for (const font of FONT_LIST) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);
      ctx.font = `30px "${font}"`;
      ctx.fillStyle = "black";
      ctx.fillText(text, 10, 50);

      const samplePixels = ctx.getImageData(0, 0, width, height).data;
      let diff = 0;

      for (let i = 0; i < targetPixels.length; i += 4) {
        diff += Math.abs(targetPixels[i] - samplePixels[i]); // only red channel
      }

      if (diff < bestDiff) {
        bestDiff = diff;
        bestMatch = font;
      }
    }

    return bestMatch;
  };

  return (
    <div>
      <button
        onClick={handleFontScan}
        style={{
          padding: "10px 16px",
          background: "#a29bfe",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        🔍 Scan Font From Image
      </button>
      <div style={{ marginTop: 10, fontSize: "0.9rem", color: "#636e72" }}>{status}</div>
    </div>
  );
}
