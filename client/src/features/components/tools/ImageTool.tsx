import React, { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";

export type ImageToolMode =
  | "compress"
  | "crop"
  | "gallery"
  | "merge"
  | "resize"
  | "toPdf";

function ImageCompressor({
  onCompressed,
}: {
  onCompressed?: (blob: Blob) => void;
}) {
  const handleCompress = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const image = new window.Image();
      image.src = URL.createObjectURL(file);

      image.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) return;
        const scale = 0.7;
        canvas.width = image.width * scale;
        canvas.height = image.height * scale;

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob && onCompressed) onCompressed(blob);
          },
          "image/jpeg",
          0.7,
        );
      };
    };

    input.click();
  };

  return (
    <button
      onClick={handleCompress}
      style={{
        padding: "10px 16px",
        background: "#fdcb6e",
        color: "#000",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
      }}
      data-oid="xrsmad8"
    >
      📉 Compress Image
    </button>
  );
}

function ImageCropper({ onCropped }: { onCropped?: (blob: Blob) => void }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        setImage(img);
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0);
        }
      };
    };

    input.click();
  };

  const drawCropBox = () => {
    if (!cropStart || !cropEnd || !image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    ctx.strokeStyle = "#e17055";
    ctx.lineWidth = 2;

    const x = Math.min(cropStart.x, cropEnd.x);
    const y = Math.min(cropStart.y, cropEnd.y);
    const w = Math.abs(cropStart.x - cropEnd.x);
    const h = Math.abs(cropStart.y - cropEnd.y);

    ctx.strokeRect(x, y, w, h);
  };

  const cropImage = () => {
    if (!cropStart || !cropEnd || !image || !canvasRef.current) return;

    const x = Math.min(cropStart.x, cropEnd.x);
    const y = Math.min(cropStart.y, cropEnd.y);
    const width = Math.abs(cropStart.x - cropEnd.x);
    const height = Math.abs(cropStart.y - cropEnd.y);

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;
    tempCtx.drawImage(
      canvasRef.current,
      x,
      y,
      width,
      height,
      0,
      0,
      width,
      height,
    );

    tempCanvas.toBlob((blob) => {
      if (blob && onCropped) onCropped(blob);
    }, "image/jpeg");
  };

  return (
    <div data-oid="vae4.y7">
      <button
        onClick={handleImageUpload}
        style={{ marginBottom: 10 }}
        data-oid="t63djfk"
      >
        🖼️ Upload Image
      </button>
      <br data-oid="tzr2uqu" />
      <canvas
        ref={canvasRef}
        style={{ border: "1px solid #ccc", cursor: "crosshair" }}
        onMouseDown={(e) => {
          const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
          setCropStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          setCropEnd(null);
        }}
        onMouseMove={(e) => {
          if (!cropStart) return;
          const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
          setCropEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          drawCropBox();
        }}
        onMouseUp={(e) => {
          const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
          setCropEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          drawCropBox();
        }}
        data-oid="4al3fd6"
      />

      <br data-oid="o9-xt9f" />
      <button
        onClick={cropImage}
        disabled={!cropStart || !cropEnd}
        data-oid="7tf2hqm"
      >
        ✂️ Crop Selected Area
      </button>
    </div>
  );
}

function ImageGallery({
  images = [],
  onRemove,
}: {
  images?: (string | File)[];
  onRemove?: (index: number) => void;
}) {
  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}
      data-oid="fpbb5b9"
    >
      {images.map((img, index) => (
        <div key={index} style={{ textAlign: "center" }} data-oid="awwavnx">
          <img
            src={typeof img === "string" ? img : URL.createObjectURL(img)}
            alt={`Image ${index + 1}`}
            style={{
              width: 150,
              height: "auto",
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
            data-oid="ox1e57q"
          />

          <button
            onClick={() => onRemove && onRemove(index)}
            style={{
              marginTop: "0.5rem",
              background: "#d63031",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "6px 10px",
              cursor: "pointer",
            }}
            data-oid=":ve-.hz"
          >
            🗑 Remove
          </button>
        </div>
      ))}
    </div>
  );
}

