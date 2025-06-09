// src/components/AnnotationToolbar.jsx
import React from "react";
import styled from "styled-components";

const ToolbarWrapper = styled.div`
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  justify-content: center;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  background-color: #4f46e5;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: #4338ca;
  }
`;

const AnnotationToolbar = ({
  onTextInsert = () => {},
  onHighlight = () => {},
  onReset = () => {}
}) => {
  return (
    <ToolbarWrapper>
      <Button onClick={() => onTextInsert("CONFIDENTIAL")}>
        Insert 'CONFIDENTIAL'
      </Button>
      <Button onClick={onHighlight}>Highlight Section</Button>
      <Button onClick={onReset}>Reset PDF</Button>
    </ToolbarWrapper>
  );
};

export default AnnotationToolbar;
