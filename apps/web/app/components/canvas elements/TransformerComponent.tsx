import React, { useRef, useEffect } from "react";
import { Group, Transformer } from "react-konva";
import Konva from "konva";
import { SideAnchor, RotationAnchor } from "./transformers/anchors";
import {
  Shape,
  RectShape,
  CircleShape,
  StarShape,
} from "@/types/canvasElements";

interface TransformerComponent {
  selectedShapes: Shape[];
  selectedNodes: Konva.Node[];
  stageScale: number;
  onTransformEnd: (shape: Shape) => void;
  onShapeChange: (shapeId: string, newAttrs: Partial<Shape>) => void;
  visible: boolean;
}

export default function TransformerComponent({
  selectedShapes,
  selectedNodes,
  stageScale,
  onTransformEnd,
  onShapeChange,
  visible,
}: TransformerComponent) {
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (visible && trRef.current && selectedNodes.length > 0) {
      trRef.current.nodes(selectedNodes);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [visible, selectedNodes]);

  const handleSideAnchorDrag = (
    shape: Shape,
    side: "top" | "bottom" | "left" | "right",
    deltaX: number,
    deltaY: number,
  ) => {
    // Adjust deltas for stage scale to fix zoom sensitivity
    const adjustedDeltaX = deltaX / stageScale;
    const adjustedDeltaY = deltaY / stageScale;

    // Convert rotation to radians for calculations
    const rotation = ((shape.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    // Transform the drag delta to the shape's local coordinate system
    const localDeltaX = adjustedDeltaX * cos - adjustedDeltaY * sin;
    const localDeltaY = adjustedDeltaX * sin + adjustedDeltaY * cos;

    // Get shape dimensions
    let width = 0;
    let height = 0;

    if (shape.type === "rect") {
      const rectShape = shape as RectShape;
      width = rectShape.width;
      height = rectShape.height;
    } else if (shape.type === "circle") {
      const circleShape = shape as CircleShape;
      width = circleShape.width;
      height = circleShape.height;
    } else if (shape.type === "star") {
      const starShape = shape as StarShape;
      width = starShape.width;
      height = starShape.height;
    }

    // Calculate current center and half dimensions
    const centerX = shape.x;
    const centerY = shape.y;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Calculate the position of the fixed edge  (opposite to the one being dragged)
    let fixedEdgeCenterX = centerX;
    let fixedEdgeCenterY = centerY;
    let newWidth = width;
    let newHeight = height;

    switch (side) {
      case "top":
        fixedEdgeCenterX = centerX + (0 * cos - halfHeight * sin);
        fixedEdgeCenterY = centerY + (0 * sin + halfHeight * cos);
        newHeight = Math.max(5, height - localDeltaY);
        break;
      case "bottom":
        fixedEdgeCenterX = centerX + (0 * cos - -halfHeight * sin);
        fixedEdgeCenterY = centerY + (0 * sin + -halfHeight * cos);
        newHeight = Math.max(5, height + localDeltaY);
        break;
      case "left":
        fixedEdgeCenterX = centerX + (halfWidth * cos - 0 * sin);
        fixedEdgeCenterY = centerY + (halfWidth * sin + 0 * cos);
        newWidth = Math.max(5, width - localDeltaX);
        break;
      case "right":
        fixedEdgeCenterX = centerX + (-halfWidth * cos - 0 * sin);
        fixedEdgeCenterY = centerY + (-halfWidth * sin + 0 * cos);
        newWidth = Math.max(5, width + localDeltaX);
        break;
    }

    // Calculate the new position of the shape's center
    const newHalfWidth = newWidth / 2;
    const newHalfHeight = newHeight / 2;

    let newCenterX = centerX;
    let newCenterY = centerY;

    switch (side) {
      case "top":
        newCenterX = fixedEdgeCenterX - (0 * cos - newHalfHeight * sin);
        newCenterY = fixedEdgeCenterY - (0 * sin + newHalfHeight * cos);
        break;
      case "bottom":
        newCenterX = fixedEdgeCenterX - (0 * cos - -newHalfHeight * sin);
        newCenterY = fixedEdgeCenterY - (0 * sin + -newHalfHeight * cos);
        break;
      case "left":
        newCenterX = fixedEdgeCenterX - (newHalfWidth * cos - 0 * sin);
        newCenterY = fixedEdgeCenterY - (newHalfWidth * sin + 0 * cos);
        break;
      case "right":
        newCenterX = fixedEdgeCenterX - (-newHalfWidth * cos - 0 * sin);
        newCenterY = fixedEdgeCenterY - (-newHalfWidth * sin + 0 * cos);
        break;
    }

    // update shape
    onShapeChange(shape.id, {
      x: newCenterX,
      y: newCenterY,
      width: newWidth,
      height: newHeight,
    });
  };
}
