// app/components/RenderNode.tsx

import React from "react";
import { useNode } from "@craftjs/core";
import { GripVertical } from "lucide-react";

type RenderNodeProps = {
  render: React.ReactElement;
};

export const RenderNode: React.FC<RenderNodeProps> = ({ render }) => {
  const {
    selected,
    hovered,
    connectors: { connect, drag },
    data,
  } = useNode((node) => ({
    selected: node.events.selected,
    hovered: node.events.hovered,
    data: node.data,
  }));

  // Get the display name/type of the node
  const nodeType =
    data?.displayName ||
    (typeof data?.type === "string" ? data.type : data?.type?.name || "Node");

  // Determine if the current node represents the page <Body>
  const isBody = nodeType === "Body";

  return (
    <div
      ref={(ref) => connect(ref as any)}
      style={{
        position: "relative",
        outline: selected
          ? "2px solid #1976d2"
          : hovered
            ? "1px dashed #90caf9"
            : "none",
        transition: "outline 0.2s",
        boxSizing: "border-box",
        display: isBody ? "block" : "inline-block",
        width: isBody ? undefined : "fit-content",
      }}
    >
      {selected && (
        <div
          style={{
            position: "absolute",
            top: -23,
            left: 0,
            background: "#1976d2",
            color: "#fff",
            fontSize: 12,
            padding: "2px 8px",
            borderRadius: "4px 4px 0 0",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
            pointerEvents: "auto",
          }}
        >
          {!isBody && (
            <span
              ref={drag as any}
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "grab",
                marginRight: 6,
              }}
            >
              <GripVertical size={14} />
            </span>
          )}
          {nodeType}
        </div>
      )}
      {render}
    </div>
  );
};
