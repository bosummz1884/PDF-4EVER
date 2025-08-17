# PDF Editor Development Tasks

## Sprint 1: Foundation & Core Tools (Weeks 1-2)

### 🔧 Infrastructure Tasks
- [ ] **T1.1** Set up project structure and build configuration
  - [ ] Verify Vite configuration for optimal PDF.js integration
  - [ ] Configure TypeScript strict mode and path aliases
  - [ ] Set up ESLint, Prettier, and Husky pre-commit hooks
  - [ ] Create environment configuration files

- [ ] **T1.2** Implement missing UI components
  - [ ] Create Toast notification system (hook implementation)
  - [ ] Implement Button, Card, Separator components from shadcn/ui
  - [ ] Set up proper Tailwind CSS configuration
  - [ ] Create responsive layout system

### 🎯 Core Tool Implementation

- [ ] **T1.3** Complete Select Tool Implementation
  - [ ] Implement `SelectToolComponent` with element selection logic
  - [ ] Add bounding box display for selected elements
  - [ ] Implement drag-and-drop functionality using React RND
  - [ ] Add resize handles for selected elements
  - [ ] Test multi-element selection

- [ ] **T1.4** Implement Text Tool
  - [ ] Complete `TextToolComponent` with font controls
  - [ ] Add text input overlay for direct editing
  - [ ] Implement text formatting options (bold, italic, underline)
  - [ ] Add text alignment controls
  - [ ] Test text element creation and editing

- [ ] **T1.5** Shape Tools Implementation
  - [ ] Complete `ShapeToolComponent` for rectangles and circles
  - [ ] Add stroke and fill color pickers
  - [ ] Implement stroke width and style controls
  - [ ] Add corner radius control for rectangles
  - [ ] Test shape drawing and modification

### 🎨 Canvas & Rendering

- [ ] **T1.6** Enhance Canvas Interaction System
  - [ ] Fix mouse coordinate calculation for all zoom levels
  - [ ] Implement proper event handling for nested elements
  - [ ] Add keyboard shortcuts (Ctrl+Z, Ctrl+Y, Delete)
  - [ ] Implement selection indicators and handles

- [ ] **T1.7** Layer System Completion
  - [ ] Fix `AdvancedTextLayer` component implementation
  - [ ] Complete `ImageLayer` with proper image handling
  - [ ] Test layer stacking and interaction priorities
  - [ ] Implement layer visibility controls

## Sprint 2: Advanced Features (Weeks 3-4)

### ✏️ Inline Text Editing

- [ ] **T2.1** Complete Inline Text Editor
  - [x] **T2.6.2** Create WhiteoutTool.tsx implementation in features/components/tools
  - [x] Implement precise whiteout block creation
  - [x] Add drawing preview with visual feedback
  - [x] Create proper canvas coordinate handling
  - [x] Integrate with existing WhiteoutLayer component

- [ ] **T2.2** Font Recognition Service
  - [ ] Complete `fontRecognitionService` implementation
  - [ ] Build font matching algorithm
  - [ ] Create font fallback system
  - [ ] Add font confidence scoring
  - [ ] Test with different PDF types

- [ ] **T2.3** Text Extraction Enhancement
  - [ ] Improve `textExtractionService` accuracy
  - [ ] Handle rotated and skewed text
  - [ ] Add text region merging logic
  - [ ] Implement text boundary detection
  - [ ] Test with complex layouts

### 🖼️ Media & Annotation Tools

- [ ] **T2.4** Complete Image Tool
  - [ ] Implement `ImageToolComponent` controls
  - [ ] Add image upload and placement
  - [ ] Implement image resize and rotation
  - [ ] Add opacity and border controls
  - [ ] Test with various image formats

- [ ] **T2.5** Freeform Drawing Tool
  - [ ] Complete `FreeformToolComponent` implementation
  - [ ] Add brush size and color controls
  - [ ] Implement path smoothing algorithms
  - [ ] Add eraser functionality
  - [ ] Test drawing performance

- [ ] **T2.6** Highlight & Whiteout Tools
  - [ ] Complete `HighlightToolComponent` with blend modes
  - [ ] Implement `WhiteoutToolComponent` with precise coverage
  - [ ] Add opacity controls
  - [ ] Test coverage accuracy

## Sprint 3: Advanced Features & Polish (Weeks 5-6)

### 📝 Form & OCR Implementation

