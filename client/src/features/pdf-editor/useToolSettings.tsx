import { useState, useCallback } from "react";
import { ToolType }  from "@/types/pdf-types";

export interface ToolSettings {
  [key: string]: any;
}

export interface UseToolSettingsReturn {
  getSettings: (toolId: ToolType) => ToolSettings;
  updateSetting: (toolId: ToolType, key: string, value: any) => void;
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

  const updateSetting = useCallback(
    (toolId: ToolType, key: string, value: any) => {
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
      const importedSettings = JSON.parse(settingsJson);
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