function ImageMerger({ onMerged }: { onMerged?: (blob: Blob) => void }) {
  const handleMergeImages = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;

    input.onchange = async (event: Event) => {
      const files = Array.from((event.target as HTMLInputElement).files || []);
      if (files.length === 0) return;

      const images: HTMLImageElement[] = await Promise.all(
        files.map(
          (file) =>
            new Promise<HTMLImageElement>((resolve) => {
              const img = new window.Image();
              img.src = URL.createObjectURL(file);
              img.onload = () => resolve(img);
            }),
        ),
      );

      const maxWidth = Math.max(...images.map((img) => img.width));
      const totalHeight = images.reduce((sum, img) => sum + img.height, 0);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = maxWidth;
      canvas.height = totalHeight;

      let yOffset = 0;
      images.forEach((img) => {
        ctx.drawImage(img, 0, yOffset);
        yOffset += img.height;
      });

      canvas.toBlob((blob) => {
        if (blob && onMerged) onMerged(blob);
      }, "image/jpeg");
    };

    input.click();
  };

  return (
    <button
      onClick={handleMergeImages}
      style={{
        padding: "10px 16px",
        background: "#6c5ce7",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
      }}
      data-oid="kndgq6k"
    >
      🧩 Merge Images
    </button>
  );
}

function ImageResizer({ onResized }: { onResized?: (blob: Blob) => void }) {
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 800,
    height: 600,
  });

  const handleResize = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const image = new window.Image();
      image.src = URL.createObjectURL(file);

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob && onResized) onResized(blob);
          },
          "image/jpeg",
          0.8,
        );
      };
    };

    input.click();
  };

  return (
    <div data-oid=".dn2k14">
      <div style={{ marginBottom: 10 }} data-oid="2.j:ty2">
        <label data-oid="4s2i2zm">
          Width:{" "}
          <input
            type="number"
            value={dimensions.width}
            onChange={(e) =>
              setDimensions({
                ...dimensions,
                width: parseInt(e.target.value) || 0,
              })
            }
            style={{ width: 60 }}
            data-oid="qdhp.2n"
          />
        </label>{" "}
        <label data-oid="6:hpa0r">
          Height:{" "}
          <input
            type="number"
            value={dimensions.height}
            onChange={(e) =>
              setDimensions({
                ...dimensions,
                height: parseInt(e.target.value) || 0,
              })
            }
            style={{ width: 60 }}
            data-oid="wslfdzz"
          />
        </label>
      </div>
      <button
        onClick={handleResize}
        style={{
          padding: "10px 16px",
          background: "#00b894",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
        data-oid="hga5t6m"
      >
        📐 Resize Image
      </button>
    </div>
  );
}

function ImageToPdf({
  onGenerated,
}: {
  onGenerated?: (pdfBytes: Uint8Array) => void;
}) {
  const handleImageToPdf = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.create();
      let image, dims;

      // Try JPG first, then PNG
      try {
        image = await pdfDoc.embedJpg(arrayBuffer);
        dims = image.scale(1);
      } catch {
        image = await pdfDoc.embedPng(arrayBuffer);
        dims = image.scale(1);
      }

      const page = pdfDoc.addPage([dims.width, dims.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: dims.width,
        height: dims.height,
      });

      const pdfBytes = await pdfDoc.save();
      if (onGenerated) onGenerated(new Uint8Array(pdfBytes));
    };

    input.click();
  };

  return (
    <button
      onClick={handleImageToPdf}
      style={{
        padding: "10px 16px",
        background: "#00b894",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
      }}
      data-oid="ja-pje2"
    >
      🖼️ Convert Image to PDF
    </button>
  );
}

const ImageTool: React.FC = () => {
  // You can make this fancier later, but here’s a simple switcher:
  const [mode, setMode] = useState<ImageToolMode>("gallery");

  return (
    <div data-oid="m0p007v">
      {/* Buttons to select the tool */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 20 }}
        data-oid="5.ms6qf"
      >
        <button onClick={() => setMode("gallery")} data-oid="2q.e2on">
          Gallery
        </button>
        <button onClick={() => setMode("compress")} data-oid="l4fbh0x">
          Compress
        </button>
        <button onClick={() => setMode("crop")} data-oid="3je_-.y">
          Crop
        </button>
        <button onClick={() => setMode("merge")} data-oid="9r6h3e_">
          Merge
        </button>
        <button onClick={() => setMode("resize")} data-oid="atx9a-i">
          Resize
        </button>
        <button onClick={() => setMode("toPdf")} data-oid="1rl.uhg">
          To PDF
        </button>
      </div>
      {/* Render the selected tool */}
      {mode === "gallery" && <ImageGallery data-oid="po04mya" />}
      {mode === "compress" && <ImageCompressor data-oid="s.src35" />}
      {mode === "crop" && <ImageCropper data-oid="v9ccldn" />}
      {mode === "merge" && <ImageMerger data-oid="hmqk:jh" />}
      {mode === "resize" && <ImageResizer data-oid="55lc-0f" />}
      {mode === "toPdf" && <ImageToPdf data-oid="qg86yyv" />}
    </div>
  );
};

export default ImageTool;
