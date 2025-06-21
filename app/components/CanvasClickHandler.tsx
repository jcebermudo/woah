import React, { useEffect } from "react";
import { useEditor } from "@craftjs/core";

export const CanvasClickHandler: React.FC = () => {
  const { actions } = useEditor();

  useEffect(() => {
    const handleClearSelection = () => {
      actions.clearEvents();
    };

    window.addEventListener("clearCraftSelection", handleClearSelection);

    return () => {
      window.removeEventListener("clearCraftSelection", handleClearSelection);
    };
  }, [actions]);

  return null;
};
