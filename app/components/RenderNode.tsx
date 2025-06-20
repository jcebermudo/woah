// ... existing imports ...
import { useNode } from "@craftjs/core";
import * as React from "react";

interface RenderNodeProps {
  render: React.ReactNode;
  canvasScale: number;
}

export const RenderNode: React.FC<RenderNodeProps> = ({
  render,
  canvasScale,
}) => {
  const {
    connectors: { drag },
    data,
    selected,
  } = useNode((node) => ({
    data: node.data,
    selected: node.events.selected,
  }));

  // Get the node type (displayName or custom.displayName)
  const nodeType = data?.custom?.displayName || data?.displayName || "Node";

  const handleScale = 1 / Math.max(canvasScale, 0.1);

  if (!selected) {
    // Not selected: just render the content
    return (
      <div
        style={{
          position: "relative",
          background: "white",
          border: "none",
        }}
      >
        {render}
      </div>
    );
  }

  // Selected: show outline, label, and drag
  return (
    <div
      ref={(ref) => {
        if (ref) drag(ref);
      }}
      style={{
        position: "relative",
        background: "white",
        border: `${2 * handleScale}px solid #3b82f6`,
      }}
    >
      {/* Overlay for border and label */}
      <div
        style={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          zIndex: 10,
          transform: `scale(${1 * handleScale})`,
          transformOrigin: "top left",
        }}
      >
        {/* Node type label */}
        <span
          style={{
            position: "absolute",
            top: -19,
            left: -1.8,
            background: "#3b82f6",
            color: "white",
            fontSize: 12,
            padding: "0 6px",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          {nodeType}
        </span>
      </div>
      {render}
    </div>
  );
};
