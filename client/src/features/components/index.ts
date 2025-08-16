// Export tool implementations
export { FreeformTool } from "./tools/FreeformTool";
export { HighlightTool } from "./tools/HighlightTool";
export { WhiteoutTool } from "./tools/WhiteoutTool";

// Export layers (using default exports)
export { FreeformLayer } from "./layers/FreeformLayer";
export { default as AdvancedTextLayer } from "./layers/AdvancedTextLayer";
export { default as ImageLayerComponent } from "./layers/ImageLayer";
export { default as AnnotationLayerComponent } from "./layers/AnnotationLayer";
export { default as WhiteoutLayer } from "./layers/WhiteoutLayer";

// Export performance components
export { LazyPageRenderer } from './LazyPageRenderer';
export { MemoryProfiler } from './MemoryProfiler';
export { OptimizedCanvasRenderer } from './OptimizedCanvasRenderer';
