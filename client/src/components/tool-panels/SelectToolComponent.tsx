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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, Move, RotateCw, Copy } from "lucide-react";
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

export const SelectToolComponent: React.FC<EditorToolProps & { compact?: boolean }> = ({ settings, onSettingChange, compact = false }) => {
    const { state, dispatch } = usePDFEditor();
    const { selectedElementType, selectedElementId, selectedElementIds, annotations, textElements, imageElements, whiteoutBlocks, currentPage } = state;

    // Handle element deletion
    const handleDelete = () => {
        if (!selectedElementId || !selectedElementType) return;
        
        const actions = {
            annotation: () => dispatch({ type: 'DELETE_ANNOTATION', payload: { page: currentPage, id: selectedElementId } }),
            text: () => dispatch({ type: 'DELETE_TEXT_ELEMENT', payload: { page: currentPage, id: selectedElementId } }),
            image: () => dispatch({ type: 'DELETE_IMAGE_ELEMENT', payload: { page: currentPage, id: selectedElementId } }),
            whiteout: () => dispatch({ type: 'DELETE_WHITEOUT_BLOCK', payload: { page: currentPage, id: selectedElementId } }),
        };
        
        const actionKey = selectedElementType === 'annotation' ? 'annotation' : selectedElementType;
        if (actions[actionKey as keyof typeof actions]) {
            actions[actionKey as keyof typeof actions]();
            dispatch({ type: 'SET_SELECTED_ELEMENT', payload: { id: null, type: null } });
            dispatch({ type: 'SAVE_TO_HISTORY' });
        }
    };

    // Handle element duplication
    const handleDuplicate = () => {
        if (!selectedElementId || !selectedElementType || !selectedElement) return;
        
        const offset = 20; // Offset for duplicated element
        const newId = `${selectedElementType}-${Date.now()}`;
        
        if (selectedElementType === 'annotation' || ['rectangle', 'circle', 'line', 'highlight'].includes(selectedElementType)) {
            const newAnnotation = { ...selectedElement as Annotation, id: newId, x: selectedElement.x + offset, y: selectedElement.y + offset };
            dispatch({ type: 'ADD_ANNOTATION', payload: { page: currentPage, annotation: newAnnotation } });
        } else if (selectedElementType === 'text') {
            const newTextElement = { ...selectedElement as TextElement, id: newId, x: selectedElement.x + offset, y: selectedElement.y + offset };
            dispatch({ type: 'ADD_TEXT_ELEMENT', payload: { page: currentPage, element: newTextElement } });
        } else if (selectedElementType === 'image') {
            const newImageElement = { ...selectedElement as ImageElement, id: newId, x: selectedElement.x + offset, y: selectedElement.y + offset };
            dispatch({ type: 'ADD_IMAGE_ELEMENT', payload: { page: currentPage, element: newImageElement } });
        } else if (selectedElementType === 'whiteout') {
            const newWhiteoutBlock = { ...selectedElement as WhiteoutBlock, id: newId, x: selectedElement.x + offset, y: selectedElement.y + offset };
            dispatch({ type: 'ADD_WHITEOUT_BLOCK', payload: { page: currentPage, block: newWhiteoutBlock } });
        }
        
        dispatch({ type: 'SAVE_TO_HISTORY' });
    };

    if (compact) {
        return (
            <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                    {selectedElementIds.length > 1 
                        ? `${selectedElementIds.length} elements selected`
                        : selectedElementId 
                            ? `${selectedElementType} selected`
                            : "Click element to select"
                    }
                </span>
                {selectedElementId && (
                    <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" onClick={handleDuplicate} className="h-6 px-2">
                            <Copy className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleDelete} className="h-6 px-2 text-red-600">
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    if (!selectedElementId || !selectedElementType) {
        return (
            <div className="p-4">
                <h3 className="text-sm font-medium mb-3">Selection Tool</h3>
                <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                        Click an element on the page to select it and view its properties.
                    </p>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                        <h4 className="text-xs font-medium">Selection Options</h4>
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2 text-xs">
                                <input 
                                    type="checkbox" 
                                    checked={settings.showBounds || false}
                                    onChange={(e) => onSettingChange('showBounds', e.target.checked)}
                                    className="rounded"
                                />
                                <span>Show element bounds</span>
                            </label>
                            <label className="flex items-center space-x-2 text-xs">
                                <input 
                                    type="checkbox" 
                                    checked={settings.snapToGrid || false}
                                    onChange={(e) => onSettingChange('snapToGrid', e.target.checked)}
                                    className="rounded"
                                />
                                <span>Snap to grid</span>
                            </label>
                        </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                        <p className="font-medium mb-1">Keyboard Shortcuts:</p>
                        <ul className="space-y-1 text-xs">
                            <li>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Delete</kbd> - Remove selected element(s)</li>
                            <li>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+A</kbd> - Select all elements</li>
                            <li>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+C</kbd> - Copy element(s)</li>
                            <li>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+V</kbd> - Paste element(s)</li>
                            <li>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+D</kbd> - Duplicate element(s)</li>
                            <li>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+Click</kbd> - Multi-select</li>
                        </ul>
                    </div>
                </div>
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
                <h3 className="text-sm font-medium mb-2">Element Not Found</h3>
                <p className="text-xs text-muted-foreground">
                    The selected element could not be found. It may have been deleted or moved to another page.
                </p>
                <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => dispatch({ type: 'SET_SELECTED_ELEMENT', payload: { id: null, type: null } })}
                >
                    Clear Selection
                </Button>
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
            <div className="mb-4">
                <h3 className="text-sm font-medium capitalize mb-2">
                    {selectedElementIds.length > 1 ? `${selectedElementIds.length} Elements Selected` : `${elementType} Selected`}
                </h3>
                
                {/* Element actions */}
                <div className="flex gap-1 mb-3">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDuplicate}
                        className="h-8 px-2"
                        title="Duplicate element"
                    >
                        <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDelete}
                        className="h-8 px-2 text-red-600 hover:text-red-700"
                        title="Delete element"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
                
                {/* Element info */}
                <div className="text-xs text-muted-foreground mb-3 space-y-1">
                    {selectedElementIds.length === 1 ? (
                        <>
                            <div>Position: {Math.round(selectedElement.x)}, {Math.round(selectedElement.y)}</div>
                            <div>Size: {Math.round(selectedElement.width || 0)} × {Math.round(selectedElement.height || 0)}</div>
                            {'rotation' in selectedElement && selectedElement.rotation && (
                                <div>Rotation: {selectedElement.rotation}°</div>
                            )}
                        </>
                    ) : (
                        <div>Multiple elements selected - use toolbar actions to manipulate all at once</div>
                    )}
                </div>
                
                <Separator className="mb-4" />
            </div>
            
            {/* Element-specific properties - only show for single selection */}
            {ElementSettingsComponent && selectedElementIds.length === 1 && (
                <ElementSettingsComponent
                    settings={selectedElement}
                    onSettingChange={handleSettingChange}
                    editorState={state}
                />
            )}
            
            {/* Multi-selection message */}
            {selectedElementIds.length > 1 && (
                <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded border">
                    <p className="font-medium mb-1">Multi-Selection Active</p>
                    <p>Use the action buttons above to delete or duplicate all selected elements. Individual properties are not available for multi-selection.</p>
                </div>
            )}
        </div>
    );
};