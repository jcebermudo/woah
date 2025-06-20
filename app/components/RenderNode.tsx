// ... existing imports ...
import { useNode } from "@craftjs/core";
import * as React from "react";

interface RenderNodeProps {
  render: React.ReactNode;
  canvasScale: number;
}

export const RenderNode: React.FC<RenderNodeProps> = ({
  render,
  canvasScale = 1,
}) => {
  const {
    connectors: { drag },
    data,
    selected,
  } = useNode((node) => ({
    data: node.data,
    selected: node.events.selected,
  }));

  const nodeType = data?.custom?.displayName || data?.displayName || "Node";
  const handleScale = 1 / Math.max(canvasScale, 0.1);

  const scaledBorder = 2 * handleScale;
  const scaledFontSize = 12 * handleScale;

  const borderStyle = selected ? "1px solid #3b82f6" : "none";

  const dragRef = React.useCallback(
    (ref: HTMLDivElement | null) => {
      if (ref) drag(ref);
    },
    [drag]
  );

  return (
    <div
      style={{
        position: "relative",
        background: "white",
        border: borderStyle,
      }}
    >
      {/* Overlay for border and label */}
      {selected && (
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            zIndex: 10,
            transform: `scale(${handleScale})`,
            transformOrigin: "top left",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -19,
              left: -1.8,
              background: "#3b82f6",
              color: "white",
              fontSize: `${scaledFontSize}px`,
              padding: "0 6px",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            {nodeType}
          </span>
        </div>
      )}

      {/* Make this the draggable area */}
      <div ref={dragRef}>{render}</div>
    </div>
  );
};