- [ ] **T3.1** Form Field System
  - [ ] Design form field component architecture
  - [ ] Implement text input fields
  - [ ] Add checkbox and radio button fields
  - [ ] Create dropdown/select fields
  - [ ] Add form validation system

- [ ] **T3.2** OCR Integration
  - [ ] Research and select OCR library (Tesseract.js)
  - [ ] Implement `OCRToolComponent`
  - [ ] Add text recognition from image regions
  - [ ] Create text confidence indicators
  - [ ] Test OCR accuracy with different languages

- [ ] **T3.3** Digital Signature Support
  - [ ] Design signature capture interface
  - [ ] Implement signature drawing canvas
  - [ ] Add signature storage and placement
  - [ ] Create signature verification system
  - [ ] Test signature integration

### 💾 File Management & Performance

- [ ] **T3.4** Enhanced PDF Saving
  - [ ] Complete `savePdfWithAnnotations` function
  - [ ] Optimize annotation embedding
  - [ ] Add progress indicators for large files
  - [ ] Implement error handling and recovery
  - [ ] Test with various PDF structures

- [ ] **T3.5** Performance Optimization
  - [ ] Implement render task cancellation (already in Context)
  - [ ] Add memory cleanup for large files
  - [ ] Optimize canvas rendering performance
  - [ ] Implement lazy loading for multi-page PDFs
  - [ ] Profile and fix memory leaks

## Sprint 4: Critical UI/UX Improvements (Week 7)

### 🚨 Critical Bug Fixes & Layout Redesign

- [ ] **T4.0** Fix PDF Rendering Issues
  - [ ] **T4.0.1** Fix PDF top portion cut-off during rendering
    - [ ] Debug viewport calculation in `renderPage` function
    - [ ] Fix canvas positioning and offset calculations
    - [ ] Ensure proper PDF.js viewport transformation
    - [ ] Test with various PDF sizes and zoom levels
    - [ ] Verify no content clipping at any scale

- [ ] **T4.1** Major Layout Redesign - Horizontal Toolbar
  - [ ] **T4.1.1** Remove bulky left sidebar tool panel
    - [ ] Extract tool selection logic from current sidebar
    - [ ] Remove existing left panel layout structure
    - [ ] Update main container flex layout for full-width PDF area
  - [ ] **T4.1.2** Implement horizontal tool bar
    - [ ] Create new `ToolBar` component below header
    - [ ] Design horizontal tool button layout (left to right)
    - [ ] Implement responsive tool bar for different screen sizes
    - [ ] Add tool icons in linear arrangement
    - [ ] Test tool bar on mobile and tablet devices
  - [ ] **T4.1.3** Redesign tool button styling
    - [ ] Create compact horizontal tool buttons
    - [ ] Add active/inactive visual states
    - [ ] Implement hover effects and transitions
    - [ ] Add keyboard shortcut indicators
    - [ ] Test accessibility for tool selection

- [ ] **T4.2** Tool-Specific Dropdown System
  - [ ] **T4.2.1** Create dynamic dropdown infrastructure
    - [ ] Build `ToolDropdown` component system
    - [ ] Implement conditional rendering based on selected tool
    - [ ] Create dropdown positioning logic relative to toolbar
    - [ ] Add smooth open/close animations
  - [ ] **T4.2.2** Implement Text Tool dropdown
    - [ ] Font family selector dropdown
    - [ ] Font size controls
    - [ ] Color picker integration
    - [ ] Text formatting buttons (Bold, Italic, Underline)
    - [ ] Text alignment options
    - [ ] Line height controls
  - [ ] **T4.2.3** Implement Shape Tools dropdown
    - [ ] Stroke color picker
    - [ ] Fill color picker with transparency
    - [ ] Stroke width slider/input
    - [ ] Stroke style options (solid, dashed, dotted)
    - [ ] Corner radius controls for rectangles
  - [ ] **T4.2.4** Implement Highlight Tool dropdown
    - [ ] Color preset buttons (Yellow, Pink, Blue, Green)
    - [ ] Custom color picker
    - [ ] Opacity slider control
    - [ ] Blend mode selector (Multiply, Overlay, Screen)
    - [ ] Highlight style options (Solid, Underline, Strikethrough, Squiggly)
  - [ ] **T4.2.5** Implement Freeform Tool dropdown
    - [ ] Brush size selector with visual preview
    - [ ] Color picker for drawing
    - [ ] Smoothing level controls (None, Low, Medium, High)
    - [ ] Pressure sensitivity toggle
  - [ ] **T4.2.6** Implement Image Tool dropdown
    - [ ] File upload button
    - [ ] Opacity slider
    - [ ] Rotation controls (0°, 90°, 180°, 270°, custom)
    - [ ] Resize options with aspect ratio lock
    - [ ] Border controls

