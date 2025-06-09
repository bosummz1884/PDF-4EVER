import React, { useState } from "react";

export default function SignatureDragLayer({ signatureDataUrl, onPlace }) {
  const [positions, setPositions] = useState([]);

  const handleDrop = (e) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;

    const newSig = { x, y, width: 150, height: 75, src: signatureDataUrl };
    setPositions((prev) => [...prev, newSig]);
    onPlace?.(newSig);
  };

  return (
    <div
      className="relative w-full h-full border border-dashed border-gray-400"
      onClick={(e) => handleDrop(e)}
    >
      {positions.map((sig, i) => (
        <img
          key={i}
          src={sig.src}
          alt="Signature"
          style={{
            position: "absolute",
            left: sig.x,
            top: sig.y,
            width: sig.width,
            height: sig.height,
            pointerEvents: "none",
          }}
        />
      ))}
    </div>
  );
}
