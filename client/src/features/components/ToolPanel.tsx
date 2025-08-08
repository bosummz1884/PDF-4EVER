import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePDFEditor } from "@/features/pdf-editor/PDFEditorContext";
import { toolRegistry } from "@/features/pdf-editor/toolRegistry";
import { ToolSettings, ToolType } from "@/types/pdf-types";

export const ToolPanel: React.FC = () => {
  // 1. Get EVERYTHING from our single source of truth
  const { state, dispatch } = usePDFEditor();
  const { currentTool, toolSettings } = state;

  // 2. Create a handler that dispatches an action to our central reducer
  const handleSettingChange = <K extends keyof ToolSettings>(
    key: K,
    value: ToolSettings[K],
  ) => {
    dispatch({
      type: "UPDATE_TOOL_SETTING",
      payload: { toolId: currentTool, key, value },
    });
  };

  // 3. Get tool definitions from our static list
  const currentToolData = toolRegistry[currentTool];
  const currentSettings = toolSettings[currentTool];
  const SettingsComponent = currentToolData.component;

  const categories = Array.from(
    new Set(Object.values(toolRegistry).map((t) => t.category)),
  );

  return (
    <div
      className="w-80 bg-gray-50 dark:bg-black/20 border-l flex flex-col flex-shrink-0"
      data-oid="ji.csg_"
    >
      <div className="p-4 border-b" data-oid="p0bc-06">
        <h2 className="text-lg font-semibold" data-oid="td-1hsl">
          Tools
        </h2>
      </div>

      <ScrollArea className="flex-1" data-oid="cqtt14n">
        {categories.map((category) => (
          <div key={category} className="p-4 border-b" data-oid="01_9rgo">
            <h3
              className="text-sm font-medium text-muted-foreground mb-3 capitalize"
              data-oid="9747g.r"
            >
              {category}
            </h3>
            <div className="grid grid-cols-5 gap-2" data-oid="ayoqonc">
              {Object.values(toolRegistry)
                .filter((tool) => tool.category === category)
                .map((tool) => (
                  <Button
                    key={tool.name}
                    variant={currentTool === tool.name ? "default" : "outline"}
                    size="icon"
                    className="h-12 w-12"
                    title={tool.label}
                    onClick={() =>
                      dispatch({
                        type: "SET_CURRENT_TOOL",
                        payload: tool.name as ToolType,
                      })
                    }
                    data-oid="wcgb56p"
                  >
                    {tool.icon}
                  </Button>
                ))}
            </div>
          </div>
        ))}
      </ScrollArea>

      {currentToolData && (
        <div className="border-t" data-oid="il4b3:-">
          <Card
            className="border-0 rounded-none shadow-none bg-transparent"
            data-oid="6z.-l2o"
          >
            <CardHeader data-oid="m4o.eht">
              <CardTitle
                className="text-base flex items-center gap-2"
                data-oid="-321wk0"
              >
                {currentToolData.icon}
                {currentToolData.label} Settings
              </CardTitle>
            </CardHeader>
            <CardContent data-oid="q-iy8._">
              <SettingsComponent
                settings={currentSettings}
                onSettingChange={handleSettingChange}
                editorState={state}
                data-oid="zzezn--"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ToolPanel;
