import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Type } from "lucide-react";
import { FontRecognitionPanelProps } from "@/types/pdf-types";
import { cn } from "@/lib/utils";

export function FontRecognitionPanel({
  detectedFonts,
  isAnalyzing,
  analysisProgress,
  onFontMappingChange,
  settings,
  onSettingsChange
}: FontRecognitionPanelProps) {
  const handleSettingChange = (key: string, value: boolean) => {
    onSettingsChange({ [key]: value });
  };

  
  

  const getFontStatusIcon = (font: typeof detectedFonts[0]) => {
    if (font.confidence > 0.8) {
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    } else if (font.confidence > 0.5) {
      return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
    }
    return <AlertTriangle className="h-3 w-3 text-red-500" />;
  };
  
  return (
    <div className="space-y-4" data-testid="font-recognition-panel">
      {/* Recognition Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Type className="h-4 w-4 text-primary" />
            Font Recognition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Analyzing document</span>
                <span className="text-muted-foreground">{Math.round(analysisProgress)}%</span>
              </div>
              <Progress value={analysisProgress} className="h-2" data-testid="analysis-progress" />
              <p className="text-xs text-muted-foreground">
                Processing fonts and text regions...
              </p>
            </div>
          )}

          {!isAnalyzing && detectedFonts.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">Recognition Complete</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-600">Active</span>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Found {detectedFonts.length} font{detectedFonts.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detected Fonts */}
      {detectedFonts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Detected Fonts ({detectedFonts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {detectedFonts.map((font) => (
                <div
                  key={font.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg border",
                    font.isSystemFont ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
                  )}
                  data-testid={`detected-font-${font.id}`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {getFontStatusIcon(font)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {font.fontFamily}
                        </span>
                        {font.fontWeight === "bold" && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">B</Badge>
                        )}
                        {font.fontStyle === "italic" && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">I</Badge>
                        )}
                      </div>
                      {font.fallbackFont && (
                        <p className="text-xs text-muted-foreground">
                          Fallback: {font.fallbackFont}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium">
                      {font.instances} instance{font.instances !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(font.confidence * 100)}% confidence
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Font Matching Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Font Matching</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Auto-match fonts</label>
              <p className="text-xs text-muted-foreground">
                Automatically match detected fonts to system fonts
              </p>
            </div>
            <Switch
              checked={settings.autoFontMatch}
              onCheckedChange={(checked) => handleSettingChange('autoFontMatch', checked)}
              data-testid="switch-auto-match"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Use fallback fonts</label>
              <p className="text-xs text-muted-foreground">
                Use similar fonts when exact matches are not available
              </p>
            </div>
            <Switch
              checked={settings.useFallbackFonts}
              onCheckedChange={(checked) => handleSettingChange('useFallbackFonts', checked)}
              data-testid="switch-fallback-fonts"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Real-time preview</label>
              <p className="text-xs text-muted-foreground">
                Show font changes as you edit
              </p>
            </div>
            <Switch
              checked={settings.realTimePreview ?? false}
              onCheckedChange={(checked) => handleSettingChange('realTimePreview', checked)}
              data-testid="switch-realtime-preview"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Show warnings</label>
              <p className="text-xs text-muted-foreground">
                Display alerts for font mismatches
              </p>
            </div>
            <Switch
              checked={settings.showFontWarnings}
              onCheckedChange={(checked) => handleSettingChange('showFontWarnings', checked)}
              data-testid="switch-font-warnings"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
