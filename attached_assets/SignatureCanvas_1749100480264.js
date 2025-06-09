import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

export default function SignatureCanvasComponent({ onComplete }) {
  const canvasRef = useRef(null);

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas.isEmpty()) {
      const dataUrl = canvas.getTrimmedCanvas().toDataURL("image/png");
      onComplete(dataUrl);
      canvas.clear();
    }
  };

  return (
    <div className="p-4 bg-white border rounded shadow w-fit">
      <h2 className="text-lg font-bold mb-2">Draw Signature</h2>
      <SignatureCanvas
        ref={canvasRef}
        penColor="black"
        canvasProps={{
          width: 400,
          height: 200,
          className: "border rounded bg-gray-100",
        }}
      />
      <div className="mt-3 flex gap-3">
        <button
          className="bg-gray-600 text-white px-4 py-1 rounded"
          onClick={() => canvasRef.current.clear()}
        >
          Clear
        </button>
        <button
          className="bg-green-600 text-white px-4 py-1 rounded"
          onClick={saveSignature}
        >
          Save
        </button>
      </div>
    </div>
  );
}
