// src/features/pdf-editor/useToolSettings.tsx

import { useState, useCallback } from "react";
// CORRECTED: Imported the master ToolSettings type
import { ToolType, ToolSettings } from "@/types/pdf-types";

// REMOVED: The local, permissive ToolSettings interface is gone.

export interface UseToolSettingsReturn {
  getSettings: (toolId: ToolType) => ToolSettings;
  // CORRECTED: The 'updateSetting' signature is now generic and fully type-safe.
  updateSetting: <K extends keyof ToolSettings>(
    toolId: ToolType,
    key: K,
    value: ToolSettings[K]
  ) => void;
  resetSettings: (toolId: ToolType) => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

export const useToolSettings = (
  defaultSettings: Record<ToolType, ToolSettings>,
): UseToolSettingsReturn => {
  const [settings, setSettings] =
    useState<Record<ToolType, ToolSettings>>(defaultSettings);

  const getSettings = useCallback(
    (toolId: ToolType) => {
      return settings[toolId] || defaultSettings[toolId] || {};
    },
    [settings, defaultSettings],
  );

  // CORRECTED: The implementation now uses generics, ensuring 'key' is a valid
  // property of ToolSettings and 'value' matches its type. No 'any' is used.
  const updateSetting = useCallback(
    <K extends keyof ToolSettings>(
      toolId: ToolType,
      key: K,
      value: ToolSettings[K]
    ) => {
      setSettings((prev) => ({
        ...prev,
        [toolId]: {
          ...prev[toolId],
          [key]: value,
        },
      }));
    },
    [],
  );

  const resetSettings = useCallback(
    (toolId: ToolType) => {
      setSettings((prev) => ({
        ...prev,
        [toolId]: { ...defaultSettings[toolId] },
      }));
    },
    [defaultSettings],
  );

  const exportSettings = useCallback(() => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  const importSettings = useCallback((settingsJson: string) => {
    try {
      // While JSON.parse is inherently 'any', we immediately cast it
      // to the expected type to maintain internal type safety.
      const importedSettings = JSON.parse(settingsJson) as Record<ToolType, ToolSettings>;
      setSettings(importedSettings);
      return true;
    } catch (error) {
      console.error("Failed to import settings:", error);
      return false;
    }
  }, []);

  return {
    getSettings,
    updateSetting,
    resetSettings,
    exportSettings,
    importSettings,
  };
};

export default useToolSettings;