// app/components/RenderNode.tsx

import React, { useContext } from "react";
import { useNode } from "@craftjs/core";
import { GripVertical } from "lucide-react";
import { ViewportContext } from "./context/ViewportContext";

type RenderNodeProps = {
  render: React.ReactElement;
};

export const RenderNode: React.FC<RenderNodeProps> = ({ render }) => {
  const { scale = 1 } = useContext(ViewportContext);
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
          ? `${2 / scale}px solid #2C7FFF`
          : hovered
            ? `${1 / scale}px dashed #90caf9`
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
            top: `${-32 / scale}px`,
            left: 0,
            background: "#2C7FFF",
            color: "#fff",
            fontSize: `${12 / scale}px`,
            fontWeight: "bold",
            padding: `${5 / scale}px ${8 / scale}px`,
            borderRadius: `${4 / scale}px`,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: `${6 / scale}px`,
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
                marginRight: `${6 / scale}px`,
              }}
            >
              <GripVertical size={14 / scale} />
            </span>
          )}
          {nodeType}
        </div>
      )}
      {render}
    </div>
  );
};
