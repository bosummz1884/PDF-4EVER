import React, { useState, useEffect } from "react";
import usePDFEditor from "client/src/features/pdf-editor/PDFEditorContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Layers, FileText, Settings } from "lucide-react";

export default function PDFSidebar() {
  const { state, setCurrentPage } = usePDFEditor();
  const { currentFile, currentPage, pdfDocument } = state;
  
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("pages");
  const [isLoading, setIsLoading] = useState(false);

  // Generate thumbnails when PDF document changes
  useEffect(() => {
    if (!currentFile || !pdfDocument) {
      setThumbnails([]);
      return;
    }

    const generateThumbnails = async () => {
      setIsLoading(true);
      
      try {
        const thumbs: string[] = [];
        
        for (let i = 1; i <= pdfDocument.numPages; i++) {
          const page = await pdfDocument.getPage(i);
          const viewport = page.getViewport({ scale: 0.2 }); // Small scale for thumbnails
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({
            canvasContext: context,
            viewport
          }).promise;
          
          thumbs.push(canvas.toDataURL());
        }
        
        setThumbnails(thumbs);
      } catch (error) {
        console.error("Error generating thumbnails:", error);
      } finally {
        setIsLoading(false);
      }
    };

    generateThumbnails();
  }, [currentFile, pdfDocument]);

  if (!currentFile) {
    return null;
  }

  return (
    <div className="w-64 border-r bg-white dark:bg-gray-900 flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="pages">
            <FileText className="h-4 w-4 mr-1" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="layers">
            <Layers className="h-4 w-4 mr-1" />
            Layers
          </TabsTrigger>
          <TabsTrigger value="properties">
            <Settings className="h-4 w-4 mr-1" />
            Props
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pages" className="flex-1 flex flex-col p-0">
          <div className="p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">
              Page {currentPage} of {currentFile.pageCount}
            </span>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setCurrentPage(Math.min(currentFile.pageCount, currentPage + 1))}
                disabled={currentPage >= currentFile.pageCount}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {thumbnails.map((thumbnail, index) => (
                  <div 
                    key={index}
                    className={`border rounded p-1 cursor-pointer transition-all ${
                      currentPage === index + 1 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    <div className="relative">
                      <img 
                        src={thumbnail} 
                        alt={`Page ${index + 1}`} 
                        className="w-full"
                      />
                      <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1 rounded-tl">
                        {index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="layers" className="flex-1">
          <div className="p-4">
            <h3 className="font-medium mb-2">Document Layers</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <input type="checkbox" id="layer-text" className="mr-2" defaultChecked />
                <label htmlFor="layer-text">Text Elements</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="layer-annotations" className="mr-2" defaultChecked />
                <label htmlFor="layer-annotations">Annotations</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="layer-whiteout" className="mr-2" defaultChecked />
                <label htmlFor="layer-whiteout">Whiteout</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="layer-base" className="mr-2" defaultChecked />
                <label htmlFor="layer-base">Base Document</label>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="properties" className="flex-1">
          <div className="p-4">
            <h3 className="font-medium mb-2">Document Properties</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Filename:</span> {currentFile.name}
              </div>
              <div>
                <span className="font-medium">Pages:</span> {currentFile.pageCount}
              </div>
              <div>
                <span className="font-medium">Size:</span> {formatFileSize(currentFile.size)}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}