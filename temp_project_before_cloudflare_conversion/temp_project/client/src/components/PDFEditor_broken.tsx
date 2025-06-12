import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Upload,
  Download,
  Save,
  Type,
  Palette,
  FileText,
  Edit,
  Highlighter,
  PenTool,
  Settings,
  Camera,
  ScanText,
  Search,
  Archive,
  User,
  LogIn,
  Home,
  Star,
  DollarSign,
  Info,
  Undo,
  Redo,
  Eye,
  ZoomIn,
  ZoomOut,
  Scissors,
} from "lucide-react";
import PDFTextEditor from "./PDFTextEditor";
import TextEditorDialog from "./TextEditorDialog";
import AnnotationToolbar from "./AnnotationToolbar";
import PDFMergeTool from "./PDFMergeTool";
import PDFSplitTool from "./PDFSplitTool";
import AdvancedAnnotationTool from "./AdvancedAnnotationTool";
import OcrExtractor from "./OcrExtractor";
import TextDetector from "./TextDetector";
import FontScanner from "./FontScanner";
import LivePdfViewer from "./LivePdfViewer";
import { useLivePdfProcessor } from "@/hooks/useLivePdfProcessor";
import {
  mergePDFs,
  extractPagesFromPdf,
  fillPdfForm,
  EditHistory,
} from "@/lib/pdfUtils";
import { matchFont, getAvailableFonts } from "@/lib/FontMatchingService";
import {
  fillPdfFormWithCheckboxes,
  detectFormFields,
} from "@/lib/pdfFormFiller";
import { generateInvoicePdf } from "@/lib/pdfInvoiceGenerator";
import { deletePage, insertBlankPage, reorderPages } from "@/lib/pageTools";

