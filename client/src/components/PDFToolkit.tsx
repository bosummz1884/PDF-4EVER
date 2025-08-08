import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Split,
  Merge,
  RotateCw,
  FileText,
  Trash2,
  Plus,
  Copy,
  Scissors,
  Combine,
  RefreshCw,
  Shrink,
  Shield,
  Settings,
} from "lucide-react";
import { PDFFile, SplitRange } from "../types/pdf-types";

interface PDFToolkitProps {
  onFileProcessed?: (file: PDFFile) => void;
  currentFile?: PDFFile;
}

export default function PDFToolkit({
  onFileProcessed,
  currentFile,
}: PDFToolkitProps) {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("merge");
  const [splitRanges, setSplitRanges] = useState<SplitRange[]>([]);
  const [mergeOrder, setMergeOrder] = useState<string[]>([]);
  const [compressionLevel, setCompressionLevel] = useState("medium");
  const [rotationAngle, setRotationAngle] = useState(90);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (files: FileList, isMerge = false) => {
      setIsProcessing(true);
      setProgress(0);

      const uploadedFiles: PDFFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type !== "application/pdf") continue;

        setProgress((i / files.length) * 50);

        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await pdfCore.loadPDF(arrayBuffer);

          const pdfFile: PDFFile = {
            id: `pdf-${Date.now()}-${i}`,
            name: file.name,
            size: file.size,
            data: arrayBuffer,
            pageCount: pdfDoc.numPages,
          };

          uploadedFiles.push(pdfFile);

          if (!isMerge && i === 0) {
            onFileProcessed?.(pdfFile);
          }
        } catch (error) {
          console.error(`Failed to load PDF: ${file.name}`, error);
        }
      }

      if (isMerge) {
        setFiles((prev) => [...prev, ...uploadedFiles]);
        setMergeOrder((prev) => [...prev, ...uploadedFiles.map((f) => f.id)]);
      } else {
        setFiles(uploadedFiles);
      }

      setProgress(100);
      setIsProcessing(false);
    },
    [onFileProcessed],
  );

  const mergePDFs = useCallback(async () => {
    if (mergeOrder.length < 2) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const orderedFiles = mergeOrder
        .map((id) => files.find((f) => f.id === id))
        .filter(Boolean) as PDFFile[];

      const pdfDataArray = orderedFiles.map((f) => f.data);
      setProgress(50);

      const mergedPdfBytes = await pdfCore.mergePDFs(pdfDataArray);
      setProgress(90);

      const blob = new Blob([new Uint8Array(mergedPdfBytes)], {
        type: "application/pdf",
      });
      pdfCore.downloadBlob(blob, "merged-document.pdf");

      setProgress(100);
    } catch (error) {
      console.error("Merge failed:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [files, mergeOrder]);

  const splitPDF = useCallback(async () => {
    if (!currentFile || splitRanges.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const pageRanges = splitRanges.map((range) => {
        const pages = [];
        for (let i = range.start; i <= range.end; i++) {
          pages.push(i);
        }
        return pages;
      });

      setProgress(30);
      const splitPdfs = await pdfCore.splitPDF(currentFile.data, pageRanges);
      setProgress(80);

      splitPdfs.forEach((pdfBytes, index) => {
        const range = splitRanges[index];
        const blob = new Blob([new Uint8Array(pdfBytes)], {
          type: "application/pdf",
        });
        const filename =
          range.name || `${currentFile.name}-part-${index + 1}.pdf`;
        pdfCore.downloadBlob(blob, filename);
      });

      setProgress(100);
    } catch (error) {
      console.error("Split failed:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [currentFile, splitRanges]);

  const rotatePDF = useCallback(
    async (pageNum?: number) => {
      if (!currentFile) return;

      setIsProcessing(true);

      try {
        const targetPage = pageNum || 1;
        const rotatedPdfBytes = await pdfCore.rotatePDF(
          currentFile.data,
          targetPage,
          rotationAngle,
        );

        const blob = new Blob([new Uint8Array(rotatedPdfBytes)], {
          type: "application/pdf",
        });
        setProgress(100);
        pdfCore.downloadBlob(blob, `${currentFile.name}-rotated.pdf`);
      } catch (error) {
        console.error("Rotation failed:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [currentFile, rotationAngle],
  );

  const compressPDF = useCallback(async () => {
    if (!currentFile) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      setProgress(50);
      const compressedPdfBytes = await pdfCore.compressPDF(currentFile.data);
      setProgress(90);

      const originalSize = currentFile.size;
      const compressedSize = compressedPdfBytes.length;
      const reduction = (
        ((originalSize - compressedSize) / originalSize) *
        100
      ).toFixed(1);

      const blob = new Blob([new Uint8Array(compressedPdfBytes)], {
        type: "application/pdf",
      });
      pdfCore.downloadBlob(blob, `${currentFile.name}-compressed.pdf`);

      alert(`Compression complete! Size reduced by ${reduction}%`);
      setProgress(100);
    } catch (error) {
      console.error("Compression failed:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [currentFile]);

  const addSplitRange = () => {
    const newRange: SplitRange = {
      id: `range-${Date.now()}`,
      start: 1,
      end: currentFile?.pageCount || 1,
      name: `Part ${splitRanges.length + 1}`,
    };
    setSplitRanges([...splitRanges, newRange]);
  };

  const updateSplitRange = (id: string, updates: Partial<SplitRange>) => {
    setSplitRanges((ranges) =>
      ranges.map((range) =>
        range.id === id ? { ...range, ...updates } : range,
      ),
    );
  };

  const removeSplitRange = (id: string) => {
    setSplitRanges((ranges) => ranges.filter((range) => range.id !== id));
  };

  const reorderMergeFiles = (fromIndex: number, toIndex: number) => {
    const newOrder = [...mergeOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    setMergeOrder(newOrder);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6" data-oid="rgjx0.0">
      {/* File Upload Section */}
      <Card data-oid=":hjmo1p">
        <CardHeader data-oid="t1l6g4z">
          <CardTitle className="flex items-center gap-2" data-oid="c6dkqah">
            <FileText className="h-5 w-5" data-oid="kn886g6" />
            PDF Toolkit
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="4ri_lph">
          <div className="flex gap-2 flex-wrap" data-oid="zjh00a:">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              data-oid="_bwwg52"
            >
              <Upload className="h-4 w-4 mr-2" data-oid="p5zws-h" />
              Upload PDF
            </Button>

            <Button
              onClick={() => mergeInputRef.current?.click()}
              variant="outline"
              data-oid="z67djvg"
            >
              <Plus className="h-4 w-4 mr-2" data-oid="hnv7mm-" />
              Add for Merge
            </Button>

            {currentFile && (
              <div className="flex items-center gap-2 ml-4" data-oid="8uc0yqw">
                <Badge variant="secondary" data-oid="tqaqt:q">
                  {currentFile.name} ({currentFile.pageCount} pages)
                </Badge>
                <Badge variant="outline" data-oid="d-2zo4c">
                  {formatFileSize(currentFile.size)}
                </Badge>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
            data-oid="37ciysj"
          />

          <input
            ref={mergeInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={(e) =>
              e.target.files && handleFileUpload(e.target.files, true)
            }
            className="hidden"
            data-oid="w87p1b5"
          />
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      {isProcessing && (
        <Card data-oid="xh_diqh">
          <CardContent className="pt-6" data-oid="x1zg:xn">
            <Progress value={progress} className="w-full" data-oid="0ss.y6a" />
            <p className="text-sm text-center mt-2" data-oid="wq5ns83">
              Processing... {progress}%
            </p>
          </CardContent>
        </Card>
      )}

      {/* PDF Tools Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} data-oid="ve039e5">
        <TabsList className="grid w-full grid-cols-5" data-oid="6:uvei_">
          <TabsTrigger value="merge" data-oid="6f8s_2c">
            <Merge className="h-4 w-4 mr-1" data-oid="b3rbp6q" />
            Merge
          </TabsTrigger>
          <TabsTrigger value="split" data-oid="yedp_s0">
            <Split className="h-4 w-4 mr-1" data-oid="-:bplup" />
            Split
          </TabsTrigger>
          <TabsTrigger value="rotate" data-oid="whs3:.p">
            <RotateCw className="h-4 w-4 mr-1" data-oid=".kucad2" />
            Rotate
          </TabsTrigger>
          <TabsTrigger value="compress" data-oid="n_nhu8:">
            <Shrink className="h-4 w-4 mr-1" data-oid="o6xyx4q" />
            Shrink
          </TabsTrigger>
          <TabsTrigger value="tools" data-oid="he41xj.">
            <Settings className="h-4 w-4 mr-1" data-oid="9xdjqy6" />
            Tools
          </TabsTrigger>
        </TabsList>

        {/* Merge Tab */}
        <TabsContent value="merge" data-oid="fh4tvqz">
          <Card data-oid="sjs1bmh">
            <CardHeader data-oid="7x-17ed">
              <CardTitle data-oid="gexwg4d">Merge PDFs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="s3e48x3">
              {files.length > 0 ? (
                <>
                  <ScrollArea
                    className="h-48 border rounded p-4"
                    data-oid="9xe:ipm"
                  >
                    <div className="space-y-2" data-oid="tkkictw">
                      {mergeOrder.map((fileId, index) => {
                        const file = files.find((f) => f.id === fileId);
                        if (!file) return null;

                        return (
                          <div
                            key={fileId}
                            className="flex items-center justify-between p-2 border rounded"
                            data-oid="_3baf21"
                          >
                            <div
                              className="flex items-center gap-2"
                              data-oid="a5wr7k5"
                            >
                              <Badge variant="outline" data-oid="0.ot-1a">
                                {index + 1}
                              </Badge>
                              <span className="text-sm" data-oid="spwmxbf">
                                {file.name}
                              </span>
                              <Badge variant="secondary" data-oid="9t6x-gy">
                                {file.pageCount} pages
                              </Badge>
                            </div>
                            <div className="flex gap-1" data-oid="6nb455f">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  reorderMergeFiles(
                                    index,
                                    Math.max(0, index - 1),
                                  )
                                }
                                disabled={index === 0}
                                data-oid="lpfyjak"
                              >
                                ↑
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  reorderMergeFiles(
                                    index,
                                    Math.min(mergeOrder.length - 1, index + 1),
                                  )
                                }
                                disabled={index === mergeOrder.length - 1}
                                data-oid="1_6ujv-"
                              >
                                ↓
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setFiles(
                                    files.filter((f) => f.id !== fileId),
                                  );
                                  setMergeOrder(
                                    mergeOrder.filter((id) => id !== fileId),
                                  );
                                }}
                                data-oid="q43.2.9"
                              >
                                <Trash2
                                  className="h-3 w-3"
                                  data-oid="3yu_xrb"
                                />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  <Button
                    onClick={mergePDFs}
                    disabled={mergeOrder.length < 2 || isProcessing}
                    className="w-full"
                    data-oid=":97m:0:"
                  >
                    <Combine className="h-4 w-4 mr-2" data-oid="z4-7qum" />
                    Merge {mergeOrder.length} PDFs
                  </Button>
                </>
              ) : (
                <div
                  className="text-center py-8 text-gray-500"
                  data-oid="r8r_i.x"
                >
                  Upload multiple PDF files to merge them
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Split Tab */}
        <TabsContent value="split" data-oid="4.souhy">
          <Card data-oid="4quvguz">
            <CardHeader data-oid="81:dx2-">
              <CardTitle data-oid="0o6v1am">Split PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="5jqu0gb">
              {currentFile ? (
                <>
                  <div className="space-y-2" data-oid="gt8_vgh">
                    <div
                      className="flex items-center justify-between"
                      data-oid="nr.re1n"
                    >
                      <Label data-oid="cm.kzfx">Split Ranges</Label>
                      <Button
                        size="sm"
                        onClick={addSplitRange}
                        data-oid="4lahvnx"
                      >
                        <Plus className="h-4 w-4 mr-1" data-oid="mmjltw9" />
                        Add Range
                      </Button>
                    </div>

                    <ScrollArea
                      className="h-48 border rounded p-4"
                      data-oid="1adk1vm"
                    >
                      <div className="space-y-3" data-oid=".6.c63r">
                        {splitRanges.map((range) => (
                          <div
                            key={range.id}
                            className="grid grid-cols-4 gap-2 items-center p-2 border rounded"
                            data-oid="wodm_xv"
                          >
                            <Input
                              placeholder="Name"
                              value={range.name}
                              onChange={(e) =>
                                updateSplitRange(range.id, {
                                  name: e.target.value,
                                })
                              }
                              data-oid="3fgy9py"
                            />

                            <Input
                              type="number"
                              placeholder="Start"
                              min={1}
                              max={currentFile.pageCount}
                              value={range.start}
                              onChange={(e) =>
                                updateSplitRange(range.id, {
                                  start: parseInt(e.target.value),
                                })
                              }
                              data-oid="e.2ot-p"
                            />

                            <Input
                              type="number"
                              placeholder="End"
                              min={1}
                              max={currentFile.pageCount}
                              value={range.end}
                              onChange={(e) =>
                                updateSplitRange(range.id, {
                                  end: parseInt(e.target.value),
                                })
                              }
                              data-oid="9j86l0e"
                            />

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeSplitRange(range.id)}
                              data-oid="ynk.vzh"
                            >
                              <Trash2 className="h-3 w-3" data-oid="rf4dxk:" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <Button
                    onClick={splitPDF}
                    disabled={splitRanges.length === 0 || isProcessing}
                    className="w-full"
                    data-oid="ogk6l50"
                  >
                    <Scissors className="h-4 w-4 mr-2" data-oid="eiul38j" />
                    Split into {splitRanges.length} files
                  </Button>
                </>
              ) : (
                <div
                  className="text-center py-8 text-gray-500"
                  data-oid="bv8p6i5"
                >
                  Upload a PDF file to split it
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rotate Tab */}
        <TabsContent value="rotate" data-oid="tl8vik.">
          <Card data-oid="akn4dea">
            <CardHeader data-oid="25c4yz1">
              <CardTitle data-oid="muier_y">Rotate PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="n1f99c-">
              {currentFile ? (
                <>
                  <div className="space-y-2" data-oid="rft76tk">
                    <Label data-oid="eadx-n0">Rotation Angle</Label>
                    <Select
                      value={rotationAngle.toString()}
                      onValueChange={(value) =>
                        setRotationAngle(parseInt(value))
                      }
                      data-oid="_rzs-_s"
                    >
                      <SelectTrigger data-oid="t0f8dno">
                        <SelectValue data-oid="k_et-om" />
                      </SelectTrigger>
                      <SelectContent data-oid="anr5_ti">
                        <SelectItem value="90" data-oid="ard2a2m">
                          90° Clockwise
                        </SelectItem>
                        <SelectItem value="180" data-oid="do05ide">
                          180°
                        </SelectItem>
                        <SelectItem value="270" data-oid="tywo3ra">
                          270° Clockwise
                        </SelectItem>
                        <SelectItem value="-90" data-oid="s5b69dn">
                          90° Counter-clockwise
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={() => rotatePDF()}
                    disabled={isProcessing}
                    className="w-full"
                    data-oid="h2jn5h9"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" data-oid="g8i:.8_" />
                    Rotate All Pages {rotationAngle}°
                  </Button>
                </>
              ) : (
                <div
                  className="text-center py-8 text-gray-500"
                  data-oid="slgs-e9"
                >
                  Upload a PDF file to rotate it
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compress Tab */}
        <TabsContent value="compress" data-oid="etm8j_m">
          <Card data-oid="xcefxni">
            <CardHeader data-oid="zeabjo.">
              <CardTitle data-oid="flwwr1b">Compress PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="ac7m1wb">
              {currentFile ? (
                <>
                  <div className="space-y-2" data-oid="g1dst3.">
                    <Label data-oid="oy8c67v">Compression Level</Label>
                    <Select
                      value={compressionLevel}
                      onValueChange={setCompressionLevel}
                      data-oid="u6cw5hv"
                    >
                      <SelectTrigger data-oid="_xcuwve">
                        <SelectValue data-oid="68lr9i4" />
                      </SelectTrigger>
                      <SelectContent data-oid="o2hc3p.">
                        <SelectItem value="low" data-oid="5:cc-dk">
                          Low (Better Quality)
                        </SelectItem>
                        <SelectItem value="medium" data-oid="9:g2-a9">
                          Medium (Balanced)
                        </SelectItem>
                        <SelectItem value="high" data-oid="vkxhh1t">
                          High (Smaller Size)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded"
                    data-oid="wvnee:i"
                  >
                    <p className="text-sm" data-oid="5lhh:a4">
                      <strong data-oid="5cwyflp">Current file:</strong>{" "}
                      {currentFile.name}
                    </p>
                    <p className="text-sm" data-oid="q1jl2i6">
                      <strong data-oid="i-8o4xz">Size:</strong>{" "}
                      {formatFileSize(currentFile.size)}
                    </p>
                    <p className="text-sm" data-oid="mep1idk">
                      <strong data-oid="ng.66_:">Pages:</strong>{" "}
                      {currentFile.pageCount}
                    </p>
                  </div>

                  <Button
                    onClick={compressPDF}
                    disabled={isProcessing}
                    className="w-full"
                    data-oid="wwt595p"
                  >
                    <Shrink className="h-4 w-4 mr-2" data-oid="rcs8ew5" />
                    Compress PDF
                  </Button>
                </>
              ) : (
                <div
                  className="text-center py-8 text-gray-500"
                  data-oid="hw07r.e"
                >
                  Upload a PDF file to compress it
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" data-oid="of6r03u">
          <div className="grid gap-4" data-oid=":ioh.xy">
            <Card data-oid="wkaw:wo">
              <CardHeader data-oid="24hu9ty">
                <CardTitle data-oid="f4cybqn">Batch Operations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2" data-oid="4pdl0q6">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  data-oid="k2l0my6"
                >
                  <Copy className="h-4 w-4 mr-2" data-oid="v2b8_n_" />
                  Duplicate Pages
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  data-oid="95qpvb0"
                >
                  <Trash2 className="h-4 w-4 mr-2" data-oid="r0-7ybq" />
                  Remove Pages
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  data-oid="kiuavxp"
                >
                  <Shield className="h-4 w-4 mr-2" data-oid="nq-je6u" />
                  Add Password
                </Button>
              </CardContent>
            </Card>

            <Card data-oid="aiu4th9">
              <CardHeader data-oid="nuvql.-">
                <CardTitle data-oid="lz0r.a0">Information</CardTitle>
              </CardHeader>
              <CardContent data-oid="okjrx32">
                {currentFile && (
                  <div className="space-y-2 text-sm" data-oid="5w39q0j">
                    <div className="grid grid-cols-2 gap-2" data-oid="q4z35if">
                      <span className="text-gray-500" data-oid="_1_z.cg">
                        File name:
                      </span>
                      <span data-oid="it0_v:0">{currentFile.name}</span>
                      <span className="text-gray-500" data-oid="twu5qqz">
                        File size:
                      </span>
                      <span data-oid="hsff1ph">
                        {formatFileSize(currentFile.size)}
                      </span>
                      <span className="text-gray-500" data-oid="yd7913b">
                        Pages:
                      </span>
                      <span data-oid="fh-h018">{currentFile.pageCount}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
