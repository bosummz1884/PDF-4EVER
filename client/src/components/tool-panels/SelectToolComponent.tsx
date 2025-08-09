// src/components/tool-panels/SelectToolComponent.tsx

import React from "react";
import {
  Annotation,
  EditorToolProps,
  ImageElement,
  TextElement,
  ToolSettings,
  WhiteoutBlock,
} from "@/types/pdf-types";
import { usePDFEditor } from "@/features/pdf-editor/PDFEditorContext";
import { ShapeToolComponent } from "./ShapeToolComponent";
import { TextToolComponent } from "./TextToolComponent";
import { ImageToolComponent } from "./ImageToolComponent";
import { HighlightToolComponent } from "./HighlightToolComponent";
import { WhiteoutToolComponent } from "./WhiteoutToolComponent";

// A map to link element types to their corresponding settings component
const componentMap = {
    rectangle: ShapeToolComponent,
    circle: ShapeToolComponent,
    line: ShapeToolComponent,
    highlight: HighlightToolComponent,
    text: TextToolComponent,
    image: ImageToolComponent,
    whiteout: WhiteoutToolComponent,
};

// Define a union type for any possible element that can be selected
type SelectableElement = Annotation | TextElement | ImageElement | WhiteoutBlock;

export const SelectToolComponent: React.FC<EditorToolProps> = () => {
    const { state, dispatch } = usePDFEditor();
    const { selectedElementType, selectedElementId, annotations, textElements, imageElements, whiteoutBlocks } = state;

    if (!selectedElementId || !selectedElementType) {
        return (
            <div className="p-4">
                <h3 className="text-sm font-medium">Selection Tool</h3>
                <p className="text-xs text-muted-foreground mt-2">
                    Click an element on the page to select it and view its properties.
                </p>
            </div>
        );
    }

    // Find the selected element from the correct state array, now fully typed
    let selectedElement: SelectableElement | undefined;

    if (['annotation', 'rectangle', 'circle', 'line', 'highlight'].includes(selectedElementType)) {
        selectedElement = Object.values(annotations).flat().find(el => el.id === selectedElementId);
    } else if (selectedElementType === 'text') {
        selectedElement = Object.values(textElements).flat().find(el => el.id === selectedElementId);
    } else if (selectedElementType === 'image') {
        selectedElement = Object.values(imageElements).flat().find(el => el.id === selectedElementId);
    } else if (selectedElementType === 'whiteout') {
        selectedElement = Object.values(whiteoutBlocks).flat().find(el => el.id === selectedElementId);
    }

    if (!selectedElement) {
         return (
            <div className="p-4">
                <p className="text-xs text-muted-foreground mt-2">
                    Element not found. Please try selecting again.
                </p>
            </div>
        );
    }

    // The element's internal 'type' property is more specific for rendering the correct component
    const elementType = 'type' in selectedElement ? selectedElement.type : selectedElementType;
    const ElementSettingsComponent = componentMap[elementType as keyof typeof componentMap];
    
    if (!ElementSettingsComponent) {
        return (
            <div className="p-4">
                <h3 className="text-sm font-medium capitalize">{selectedElementType} Selected</h3>
                <p className="text-xs text-muted-foreground mt-2">
                    This element has no configurable properties.
                </p>
            </div>
        );
    }
    
    // Create a dynamic, type-safe handler that dispatches the correct update action
    const handleSettingChange = <K extends keyof ToolSettings>(key: K, value: ToolSettings[K]) => {
        if (!selectedElement) return;

        const { id, page } = selectedElement;

        // Use a type guard to determine the correct action
        if (['rectangle', 'circle', 'line', 'highlight'].includes(elementType)) {
            dispatch({ type: 'UPDATE_ANNOTATION', payload: { page, id, updates: { [key]: value } } });
        } else if (elementType === 'text') {
            dispatch({ type: 'UPDATE_TEXT_ELEMENT', payload: { page, id, updates: { [key]: value } } });
        } else if (elementType === 'image') {
            dispatch({ type: 'UPDATE_IMAGE_ELEMENT', payload: { page, id, updates: { [key]: value } } });
        } else if (elementType === 'whiteout') {
            dispatch({ type: 'UPDATE_WHITEOUT_BLOCK', payload: { page, id, updates: { [key]: value } } });
        }
    };

    return (
        <div className="p-4">
            <h3 className="text-sm font-medium capitalize mb-4 border-b pb-2">{elementType} Properties</h3>
            <ElementSettingsComponent
                settings={selectedElement}
                onSettingChange={handleSettingChange}
                editorState={state}
            />
        </div>
    );
};