- [ ] **T4.3** Enhanced User Experience
  - [ ] **T4.3.1** Add keyboard shortcuts for tool switching
    - [ ] Implement V for Select, T for Text, H for Highlight, etc.
    - [ ] Create visual shortcut indicators in tool buttons
    - [ ] Add keyboard shortcut help panel/tooltip
  - [ ] **T4.3.2** Improve visual feedback
    - [ ] Add tool selection visual indicators
    - [ ] Implement smooth transitions between tools
    - [ ] Create loading states for tool switching
    - [ ] Add hover previews for tool functions

## Sprint 5: Testing & Polish (Week 8)

### 🧪 Testing Implementation

- [ ] **T5.1** Unit Testing
  - [ ] Test PDF processing services
  - [ ] Test state management actions and reducers
  - [ ] Test utility functions and helpers
  - [ ] Add component unit tests
  - [ ] Achieve >80% test coverage

- [ ] **T5.2** Integration Testing
  - [ ] Test complete user workflows
  - [ ] Test file upload/download processes
  - [ ] Test cross-tool interactions
  - [ ] Test undo/redo functionality
  - [ ] Test error scenarios

- [ ] **T5.3** Cross-Browser Testing
  - [ ] Test in Chrome, Firefox, Safari, Edge
  - [ ] Fix browser-specific issues
  - [ ] Test on different screen sizes
  - [ ] Optimize for mobile browsers
  - [ ] Create browser compatibility matrix

### 🎨 UI/UX Polish

- [ ] **T5.4** Interface Improvements
  - [ ] Design loading states and animations
  - [ ] Add tooltips and help text
  - [ ] Implement keyboard navigation
  - [ ] Add accessibility features (ARIA labels)
  - [ ] Create responsive design breakpoints

- [ ] **T5.5** Error Handling & User Feedback
  - [ ] Implement comprehensive error boundaries
  - [ ] Add user-friendly error messages
  - [ ] Create progress indicators for long operations
  - [ ] Add confirmation dialogs for destructive actions
  - [ ] Test error recovery scenarios

## Ongoing Tasks (Throughout Development)

### 🔍 Code Quality
- [ ] **Daily** - Code reviews and refactoring
- [ ] **Weekly** - Performance profiling and optimization
- [ ] **Bi-weekly** - Dependency updates and security audits
- [ ] **Monthly** - Architecture review and improvements

### 📚 Documentation
- [ ] **T5.1** Create component documentation
- [ ] **T5.2** Write API documentation for services
- [ ] **T5.3** Create user guide and tutorials
- [ ] **T5.4** Document deployment procedures
- [ ] **T5.5** Create troubleshooting guide

## Task Dependencies

### Critical Path
```
T1.1 → T1.2 → T1.6 → T1.3 → T2.1 → T3.4 → T4.0 → T4.1 → T4.2 → T5.1
```

### Parallel Development
- T1.4, T1.5 can be developed alongside T1.3
- T2.2, T2.3 can be developed alongside T2.1
- T2.4, T2.5, T2.6 can be developed in parallel
- T4.2, T4.3 can be developed alongside T4.1

## Definition of Done

### For Each Task
- [ ] Code implementation complete and tested
- [ ] TypeScript types properly defined
- [ ] Unit tests written and passing
- [ ] Code reviewed by team member
- [ ] Documentation updated
- [ ] Browser compatibility verified
- [ ] Accessibility considerations addressed
- [ ] Performance impact assessed

### For Each Sprint
- [ ] All sprint tasks completed
- [ ] Integration testing passed
- [ ] User acceptance criteria met
- [ ] Performance benchmarks achieved
- [ ] No critical bugs remaining
- [ ] Code coverage targets met

## Risk Mitigation

### High-Risk Tasks
- **T2.2** Font Recognition - Complex algorithm implementation
- **T3.4** PDF Saving - File format complexity
- **T3.2** OCR Integration - Third-party library dependency

### Mitigation Strategies
- Allocate extra time for high-risk tasks
- Create proof-of-concept implementations early
- Have fallback solutions ready
- Regular progress reviews and adjustments

