# PDF4EVER - Advanced PDF Editor

A comprehensive React-based PDF editing web application that provides advanced, interactive document manipulation with robust privacy-first authentication and reliable PDF rendering.

## Features

- **PDF Upload & Display**: Load and view PDF documents with zoom, rotation, and navigation controls
- **Text Editing**: Add custom text with font selection, sizing, bold/italic formatting, and color customization
- **Annotations**: Highlight text, draw annotations, and add interactive elements
- **Page Management**: Delete pages, insert blank pages, and reorganize document structure
- **Live Processing**: Real-time PDF editing with immediate visual feedback
- **Professional Toolbar**: Comprehensive editing interface with File, Edit, Annotate, Sign, Tools, and Pages functions
- **Responsive Design**: Adaptive interface that works across all device sizes
- **Dark/Light Mode**: Toggle between themes with proper system integration
- **Export Functionality**: Save edited PDFs with all modifications preserved

## Technology Stack

- **Frontend**: React.js with Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **PDF Processing**: PDF.js for rendering, pdf-lib for editing
- **Language**: TypeScript for type-safe development
- **Icons**: Lucide React for intuitive interface elements
- **State Management**: React hooks with custom PDF processor
- **Build Tool**: Vite for fast development and optimized builds

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── PDFEditor.tsx          # Main PDF editor interface
│   │   │   ├── LivePdfViewer.tsx      # Real-time PDF viewer
│   │   │   ├── PDFTextEditor.tsx      # Text editing functionality
│   │   │   └── ui/                    # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   │   └── useLivePdfProcessor.js # PDF processing hook
│   │   ├── lib/            # Utility libraries
│   │   │   ├── livePdfProcessor.js    # Core PDF processing logic
│   │   │   ├── pdfUtils.ts           # PDF utility functions
│   │   │   └── FontMatchingService.js # Font handling
│   │   └── pages/          # Application pages
├── server/                 # Backend Express server
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   └── storage.ts         # Data storage interface
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schemas
└── attached_assets/       # Project assets and components
```

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pdf4ever-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open your browser to `http://localhost:5000`
   - The application will be running with hot module replacement

## Usage

1. **Upload PDF**: Click the upload area or use the File menu to select a PDF document
2. **Edit Text**: Use the Text tool to add custom text with formatting options
3. **Annotate**: Use the Highlight and Annotate tools to mark up documents
4. **Manage Pages**: Add, delete, or rearrange pages using the Pages menu
5. **Save Changes**: Export your edited PDF using the Save PDF button

## Key Components

### PDFEditor.tsx
Main component that orchestrates the entire PDF editing experience with professional toolbar integration.

### LivePdfViewer.tsx
Real-time PDF viewer with interactive canvas for immediate visual feedback during editing.

### useLivePdfProcessor.js
Custom hook managing PDF state, processing operations, and real-time updates.

### livePdfProcessor.js
Core class handling PDF document manipulation using pdf-lib and PDF.js libraries.

## Development Guidelines

- Follow modern React patterns with functional components and hooks
- Use TypeScript for type safety and better development experience
- Implement responsive design with Tailwind CSS breakpoints
- Maintain clean separation between UI components and business logic
- Test thoroughly across different browsers and device sizes

## UI/UX Notes

- Improved toolbar tool visibility and contrast. Inactive tool buttons now have a subtle white background and light shadow to stand clear over the PDF canvas, while active tools remain high-contrast. Tool dropdown panels use a solid background, border, and elevated shadow with increased z-index for readability. See `client/src/components/tool-panels/ToolDropdown.tsx`.

## Build & Deploy

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## Browser Compatibility

- Modern browsers with ES2020 support
- Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- Mobile browsers on iOS 14+ and Android 10+

## License

Professional PDF editing application built with modern web technologies.