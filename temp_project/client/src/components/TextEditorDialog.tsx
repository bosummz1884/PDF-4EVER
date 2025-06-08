import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Type, Palette, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Save, X } from "lucide-react";

interface TextEditorDialogProps {
  isVisible: boolean;
  onClose: () => void;
  onTextAdd: (textData: any) => void;
  selectedFont?: string;
  selectedFontSize?: string;
  selectedColor?: string;
}

export default function TextEditorDialog({
  isVisible = false,
  onClose = () => {},
  onTextAdd = () => {},
  selectedFont = "Arial",
  selectedFontSize = "12",
  selectedColor = "#000000"
}: TextEditorDialogProps) {
  const [text, setText] = useState("");
  const [font, setFont] = useState(selectedFont);
  const [fontSize, setFontSize] = useState(selectedFontSize);
  const [color, setColor] = useState(selectedColor);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [alignment, setAlignment] = useState("left");

  const handleAddText = () => {
    if (text.trim()) {
      const textData = {
        text: text.trim(),
        font: font,
        size: parseInt(fontSize),
        color: color,
        bold: isBold,
        italic: isItalic,
        alignment: alignment,
        x: 100, // Default position
        y: 100  // Default position
      };
      
      console.log("Adding text:", textData);
      onTextAdd(textData);
      
      // Reset form
      setText("");
      setFont(selectedFont);
      setFontSize(selectedFontSize);
      setColor(selectedColor);
      setIsBold(false);
      setIsItalic(false);
      setAlignment("left");
      
      onClose();
    }
  };

  const availableFonts = [
    "Arial", "Helvetica", "Times New Roman", "Courier New", 
    "Georgia", "Verdana", "Comic Sans MS", "Impact"
  ];

  const fontSizes = [
    "8", "9", "10", "11", "12", "14", "16", "18", "20", "22", "24", "26", "28", "32", "36", "48", "72"
  ];

  if (!isVisible) return null;

  return (
    <Dialog open={isVisible} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Add Text to PDF
          </DialogTitle>
          <DialogDescription>
            Enter your text and customize its appearance. The text will be added to the current page.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Text Input */}
          <div className="grid gap-2">
            <Label htmlFor="text-input">Text Content</Label>
            <Textarea
              id="text-input"
              placeholder="Enter the text you want to add..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Font Settings Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="font-family">Font Family</Label>
              <Select value={font} onValueChange={setFont}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableFonts.map((fontName) => (
                    <SelectItem key={fontName} value={fontName}>
                      {fontName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="font-size">Font Size</Label>
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontSizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="text-color">Text Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="text-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>

          {/* Style Options */}
          <div className="grid gap-2">
            <Label>Text Style</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={isBold ? "default" : "outline"}
                size="sm"
                onClick={() => setIsBold(!isBold)}
                className="flex items-center gap-2"
              >
                <Bold className="h-4 w-4" />
                Bold
              </Button>
              <Button
                type="button"
                variant={isItalic ? "default" : "outline"}
                size="sm"
                onClick={() => setIsItalic(!isItalic)}
                className="flex items-center gap-2"
              >
                <Italic className="h-4 w-4" />
                Italic
              </Button>
            </div>
          </div>

          {/* Alignment Options */}
          <div className="grid gap-2">
            <Label>Text Alignment</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={alignment === "left" ? "default" : "outline"}
                size="sm"
                onClick={() => setAlignment("left")}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={alignment === "center" ? "default" : "outline"}
                size="sm"
                onClick={() => setAlignment("center")}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={alignment === "right" ? "default" : "outline"}
                size="sm"
                onClick={() => setAlignment("right")}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="grid gap-2">
            <Label>Preview</Label>
            <div 
              className="p-4 border rounded-lg bg-muted/50"
              style={{
                fontFamily: font,
                fontSize: `${fontSize}px`,
                color: color,
                fontWeight: isBold ? "bold" : "normal",
                fontStyle: isItalic ? "italic" : "normal",
                textAlign: alignment as any
              }}
            >
              {text || "Sample text preview..."}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleAddText} disabled={!text.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Add Text
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}