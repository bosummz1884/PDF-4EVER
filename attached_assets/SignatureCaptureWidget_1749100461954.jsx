// src/components/SignatureCaptureWidget.jsx
import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { sha256 } from "js-sha256";
import styled from "styled-components";

const CanvasWrapper = styled.div`
  border: 2px dashed #999;
  border-radius: 12px;
  padding: 1rem;
  background: white;
  max-width: 100%;
  margin: 0 auto;
`;

const ButtonBar = styled.div`
  margin-top: 1rem;
  display: flex;
  justify-content: space-around;
  gap: 1rem;
  flex-wrap: wrap;
`;

const StyledButton = styled.button`
  padding: 0.5rem 1rem;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  background-color: #4f46e5;
  color: white;
  cursor: pointer;

  &:hover {
    background-color: #4338ca;
  }
`;

const SignatureCaptureWidget = ({
  onSigned = () => {},
  onClose = () => {}
}) => {
  const sigCanvas = useRef();

  const clear = () => {
    if (sigCanvas.current) sigCanvas.current.clear();
  };

  const save = () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) return;
    const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
    const hash = sha256(dataUrl);
    onSigned({ dataUrl, hash });
  };

  return (
    <CanvasWrapper>
      <SignatureCanvas
        ref={sigCanvas}
        penColor="black"
        canvasProps={{
          width: 500,
          height: 200,
          className: "sigCanvas"
        }}
      />
      <ButtonBar>
        <StyledButton onClick={clear}>Clear</StyledButton>
        <StyledButton onClick={save}>Save</StyledButton>
        <StyledButton onClick={onClose}>Cancel</StyledButton>
      </ButtonBar>
    </CanvasWrapper>
  );
};

export default SignatureCaptureWidget;