## Resource Allocation

### Priority 1 (Must Have - Critical Issues)
- T4.0 (PDF Rendering Fixes), T4.1 (Layout Redesign), T4.2 (Dropdown System)
- T1.1-T1.7, T2.4, T3.4, T5.1-T5.3

### Priority 2 (Should Have)
- T2.1-T2.3, T2.5-T2.6, T3.1, T5.4-T5.5

### Priority 3 (Nice to Have)
- T3.2, T3.3, Advanced documentation

## Discovered During Work

### 2025-08-16
- **Fixed Toolbar Overflow Issue** ✅
  - **Problem**: Horizontal toolbar extending beyond screen boundaries on smaller screens
  - **Solution**: Added responsive layout with `overflow-x-auto`, `flex-wrap`, `whitespace-nowrap`, and `min-w-fit` classes
  - **Files Modified**: `PDFEditorContainer.tsx`
  - **Changes**: 
    - Main toolbar now scrolls horizontally when content exceeds container width
    - Tool dropdowns and layer buttons wrap properly within their sections
    - Text labels use `whitespace-nowrap` to prevent breaking
    - Font style panel for inline edit mode also made responsive
  - **Result**: Toolbar now fits within page limits and provides horizontal scrolling when needed

This task breakdown provides a clear roadmap for developing your PDF editor while maintaining flexibility for adjustments based on progress and priorities.

## Discovered During Work - August 16, 2025

- [x] **T4.6** Fix PDF rendering and toolbar issues
  - [x] Resolve PDF content being cut off at the top by adjusting main container layout
  - [x] Fix duplicate signature tool definition in toolRegistry causing rendering conflicts
  - [x] Correct action type inconsistencies in AdvancedTextLayer and ImageLayer components
  - [x] Ensure proper layer positioning and canvas alignment

- [x] **T4.7** Fix undo/redo system to preserve document state
  - [x] Modified LOAD_SUCCESS action to initialize history with only editable content
  - [x] Updated UNDO/REDO actions to preserve document state (pdfDocument, originalPdfData, totalPages, fileName)
  - [x] Ensured undo operations only affect edits, not document loading

- [x] **T4.8** Redesign toolbar layout to horizontal position
  - [x] Move toolbar from vertical sidebar to horizontal layout at top of PDF viewer
  - [x] Redesign tool buttons for horizontal display with icons and labels
  - [x] Integrate tool settings inline with horizontal toolbar
  - [x] Add compact layer visibility toggles to horizontal toolbar
  - [x] Create separate horizontal font formatting panel for text tools

- [x] **T4.9** Implement comprehensive multi-page navigation system
  - [x] Create PageNavigationControls component with first/prev/next/last page buttons
  - [x] Add direct page input with validation and keyboard support
  - [x] Integrate zoom controls (in/out/fit) and rotation controls
  - [x] Create ThumbnailNavigation component with modal overlay
  - [x] Implement thumbnail generation and caching system
  - [x] Add keyboard shortcuts for navigation (Arrow keys, Home/End, ESC)
  - [x] Integrate navigation controls into header toolbar
  - [x] Add thumbnail toggle button with grid view of all pages
  - [x] Implement click-to-navigate functionality in thumbnail view
  - [x] Add visual indicators for current page in thumbnail grid

- [x] **T4.10** Improve tool visibility and contrast in toolbar
  - [x] Enhance active/inactive states for tool buttons to improve contrast
  - [x] Add subtle background and shadow to inactive tool buttons for separation
  - [x] Increase dropdown panel visibility with solid background, border, and shadow
  - [x] Raise dropdown z-index to ensure it layers above canvas and toolbar
  - **Files Modified**: `client/src/components/tool-panels/ToolDropdown.tsx`
  - **Reason**: Improve clarity of selected tools against varying page backgrounds and ensure dropdown readability

- [x] Fix exported PDF image rotation
  - **Problem**: Images with rotation were not rotated in the saved PDF
  - **Solution**: Use `degrees()` from pdf-lib for `rotate` instead of non-existent `RotationTypes`
  - **Files Modified**: `client/src/lib/savePdf.ts`

- [x] Clean up savePDF logic to avoid unintended whiteouts and stale state
  - **Problem**: `savePDF()` injected whiteout blocks from inline edit regions heuristically; freeform drawings could be stale due to missing dep
  - **Solution**: Remove auto-injection based on `extractedTextRegions`; add `freeformElements` to dependency array
  - **Files Modified**: `client/src/features/pdf-editor/PDFEditorContext.tsx`