export default function PDFEditor() {
  const [fontSize, setFontSize] = useState("12");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textColor, setTextColor] = useState("#000000");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const pdfEditorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editHistoryRef = useRef(new EditHistory<Uint8Array>());
  const [showMergeTool, setShowMergeTool] = useState(false);
  const [showSplitTool, setShowSplitTool] = useState(false);
  const [showAdvancedAnnotation, setShowAdvancedAnnotation] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [availableFonts] = useState(getAvailableFonts());
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showOcrExtractor, setShowOcrExtractor] = useState(false);
  const [showTextDetector, setShowTextDetector] = useState(false);
  const [showFontScanner, setShowFontScanner] = useState(false);

  // Live PDF processor hook
  const {
    isProcessing,
    pdfStatus,
    error: processingError,
    lastUpdate,
    loadPdf: loadLivePdf,
    addText: addLiveText,
    addAnnotation: addLiveAnnotation,
    deletePage: deleteLivePage,
    insertBlankPage: insertLiveBlankPage,
    exportPdf: exportLivePdf,
    resetPdf: resetLivePdf,
    getCurrentPdfBytes,
    clearError,
  } = useLivePdfProcessor();

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      console.log("PDF file loaded successfully:", file.name);

      // Load into live processor
      try {
        const result = await loadLivePdf(file);
        if (!result.success) {
          console.error("Failed to load PDF:", result.error);
        }
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    } else {
      alert("Please select a valid PDF file");
    }
    // Reset input value to allow re-uploading the same file
    event.target.value = "";
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    if (!selectedFile) {
      alert("Please upload a PDF file first");
      return;
    }

    if (pdfEditorRef.current?.exportPDF) {
      try {
        await pdfEditorRef.current.exportPDF();
        console.log("PDF exported successfully");
      } catch (error) {
        console.error("Export error:", error);
        alert("Failed to export PDF. Please try again.");
      }
    } else {
      alert("PDF editor not ready for saving");
    }
  };

  const handleMergePDFs = () => {
    setShowMergeTool(true);
  };

  const handleSplitPDF = () => {
    setShowSplitTool(true);
  };

  const handleAdvancedAnnotation = () => {
    setShowAdvancedAnnotation(true);
  };

  const handleAnnotationApply = (annotation: any) => {
    if (pdfEditorRef.current?.applyAnnotation) {
      pdfEditorRef.current.applyAnnotation(annotation);
    }
    setShowAdvancedAnnotation(false);
  };

  const handleOcrText = (text: string) => {
    if (pdfEditorRef.current?.insertText) {
      pdfEditorRef.current.insertText(text);
    }
  };

  const handleTextExtracted = (textPages: any[]) => {
    console.log("Extracted text from PDF:", textPages);
    alert(
      `Extracted text from ${textPages.length} pages. Check console for details.`,
    );
  };

  const handleFontDetected = (font: string) => {
    setFontFamily(font);
    alert(`Font detected: ${font}. Applied to font selector.`);
  };

  const handleGenerateInvoice = async () => {
    const clientName = prompt("Enter client name:");
    if (!clientName) return;

    const itemsInput = prompt(
      'Enter items (format: "Item1:10.50,Item2:25.00"):',
    );
    if (!itemsInput) return;

    try {
      const items = itemsInput.split(",").map((item) => {
        const [name, amount] = item.split(":");
        return { name: name.trim(), amount: parseFloat(amount) };
      });

      const invoicePdf = await generateInvoicePdf({ clientName, items });
      const blob = new Blob([invoicePdf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${clientName.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Error generating invoice: " + (error as Error).message);
    }
  };

  const handleUndo = () => {
    if (pdfEditorRef.current?.undo) {
      pdfEditorRef.current.undo();
    }
  };

  const handleRedo = () => {
    if (pdfEditorRef.current?.redo) {
      pdfEditorRef.current.redo();
    }
  };

  const handleTextInsert = () => {
    console.log("Text insert clicked");
    setShowTextEditor(true);
  };

  const handleTextAdd = async (textData: any) => {
    console.log("Adding text with data:", textData);
    try {
      const result = await addLiveText(textData);
      if (result.success) {
        console.log("Text added successfully");
        setShowTextEditor(false);
      } else {
        console.error("Failed to add text:", result.error);
      }
    } catch (error) {
      console.error("Error adding text:", error);
    }
  };

  const handleComingSoon = () => {
    alert("This feature is coming soon!");
  };

  const handleOcrExtraction = () => {
    setShowOcrExtractor(true);
  };

  const handleTextDetection = () => {
    setShowTextDetector(true);
  };

  const handleFontScanning = () => {
    setShowFontScanner(true);
  };

  const handlePageDeletion = async () => {
    if (selectedFile) {
      const result = await deleteLivePage(0);
      if (result.success) {
        console.log("Page deleted successfully");
      }
    }
  };

  const handlePageInsertion = async () => {
    if (selectedFile) {
      const result = await insertLiveBlankPage(0);
      if (result.success) {
        console.log("Blank page inserted successfully");
      }
    }
  };

  const handleHighlight = () => {
    if (pdfEditorRef.current?.enableHighlight) {
      pdfEditorRef.current.enableHighlight();
    } else {
      alert("Highlight functionality will be available with PDF loaded");
    }
  };

  const handleResetPDF = () => {
    if (selectedFile && pdfEditorRef.current?.resetToOriginal) {
      pdfEditorRef.current.resetToOriginal();
      editHistoryRef.current.clear();
    } else {
      alert("No PDF loaded to reset");
    }
  };

  const handleDeletePage = async () => {
    if (!pdfStatus?.hasDocument) {
      alert("Please upload a PDF first");
      return;
    }

    const confirmed = confirm(
      "Are you sure you want to delete the current page?",
    );
    if (confirmed) {
      try {
        await deleteLivePage(0); // Delete first page as example
        alert("Page deleted successfully");
      } catch (error) {
        alert("Failed to delete page");
      }
    }
  };

  const handleInsertBlankPage = async () => {
    if (!pdfStatus?.hasDocument) {
      alert("Please upload a PDF first");
      return;
    }

    try {
      await insertLiveBlankPage(0); // Insert after first page
      alert("Blank page inserted successfully");
    } catch (error) {
      alert("Failed to insert blank page");
    }
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === "z" && !event.shiftKey) {
          event.preventDefault();
          handleUndo();
        } else if (event.key === "y" || (event.key === "z" && event.shiftKey)) {
          event.preventDefault();
          handleRedo();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground dark">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <img
                  src="/logo.png"
                  alt="PDF4EVER Logo"
                  className="w-10 h-10 rounded-lg shadow-sm"
                />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  PDF4EVER
                </h1>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleComingSoon}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Home
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Return to the main dashboard</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleComingSoon}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Features
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Explore all PDF editing capabilities</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleComingSoon}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Pricing
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View subscription plans and pricing</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleComingSoon}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      About
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Learn more about PDF4EVER</p>
                  </TooltipContent>
                </Tooltip>
              </nav>

              {/* Auth Buttons */}
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <ThemeToggle />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Switch between light and dark themes</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={handleComingSoon}
                      className="hidden md:flex items-center space-x-2"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>Login</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sign in to your account</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleComingSoon}
                      className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-primary via-secondary to-accent text-white hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
                    >
                      <User className="h-4 w-4" />
                      <span>Signup</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create a new account to save your work</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </header>

        {/* PDF Canvas Area */}
        <div className="flex-1 bg-muted/20">
          <div className="w-full max-w-full mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            {/* Only show content when PDF is selected - no main toolbar */}
            {selectedFile && (
              <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
                {/* Single Professional PDF Editing Toolbar - Only shows when PDF is loaded */}
                <div className="bg-card border border-border rounded-lg shadow-sm p-2 sm:p-3 mb-4 sm:mb-6 overflow-x-auto">
                  <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-4 lg:gap-6 min-w-fit px-1 sm:px-2">
                    {/* File Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3 lg:px-4 text-xs sm:text-sm whitespace-nowrap">
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">File</span>
                          <span className="sm:hidden">F</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleUploadClick}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSave}>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleMergePDFs}>
                          <Archive className="h-4 w-4 mr-2" />
                          Merge
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSplitPDF}>
                          <Archive className="h-4 w-4 mr-2" />
                          Split
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Edit Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3 lg:px-4 text-xs sm:text-sm whitespace-nowrap">
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Edit</span>
                          <span className="sm:hidden">E</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleTextInsert}>
                          <Type className="h-4 w-4 mr-2" />
                          Add Text
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleComingSoon}>
                          <Edit className="h-4 w-4 mr-2" />
                          Move
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleComingSoon}>
                          <Edit className="h-4 w-4 mr-2" />
                          Resize
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleComingSoon}>
                          <Edit className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Annotate Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3 lg:px-4 text-xs sm:text-sm whitespace-nowrap">
                          <PenTool className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Annotate</span>
                          <span className="sm:hidden">A</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleAdvancedAnnotation}>
                          <Highlighter className="h-4 w-4 mr-2" />
                          Highlight
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleComingSoon}>
                          <PenTool className="h-4 w-4 mr-2" />
                          Draw
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleComingSoon}>
                          <Type className="h-4 w-4 mr-2" />
                          Comment
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleComingSoon}>
                          <Camera className="h-4 w-4 mr-2" />
                          Stamp
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Sign Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3 lg:px-4 text-xs sm:text-sm whitespace-nowrap">
                          <PenTool className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Sign</span>
                          <span className="sm:hidden">S</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleComingSoon}>
                          <PenTool className="h-4 w-4 mr-2" />
                          Digital Signature
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleComingSoon}>
                          <Type className="h-4 w-4 mr-2" />
                          Type Signature
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleComingSoon}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Signature
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Tools Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3 lg:px-4 text-xs sm:text-sm whitespace-nowrap">
                          <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Tools</span>
                          <span className="sm:hidden">T</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleOcrExtraction}>
                          <ScanText className="h-4 w-4 mr-2" />
                          OCR Extract
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleTextDetection}>
                          <Search className="h-4 w-4 mr-2" />
                          Text Detection
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleFontScanning}>
                          <Type className="h-4 w-4 mr-2" />
                          Font Scanner
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleComingSoon}>
                          <DollarSign className="h-4 w-4 mr-2" />
                          Invoice Generator
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Pages Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3 lg:px-4 text-xs sm:text-sm whitespace-nowrap">
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Pages</span>
                          <span className="sm:hidden">P</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handlePageDeletion}>
                          <Edit className="h-4 w-4 mr-2" />
                          Delete Page
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handlePageInsertion}>
                          <FileText className="h-4 w-4 mr-2" />
                          Insert Blank Page
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleComingSoon}>
                          <Archive className="h-4 w-4 mr-2" />
                          Reorder Pages
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleComingSoon}>
                          <Eye className="h-4 w-4 mr-2" />
                          Page Thumbnails
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                  <div className="flex items-center justify-between flex-wrap gap-3 lg:gap-4">
                    <div className="flex items-center space-x-3 lg:space-x-4 flex-wrap">
                      {/* File Operations */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 sm:px-3 lg:px-4 text-xs sm:text-sm whitespace-nowrap"
                      >
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">File</span>
                        <span className="sm:hidden">F</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 sm:px-3 lg:px-4 text-xs sm:text-sm whitespace-nowrap"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Edit</span>
                        <span className="sm:hidden">E</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 sm:px-3 lg:px-4 text-xs sm:text-sm whitespace-nowrap"
                      >
                        <PenTool className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Annotate</span>
                        <span className="sm:hidden">A</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 sm:px-3 lg:px-4 text-xs sm:text-sm whitespace-nowrap"
                      >
                        <PenTool className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Sign</span>
                        <span className="sm:hidden">S</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 sm:px-3 lg:px-4 text-xs sm:text-sm whitespace-nowrap"
                      >
                        <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Tools</span>
                        <span className="sm:hidden">T</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 sm:px-3 lg:px-4 text-xs sm:text-sm whitespace-nowrap"
                      >
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Pages</span>
                        <span className="sm:hidden">P</span>
                      </Button>
                      {/* Font Selector */}
                      <div className="flex items-center space-x-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Type className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Choose font family for text elements</p>
                          </TooltipContent>
                        </Tooltip>
                        <Select
                          value={fontFamily}
                          onValueChange={setFontFamily}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Times-Roman">Times</SelectItem>
                            <SelectItem value="Courier">Courier</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Font Size */}
                      <Select value={fontSize} onValueChange={setFontSize}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="8">8</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="12">12</SelectItem>
                          <SelectItem value="14">14</SelectItem>
                          <SelectItem value="16">16</SelectItem>
                          <SelectItem value="18">18</SelectItem>
                          <SelectItem value="24">24</SelectItem>
                          <SelectItem value="32">32</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Bold/Italic Controls */}
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => setBold(!bold)}
                          variant={bold ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8 p-0 font-bold"
                        >
                          B
                        </Button>
                        <Button
                          onClick={() => setItalic(!italic)}
                          variant={italic ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8 p-0 italic"
                        >
                          I
                        </Button>
                      </div>

                      {/* Text Color Picker */}
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-muted-foreground" />
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-8 h-8 rounded border border-border bg-transparent cursor-pointer"
                          title="Select text color"
                        />
                      </div>

                      {/* Undo/Redo Buttons */}
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleUndo}
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Undo className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Undo last action (Ctrl+Z)</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleRedo}
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Redo className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Redo last action (Ctrl+Y)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Save Button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleSave}
                          className="bg-gradient-to-r from-primary via-secondary to-accent text-white hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save PDF
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Save your current PDF changes</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Top Navigation Bar with Dropdowns */}
                <div className="bg-card border border-border rounded-lg shadow-sm p-3 mb-4">
                  <div className="flex items-center space-x-1 flex-wrap gap-2">
                    {/* File Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8">
                          <FileText className="h-4 w-4 mr-2" />
                          File
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleUploadClick}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSave}>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleMergePDFs}>
                          <Archive className="h-4 w-4 mr-2" />
                          Merge
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSplitPDF}>
                          <Archive className="h-4 w-4 mr-2" />
                          Split
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Annotate Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8">
                          <PenTool className="h-4 w-4 mr-2" />
                          Annotate
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleAdvancedAnnotation}>
                          <PenTool className="h-4 w-4 mr-2" />
                          Draw
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleTextInsert}>
                          <Type className="h-4 w-4 mr-2" />
                          Add Text
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleHighlight}>
                          <Highlighter className="h-4 w-4 mr-2" />
                          Highlight
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Tools Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8">
                          <Settings className="h-4 w-4 mr-2" />
                          Tools
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleComingSoon}>
                          <Settings className="h-4 w-4 mr-2" />
                          OCR
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleComingSoon}>
                          <FileText className="h-4 w-4 mr-2" />
                          Forms
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleGenerateInvoice}>
                          <DollarSign className="h-4 w-4 mr-2" />
                          Generate Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDeletePage}>
                          <Edit className="h-4 w-4 mr-2" />
                          Delete Page
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleInsertBlankPage}>
                          <Edit className="h-4 w-4 mr-2" />
                          Insert Blank Page
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleResetPDF}>
                          <Settings className="h-4 w-4 mr-2" />
                          Reset
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            )}

            {selectedFile ? (
              <PDFTextEditor
                ref={pdfEditorRef}
                file={selectedFile}
                fontOptions={{
                  size: parseInt(fontSize),
                  color: textColor,
                  family: fontFamily,
                  bold,
                  italic,
                }}
              />
            ) : (
              <div className="bg-white dark:bg-card border border-border rounded-lg shadow-sm min-h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-primary via-secondary to-accent rounded-full flex items-center justify-center">
                    <Upload className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    PDF Canvas Area
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Upload a PDF to start editing
                  </p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleUploadClick}
                        variant="outline"
                        className="border-2 border-dashed border-primary hover:bg-primary/5"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Select PDF File
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Click to browse and select a PDF file from your computer
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />

        {/* Modal Overlays */}
        {showMergeTool && (
          <PDFMergeTool onClose={() => setShowMergeTool(false)} />
        )}

        {showSplitTool && (
          <PDFSplitTool
            onClose={() => setShowSplitTool(false)}
            initialFile={selectedFile || undefined}
          />
        )}

        {showAdvancedAnnotation && (
          <AdvancedAnnotationTool
            onClose={() => setShowAdvancedAnnotation(false)}
            onAnnotationApply={handleAnnotationApply}
          />
        )}

        <TextEditorDialog
          isVisible={showTextEditor}
          onClose={() => setShowTextEditor(false)}
          onTextAdd={handleTextAdd}
          selectedFont={fontFamily}
          selectedFontSize={fontSize.toString()}
          selectedColor={textColor}
        />

        {showOcrExtractor && (
          <OcrExtractor
            onClose={() => setShowOcrExtractor(false)}
            onTextExtracted={handleOcrText}
          />
        )}

        {showTextDetector && (
          <TextDetector
            onClose={() => setShowTextDetector(false)}
            onTextExtracted={handleTextExtracted}
          />
        )}

        {showFontScanner && (
          <FontScanner
            onClose={() => setShowFontScanner(false)}
            onFontDetected={handleFontDetected}
          />
        )}

        {/* Why PDF4EVER Section */}
        <section className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Why PDF4EVER?
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Experience true ownership with professional-grade PDF editing
                tools
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">
                      True Ownership
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Pay once, own forever. No monthly subscriptions, no hidden
                      fees, no unexpected charges appearing on your credit card
                      statement. When you purchase PDF4EVER, it's yours
                      permanently.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">
                      Industry Standards
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Professional-grade features that meet the highest industry
                      standards. We've built PDF4EVER to compete with and exceed
                      the capabilities of premium PDF editing solutions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">
                      Lifetime Updates
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Your one-time purchase includes all future updates,
                      improvements, and new features at no additional cost. As
                      we enhance PDF4EVER, you benefit automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">
                      No Subscription Traps
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      We believe in honest pricing. No "free trials" that
                      automatically charge you, no forgotten subscriptions
                      draining your account, no surprise fees or upgrade
                      requirements.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Honest Comparison Section */}
            <div className="bg-white/70 dark:bg-black/20 rounded-xl p-8 border border-primary/20 shadow-lg">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                  📋 Honest Comparison: Lifetime PDF Editors with Free Future
                  Updates
                </h3>
                <p className="text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                  These comparisons focus only on PDF editors that offer a true
                  one-time purchase with free lifetime updates — no
                  subscriptions, no upgrade fees, and no hidden catches. Our
                  goal is to help you make an informed decision, even if that
                  means choosing a different platform.
                </p>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-full">
                  {/* Sejda */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-lg p-6 border border-blue-200/50 dark:border-blue-700/50">
                    <div className="text-center mb-4">
                      <h4 className="text-xl font-bold text-foreground mb-2">
                        Sejda
                      </h4>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        $69.95
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Lifetime Price
                      </p>
                    </div>

                    <div className="mb-4">
                      <h5 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                        Top 3 Strengths
                      </h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Clean UI</li>
                        <li>• Cloud sync (Dropbox, Google Drive)</li>
                        <li>• Easy inline editing</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">
                        Top 3 Weaknesses
                      </h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• OCR limited to 10 pages</li>
                        <li>• Limited font matching</li>
                        <li>• No real-time sharing</li>
                      </ul>
                    </div>
                  </div>

                  {/* EaseUS */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-lg p-6 border border-green-200/50 dark:border-green-700/50">
                    <div className="text-center mb-4">
                      <h4 className="text-xl font-bold text-foreground mb-2">
                        EaseUS
                      </h4>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        $79.95
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Lifetime Price
                      </p>
                    </div>

                    <div className="mb-4">
                      <h5 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                        Top 3 Strengths
                      </h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Strong text editing tools</li>
                        <li>• Form creation</li>
                        <li>• Good font preservation</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">
                        Top 3 Weaknesses
                      </h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• No cloud integration</li>
                        <li>• Windows only</li>
                        <li>• Basic OCR batch support</li>
                      </ul>
                    </div>
                  </div>

                  {/* PDF Candy */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-lg p-6 border border-purple-200/50 dark:border-purple-700/50">
                    <div className="text-center mb-4">
                      <h4 className="text-xl font-bold text-foreground mb-2">
                        PDF Candy
                      </h4>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        $99.00
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Lifetime Price
                      </p>
                    </div>

                    <div className="mb-4">
                      <h5 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                        Top 3 Strengths
                      </h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Very user-friendly</li>
                        <li>• Web and desktop apps</li>
                        <li>• Google Drive access</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">
                        Top 3 Weaknesses
                      </h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Slow OCR engine</li>
                        <li>• Minimal font tools</li>
                        <li>• No signature workflows</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informational Note */}
              <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-lg p-6 border border-primary/10 mb-6">
                <p className="text-muted-foreground text-center leading-relaxed">
                  We're honored to be considered as a potential solution. If you
                  end up choosing another PDF editor, we'd love to hear why —
                  email your feedback to{" "}
                  <span className="font-semibold text-primary">
                    feedback@pdf4ever.org
                  </span>{" "}
                  so we can improve and evolve the product.
                </p>
              </div>

              {/* CTA Footer */}
              <div className="text-center">
                <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-lg p-6 border border-primary/20">
                  <p className="text-xl font-semibold text-foreground mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    PDF4EVER is just the beginning.
                  </p>
                  <p className="text-muted-foreground">
                    Stay tuned for more tools in the growing 4EVER product
                    family — built with the same mission: no subscriptions, no
                    strings, just powerful tools that last forever.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-card border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  PDF4EVER
                </h3>
                <span className="text-muted-foreground text-sm">
                  © 2024 All rights reserved
                </span>
              </div>
              <div className="flex items-center space-x-6">
                <button
                  onClick={handleComingSoon}
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  Contact
                </button>
                <button
                  onClick={handleComingSoon}
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  Terms
                </button>
                <button
                  onClick={handleComingSoon}
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  Privacy
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
