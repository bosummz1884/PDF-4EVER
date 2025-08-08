import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Layers,
  FileText,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { usePDFEditor } from ".././pdf-editor/PDFEditorContext";

export default function PDFSidebar() {
  const { state, dispatch } = usePDFEditor();
  const { pdfDocument, currentPage, totalPages, annotations } = state;

  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!pdfDocument) {
      setThumbnails([]);
      return;
    }

    const generateThumbnails = async () => {
      setIsLoading(true);
      try {
        const thumbs: string[] = [];
        for (let i = 1; i <= totalPages; i++) {
          const page = await pdfDocument.getPage(i);
          const viewport = page.getViewport({ scale: 0.2 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) continue;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport }).promise;
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
  }, [pdfDocument, totalPages]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      dispatch({ type: "SET_CURRENT_PAGE", payload: page });
    }
  };

  const currentPageAnnotations = annotations[currentPage] || [];

  return (
    <div
      className="w-64 border-r bg-gray-50 dark:bg-black/20 flex flex-col flex-shrink-0"
      data-oid="bj9rv_."
    >
      <Tabs
        defaultValue="pages"
        className="flex-1 flex flex-col"
        data-oid="0zr:b5b"
      >
        <TabsList className="grid w-full grid-cols-2" data-oid="-ipub2o">
          <TabsTrigger value="pages" data-oid="spc.qpf">
            <FileText className="h-4 w-4 mr-1" data-oid="w_aae0p" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="layers" data-oid="luggdv.">
            <Layers className="h-4 w-4 mr-1" data-oid="hls_rou" />
            Elements
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="pages"
          className="flex-1 flex flex-col p-0"
          data-oid="9k.p4lj"
        >
          <ScrollArea className="flex-1" data-oid="fzhn.oi">
            {isLoading ? (
              <div
                className="flex items-center justify-center h-full p-4 text-sm text-muted-foreground"
                data-oid="ak-:l1e"
              >
                Loading...
              </div>
            ) : (
              <div className="p-2 grid grid-cols-2 gap-2" data-oid="o69e06d">
                {thumbnails.map((thumbnail, index) => (
                  <div
                    key={`thumb-${index}`}
                    className={`border-2 rounded p-0.5 cursor-pointer transition-all ${currentPage === index + 1 ? "border-primary" : "border-transparent hover:border-muted-foreground/50"}`}
                    onClick={() => goToPage(index + 1)}
                    data-oid="ny87m:a"
                  >
                    <div className="relative" data-oid="t44t57v">
                      <img
                        src={thumbnail}
                        alt={`Page ${index + 1}`}
                        className="w-full rounded-sm"
                        data-oid="z3dr5w_"
                      />

                      <div
                        className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-tl-md"
                        data-oid="of6dnmn"
                      >
                        {index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="layers" className="flex-1" data-oid="rv.oh4n">
          <ScrollArea className="h-full" data-oid="elgrjd2">
            <div className="p-4 space-y-2" data-oid="ywzq92o">
              <h3 className="font-medium mb-2 text-sm" data-oid="x1w_pzu">
                Elements on Page {currentPage}
              </h3>
              {currentPageAnnotations.length > 0 ? (
                currentPageAnnotations.map((ann) => (
                  <div
                    key={ann.id}
                    className="flex items-center justify-between p-2 border rounded text-xs bg-white dark:bg-black/30 hover:bg-muted"
                    data-oid="tr0legu"
                  >
                    <span className="capitalize" data-oid="cb92b38">
                      {ann.type}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() =>
                        dispatch({
                          type: "DELETE_ANNOTATION",
                          payload: { page: currentPage, id: ann.id },
                        })
                      }
                      data-oid="uc_imef"
                    >
                      <Trash2 className="h-3 w-3" data-oid="a.cg8-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div
                  className="text-center text-xs text-muted-foreground py-4"
                  data-oid="8ds1-wo"
                >
                  No elements on this page.
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      <div
        className="p-2 border-t flex items-center justify-between flex-shrink-0"
        data-oid="pf5qfdx"
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          data-oid="5uyysba"
        >
          <ChevronLeft className="h-4 w-4" data-oid="vq82__u" />
        </Button>
        <span className="text-sm font-medium" data-oid="rc6:uy1">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          data-oid="s:cl_kw"
        >
          <ChevronRight className="h-4 w-4" data-oid="gegg-v3" />
        </Button>
      </div>
    </div>
  );
}
