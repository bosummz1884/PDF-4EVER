import { useContext } from "react";
import { ToolRegistryContext } from "../toolRegistry";

export const useToolRegistry = () => {
  const context = useContext(ToolRegistryContext);
  if (!context) {
    throw new Error(
      "useToolRegistry must be used within a ToolRegistryProvider"
    );
  }
  return context;
};

export default useToolRegistry;