- [ ] Follow-ups (Accessibility & Theming)
  - [ ] Verify hover/focus states have sufficient contrast and visible focus rings
  - [ ] Audit dark mode styling for tool buttons and dropdown panels
  - [ ] Add ARIA attributes to tool buttons and dropdown triggers where applicable
  - [ ] Test high-contrast/Windows settings for sufficient visibility

## Discovered During Work - August 17, 2025

- [x] Remove unused/duplicate files and legacy PDF worker setup
  - [x] Deleted legacy worker setup in favor of `client/src/lib/pdfWorker.ts`
    - Removed: `client/src/pdfSetup.ts`, `client/src/pdf-worker-loader.ts`
    - Reason: not referenced; replaced by `@/lib/pdfWorker` imports in `PDFEditorContext.tsx` and `OCRService.ts`
  - [x] Deleted duplicate signature service
    - Removed: `client/src/pages/services/signatureService.ts`
    - Reason: canonical version is `client/src/services/signatureService.ts` (used by Signature tools)
  - [x] Deleted unused helpers/UI
    - Removed: `client/src/pages/services/FontSelectorService.tsx`, `client/src/components/ui/toaster.tsx`
    - Reason: no imports; fonts handled by `contexts/FontContext.tsx`, toasts by `components/ui/toast.tsx`
  - [x] Delete stray debug logs
    - Removed: `client/src/features/components/debug.log`, `client/src/features/hooks/debug.log`, `client/src/features/pdf-editor/debug.log`
    - Reason: leftover debug artifacts; safe to delete
  - [x] Remove unused PDF.js worker typing
    - Removed: `client/src/types/pdfjs-worker.d.ts`
    - Reason: legacy `?worker` typing no longer used; worker configured via `@/lib/pdfWorker` with static `/pdf.worker.js`
  - [x] Register fontkit to remove pdf-lib warnings and subset fonts
    - Files Modified: `client/src/lib/loadFonts.ts`
    - Changes: Register `@pdf-lib/fontkit` via `PDFDocument.registerFontkit(fontkit)`; embed fonts with `{ subset: true }`
    - Reason: Eliminates "register a fontkit instance" warnings and reduces output file size
  
- [ ] T2.2 Progress: Integrate font analysis entry-point and state wiring
  - Files Modified: `client/src/features/pdf-editor/PDFEditorContext.tsx`, `client/src/services/fontRecognitionService.ts`
  - Changes:
    - Added `analyzeFonts()` to `PDFEditorContext` to run font analysis on demand and dispatch `SET_DETECTED_FONTS` per page
    - Cleaned `fontRecognitionService` import to type-only and added clarifying comment on `analyzePDFFonts`
  - Reason: Provide clear, explicit trigger for font recognition and ensure ESLint cleanliness before continuing T2.2 subtasks
  - Next: Implement/refine font matching, fallback stack generation, and confidence scoring, then add tests with varied PDFs

- [x] Inline Editor UX: professional-grade behavior
  - Files Modified: `client/src/features/components/InlineTextEditor.tsx`
  - Changes:
    - Removed confirmation toolbar (checkmark/X/Text/Preview) for streamlined editing
    - Focus places caret at the end of the text instead of selecting all
    - Auto-apply detected font stack from `detectedFonts` (uses `fontRecognitionService`)
    - Save on Enter for both single-line and multiline; Shift+Enter inserts a newline
    - Auto-save on blur (clicking away commits changes)
    - Escape cancels the edit and restores original text
    - Removed overflow warning tip; kept neutral minimal overlay
  - Reason: Match pro editors (Acrobat/Sejda) with immediate-edit and unobtrusive UI

- [x] Toolbar placement and wrapping improvements
  - Problem: Toolbar was overlaying the page and showing a horizontal scrollbar.
  - Solution: Move toolbar into normal document flow directly under `PageNavigationControls` and above the canvas; enable `flex-wrap` and remove `overflow-x-auto/whitespace-nowrap` to allow multi-row wrapping within the PDF canvas width.
  - Files Modified: `client/src/features/pdf-editor/PDFEditorContainer.tsx`
  - Result: Toolbar sits under the zoom/fit/thumbnail controls, fits inside the PDF canvas area, and cleanly wraps to two rows when needed without a horizontal scrollbar.