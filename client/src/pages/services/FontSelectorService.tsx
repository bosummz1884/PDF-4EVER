import React from 'react';
import { useFonts } from '../../contexts/FontContext';
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface FontSelectorProps {
  selectedFont: string;
  onFontChange: (font: string) => void;
}

export default function FontSelector({ selectedFont, onFontChange }: FontSelectorProps) {
  const { availableFonts, isLoading, loadProgress } = useFonts();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Progress value={loadProgress} />
        <p className="text-sm text-gray-500">
          Loading fonts... {loadProgress}%
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Select value={selectedFont} onValueChange={onFontChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select font" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {availableFonts.map((font) => (
            <SelectItem key={font} value={font}>
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: font }}>{font}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}