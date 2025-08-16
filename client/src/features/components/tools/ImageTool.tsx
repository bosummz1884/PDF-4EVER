// src/features/components/tools/ImageTool.tsx

import React, { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { EditorToolProps } from "@/types/pdf-types";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, RotateCw, Upload, Palette } from "lucide-react";
import { usePDFEditor } from "@/features/pdf-editor/PDFEditorContext";

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

// Tool panel component for configuring image settings
export const ImageToolComponent: React.FC<EditorToolProps> = ({
  settings,
  onSettingChange,
}) => {
  const { state, dispatch } = usePDFEditor();
  const { selectedElementId, selectedElementType, imageElements, currentPage } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImageSelected = selectedElementType === 'image' && selectedElementId;

  const selectedImage = isImageSelected 
    ? Object.values(imageElements).flat().find(el => el.id === selectedElementId) 
    : null;

  const opacity = selectedImage?.opacity ?? settings.opacity ?? 1;
  const rotation = selectedImage?.rotation ?? settings.rotation ?? 0;
  const borderWidth = selectedImage?.borderWidth ?? settings.borderWidth ?? 0;
  const borderColor = selectedImage?.borderColor ?? settings.borderColor ?? '#000000';

  // Enhanced to support more image properties
  const handleSettingChangeForSelected = (key: 'opacity' | 'rotation' | 'borderWidth' | 'borderColor', value: number | string) => {
    if (isImageSelected && selectedImage) {
        dispatch({
            type: 'UPDATE_IMAGE_ELEMENT',
            payload: { page: selectedImage.page, id: selectedImage.id, updates: { [key]: value } }
        });
        dispatch({ type: 'SAVE_TO_HISTORY' });
    } else {
        onSettingChange(key, value);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, WebP, or SVG)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image file is too large. Please select a file smaller than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Calculate appropriate size (max 300px width/height)
        const maxSize = 300;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }

        const newImageElement = {
          id: `image-${Date.now()}`,
          page: currentPage,
          src,
          x: 100,
          y: 100,
          width,
          height,
          rotation: 0,
          opacity: 1,
          borderWidth: 0,
          borderColor: '#000000'
        };

        dispatch({ type: 'ADD_IMAGE_ELEMENT', payload: { page: currentPage, element: newImageElement } });
        dispatch({ type: 'SET_SELECTED_ELEMENTS', payload: { ids: [newImageElement.id], type: 'image' } });
        dispatch({ type: 'SAVE_TO_HISTORY' });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const rotateBy = (angle: number) => {
    handleSettingChangeForSelected('rotation', (rotation + angle) % 360);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {isImageSelected 
          ? "Adjust properties of the selected image." 
          : "Upload and place a new image on the page."
        }
      </p>
      
      {/* Image Upload */}
      {!isImageSelected && (
        <div className="space-y-2">
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            className="w-full"
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
            onChange={handleImageUpload}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground">
            Supports JPEG, PNG, GIF, WebP, SVG (max 10MB)
          </p>
        </div>
      )}
      
      {/* Opacity Slider */}
      <div className="space-y-1.5">
        <Label className="text-xs">
          Opacity: {Math.round(opacity * 100)}%
        </Label>
        <Slider
          value={[opacity * 100]}
          onValueChange={([val]) => handleSettingChangeForSelected("opacity", val / 100)}
          min={0}
          max={100}
          step={5}
          disabled={!isImageSelected}
        />
      </div>

      {/* Rotation Controls */}
      <div className="space-y-1.5">
          <Label className="text-xs">Rotation: {rotation}°</Label>
          <div className="flex items-center gap-2">
              <Input
                  type="number"
                  value={rotation}
                  onChange={(e) => handleSettingChangeForSelected("rotation", parseInt(e.target.value) || 0)}
                  className="w-full"
                  min={-360}
                  max={360}
                  disabled={!isImageSelected}
              />
              <Button variant="outline" size="icon" onClick={() => rotateBy(-90)} disabled={!isImageSelected}>
                  <RotateCcw size={16}/>
              </Button>
               <Button variant="outline" size="icon" onClick={() => rotateBy(90)} disabled={!isImageSelected}>
                  <RotateCw size={16}/>
               </Button>
          </div>
          <Slider
            value={[rotation]}
            onValueChange={([val]) => handleSettingChangeForSelected("rotation", val)}
            min={0}
            max={360}
            step={1}
            disabled={!isImageSelected}
        />
      </div>

      {/* Border Controls */}
      <div className="space-y-1.5">
        <Label className="text-xs">Border Width: {borderWidth}px</Label>
        <Slider
          value={[borderWidth]}
          onValueChange={([val]) => handleSettingChangeForSelected("borderWidth", val)}
          min={0}
          max={20}
          step={1}
          disabled={!isImageSelected}
        />
      </div>

      {/* Border Color */}
      {borderWidth > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs">Border Color</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={borderColor}
              onChange={(e) => handleSettingChangeForSelected("borderColor", e.target.value)}
              className="w-12 h-8 p-1 border rounded"
              disabled={!isImageSelected}
            />
            <Input
              type="text"
              value={borderColor}
              onChange={(e) => handleSettingChangeForSelected("borderColor", e.target.value)}
              className="flex-1"
              placeholder="#000000"
              disabled={!isImageSelected}
            />
          </div>
        </div>
      )}

      {/* Image Info */}
      {isImageSelected && selectedImage && (
        <div className="pt-2 border-t space-y-1">
          <p className="text-xs text-muted-foreground">
            Size: {Math.round(selectedImage.width)} × {Math.round(selectedImage.height)}px
          </p>
          <p className="text-xs text-muted-foreground">
            Position: ({Math.round(selectedImage.x)}, {Math.round(selectedImage.y)})
          </p>
        </div>
      )}
    </div>
  );
};

const ImageTool: React.FC = () => {
  // You can make this fancier later, but here's a simple switcher:
  const [mode, setMode] = useState<ImageToolMode>("gallery");

  return (
    <div>
      {/* Buttons to select the tool */}
      <div className="flex gap-2 mb-5">
        <Button variant={mode === "gallery" ? "default" : "outline"} size="sm" onClick={() => setMode("gallery")}>
          Gallery
        </Button>
        <Button variant={mode === "compress" ? "default" : "outline"} size="sm" onClick={() => setMode("compress")}>
          Compress
        </Button>
        <Button variant={mode === "crop" ? "default" : "outline"} size="sm" onClick={() => setMode("crop")}>
          Crop
        </Button>
        <Button variant={mode === "merge" ? "default" : "outline"} size="sm" onClick={() => setMode("merge")}>
          Merge
        </Button>
        <Button variant={mode === "resize" ? "default" : "outline"} size="sm" onClick={() => setMode("resize")}>
          Resize
        </Button>
        <Button variant={mode === "toPdf" ? "default" : "outline"} size="sm" onClick={() => setMode("toPdf")}>
          To PDF
        </Button>
      </div>
      {/* Render the selected tool */}
      {mode === "gallery" && <ImageGallery />}
      {mode === "compress" && <ImageCompressor />}
      {mode === "crop" && <ImageCropper />}
      {mode === "merge" && <ImageMerger />}
      {mode === "resize" && <ImageResizer />}
      {mode === "toPdf" && <ImageToPdf />}
    </div>
  );
};

export default ImageTool;
