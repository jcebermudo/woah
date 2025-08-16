import React, { useRef, useEffect, useState } from "react";
import { Group, Transformer } from "react-konva";
import Konva from "konva";
import { SideAnchor, RotationAnchor } from "./transformers/anchors";
import {
  Shape,
  RectShape,
  CircleShape,
  StarShape,
  LayerContainer,
} from "@/types/canvasElements";

interface TransformerComponent {
  layer?: LayerContainer;
  selectedShapes: Shape[];
  selectedNodes: Konva.Node[];
  stageScale: number;
  onShapeChange: (shapeId: string, newAttrs: Partial<Shape>) => void;
  getShapeLayer: (shapeId: string) => LayerContainer | null;
  handleMultipleTransformEnd: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMultiDragEnd: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  visible: boolean;
}

export default function TransformerComponent({
  layer,
  selectedShapes,
  selectedNodes,
  stageScale,
  onShapeChange,
  getShapeLayer,
  handleMultipleTransformEnd,
  handleMultiDragEnd,
  visible,
}: TransformerComponent) {
  const trRef = useRef<Konva.Transformer>(null);
  const [currentBoundingBox, setCurrentBoundingBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  } | null>(null);

  useEffect(() => {
    if (trRef.current) {
      trRef.current.nodes(selectedNodes);
    }
  }, [selectedShapes, selectedNodes]);

  {
    /* Single Shape Transform End 
  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = selectedNodes[0];
    const transformer = trRef.current;
    if (!node || !transformer) return;

    // Scale that was just applied by Konva
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scaling on the node so we can work with explicit width/height
    node.scaleX(1);
    node.scaleY(1);

    console.log("scaleX", scaleX);
    console.log("scaleY", scaleY);

    // New explicit dimensions
    const newWidth = Math.max(50, selectedShapes[0].width * Math.abs(scaleX));
    const newHeight = Math.max(50, selectedShapes[0].height * Math.abs(scaleY));

    // Get the layer for this shape to convert coordinates properly
    const shapeLayer = getShapeLayer(selectedShapes[0].id);
    if (!shapeLayer) return;

    // node.x() and node.y() are relative to the layer, convert to world coordinates
    const newX = node.x() + shapeLayer.x;
    const newY = node.y() + shapeLayer.y;

    // Update the shape props
    onShapeChange(selectedShapes[0].id, {
      ...selectedShapes[0],
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
  };
  */
  }

  const getCorner = (
    pivotX: number,
    pivotY: number,
    diffX: number,
    diffY: number,
    angle: number
  ) => {
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);
    angle += Math.atan2(diffY, diffX);
    const x = pivotX + distance * Math.cos(angle);
    const y = pivotY + distance * Math.sin(angle);
    return { x, y };
  };

  const getClientRect = (rotatedBox: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  }) => {
    const { x, y, width, height } = rotatedBox;
    const rad = ((rotatedBox.rotation || 0) * Math.PI) / 180;

    const p1 = getCorner(x, y, -width / 2, -height / 2, rad);
    const p2 = getCorner(x, y, width / 2, -height / 2, rad);
    const p3 = getCorner(x, y, width / 2, height / 2, rad);
    const p4 = getCorner(x, y, -width / 2, height / 2, rad);

    const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  };

  const handleSideAnchorDrag = (
    shape: Shape,
    side: "top" | "bottom" | "left" | "right",
    deltaX: number,
    deltaY: number
  ) => {
    // Note: deltaX and deltaY are already in the correct coordinate system
    // from layer.getRelativePointerPosition(), so no stage scale adjustment needed

    // Convert rotation to radians for calculations
    const rotation = ((shape.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    // Transform the drag delta to the shape's local coordinate system
    const localDeltaX = deltaX * cos + deltaY * sin;
    const localDeltaY = -deltaX * sin + deltaY * cos;

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

    const testShape = {
      ...shape,
      x: newCenterX,
      y: newCenterY,
      width: newWidth,
      height: newHeight,
    };

    const clientRect = getClientRect(
      testShape as {
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
      }
    );
    const isOut =
      clientRect.x < 0 ||
      clientRect.y < 0 ||
      clientRect.x + clientRect.width > window.innerWidth ||
      clientRect.y + clientRect.height > window.innerHeight;

    if (isOut) return;

    // update shape
    onShapeChange(shape.id, {
      x: newCenterX,
      y: newCenterY,
      width: newWidth,
      height: newHeight,
    });
  };

  const handleRotation = (shape: Shape, absoluteRotation: number) => {
    onShapeChange(shape.id, {
      rotation: absoluteRotation,
    });
  };

  const getShapeDimensions = (shape: Shape) => {
    if (shape.type === "rect") {
      const rectShape = shape as RectShape;
      return { width: rectShape.width, height: rectShape.height };
    } else if (shape.type === "circle") {
      const circleShape = shape as CircleShape;
      return { width: circleShape.width, height: circleShape.height };
    } else if (shape.type === "star") {
      const starShape = shape as StarShape;
      return { width: starShape.width, height: starShape.height };
    }
    return { width: 0, height: 0 };
  };

  if (!visible || selectedShapes.length === 0) {
    return null;
  }

  // For multiple selection, only show corner anchors via Konva transformer
  if (selectedShapes.length > 1) {
    {
      /* */
    }
    const getBoundingBox = () => {
      if (selectedShapes.length === 0)
        return { x: 0, y: 0, width: 0, height: 0, rotation: 0 };

      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      selectedShapes.forEach((shape) => {
        const { width, height } = getShapeDimensions(shape);
        const rotation = ((shape.rotation || 0) * Math.PI) / 180;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        const corners = [
          { x: -halfWidth, y: -halfHeight },
          { x: halfWidth, y: -halfHeight },
          { x: halfWidth, y: halfHeight },
          { x: -halfWidth, y: halfHeight },
        ];

        corners.forEach((corner) => {
          const rotatedX = corner.x * cos - corner.y * sin + shape.x;
          const rotatedY = corner.x * sin + corner.y * cos + shape.y;
          minX = Math.min(minX, rotatedX);
          minY = Math.min(minY, rotatedY);
          maxX = Math.max(maxX, rotatedX);
          maxY = Math.max(maxY, rotatedY);
        });
      });

      return {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
        width: maxX - minX,
        height: maxY - minY,
        rotation: 0,
      };
    };

    const boundBoxFunc = (oldBox: any, newBox: any) => {
      // Minimum dimensions
      const minWidth = 5;
      const minHeight = 5;

      if (
        Math.abs(newBox.width) < minWidth ||
        Math.abs(newBox.height) < minHeight
      ) {
        return oldBox;
      }

      // Optional: Check stage boundaries
      const stage = trRef.current?.getStage();
      if (stage) {
        const stageWidth = stage.width() / stageScale;
        const stageHeight = stage.height() / stageScale;

        if (
          newBox.x < 0 ||
          newBox.y < 0 ||
          newBox.x + newBox.width > stageWidth ||
          newBox.y + newBox.height > stageHeight
        ) {
          return oldBox;
        }
      }

      // DON'T update currentBoundingBox here - remove this entirely:
      // setCurrentBoundingBox({ ... });

      return newBox;
    };

    const boundingBox = getBoundingBox();

    const handleMultiSideAnchorDrag = (
      side: "top" | "bottom" | "left" | "right",
      deltaX: number,
      deltaY: number
    ) => {
      // Note: deltaX and deltaY are already in the correct coordinate system
      // from layer.getRelativePointerPosition(), so no stage scale adjustment needed

      // Calculate what the new bounding box would be
      let newBoundingBox = { ...boundingBox };

      switch (side) {
        case "top":
          newBoundingBox.height = Math.max(5, boundingBox.height - deltaY);
          newBoundingBox.y =
            boundingBox.y + (boundingBox.height - newBoundingBox.height) / 2;
          break;
        case "bottom":
          newBoundingBox.height = Math.max(5, boundingBox.height + deltaY);
          break;
        case "left":
          newBoundingBox.width = Math.max(5, boundingBox.width - deltaX);
          newBoundingBox.x =
            boundingBox.x + (boundingBox.width - newBoundingBox.width) / 2;
          break;
        case "right":
          newBoundingBox.width = Math.max(5, boundingBox.width + deltaX);
          break;
      }

      // Calculate scale factors based on the bounding box change
      const scaleX = newBoundingBox.width / boundingBox.width;
      const scaleY = newBoundingBox.height / boundingBox.height;

      // Check boundaries using Konva's approach
      const clientRect = getClientRect(newBoundingBox);
      const isOut =
        clientRect.x < 0 ||
        clientRect.y < 0 ||
        clientRect.x + clientRect.width > window.innerWidth ||
        clientRect.y + clientRect.height > window.innerHeight;

      if (isOut) return;

      selectedShapes.forEach((shape, index) => {
        const relativeX = (shape.x - boundingBox.x) / boundingBox.width;
        const relativeY = (shape.y - boundingBox.y) / boundingBox.height;

        const newX = newBoundingBox.x + relativeX * newBoundingBox.width;
        const newY = newBoundingBox.y + relativeY * newBoundingBox.height;

        const { width, height } = getShapeDimensions(shape);
        const newWidth = width * scaleX;
        const newHeight = height * scaleY;

        onShapeChange(shape.id, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      });
    };

    const handleMultiRotation = (absoluteRotation: number) => {
      const rotationDelta = absoluteRotation - (boundingBox.rotation || 0);

      selectedShapes.forEach((shape) => {
        // Rotate around the bounding box center
        const relativeX = shape.x - boundingBox.x;
        const relativeY = shape.y - boundingBox.y;

        const cos = Math.cos((rotationDelta * Math.PI) / 180);
        const sin = Math.sin((rotationDelta * Math.PI) / 180);

        const newX = boundingBox.x + (relativeX * cos - relativeY * sin);
        const newY = boundingBox.y + (relativeX * sin + relativeY * cos);

        onShapeChange(shape.id, {
          x: newX,
          y: newY,
          rotation: (shape.rotation || 0) + rotationDelta,
        });
      });
    };

    // Helper function to calculate anchor positions based on bounding box
    const calculateAnchorPositions = (bbox: typeof boundingBox) => {
      const rotation = ((bbox.rotation || 0) * Math.PI) / 180;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      const halfWidth = bbox.width / 2;
      const halfHeight = bbox.height / 2;

      return {
        topCenter: {
          x: bbox.x + (0 * cos - -halfHeight * sin),
          y: bbox.y + (0 * sin + -halfHeight * cos),
        },
        bottomCenter: {
          x: bbox.x + (0 * cos - halfHeight * sin),
          y: bbox.y + (0 * sin + halfHeight * cos),
        },
        leftCenter: {
          x: bbox.x + (-halfWidth * cos - 0 * sin),
          y: bbox.y + (-halfWidth * sin + 0 * cos),
        },
        rightCenter: {
          x: bbox.x + (halfWidth * cos - 0 * sin),
          y: bbox.y + (halfWidth * sin + 0 * cos),
        },
        topLeft: {
          x: bbox.x + (-halfWidth * cos - -halfHeight * sin),
          y: bbox.y + (-halfWidth * sin + -halfHeight * cos),
        },
        topRight: {
          x: bbox.x + (halfWidth * cos - -halfHeight * sin),
          y: bbox.y + (halfWidth * sin + -halfHeight * cos),
        },
        bottomLeft: {
          x: bbox.x + (-halfWidth * cos - halfHeight * sin),
          y: bbox.y + (-halfWidth * sin + halfHeight * cos),
        },
        bottomRight: {
          x: bbox.x + (halfWidth * cos - halfHeight * sin),
          y: bbox.y + (halfWidth * sin + halfHeight * cos),
        },
      };
    };

    // Calculate anchor positions for bounding box
    const anchorPositions = calculateAnchorPositions(boundingBox);
    const anchorThickness = 30 / stageScale;

    {
      /* Multiple Shape Transform End 

    const handleMultiTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
      const nodes = selectedNodes;
      const transformer = trRef.current;
      if (!nodes || !transformer) return;

      console.log("nodes", nodes);
      console.log("selectedShapes", selectedShapes);

      // For multiple node transforms, Konva applies the same scale to all nodes
      // Get the scale from the transformer's bounding box change
      const scaleX = nodes[0].scaleX(); // All nodes should have the same scale
      const scaleY = nodes[0].scaleY();

      console.log("Unified scale - scaleX:", scaleX, "scaleY:", scaleY);

      nodes.forEach((node, index) => {
        console.log(`Processing Node ${index}`);

        // Reset scaling on the node so we can work with explicit width/height
        node.scaleX(1);
        node.scaleY(1);

        // New explicit dimensions - use the loop index to match with selectedShapes
        const newWidth = Math.max(
          50,
          selectedShapes[index].width * Math.abs(scaleX)
        );
        const newHeight = Math.max(
          50,
          selectedShapes[index].height * Math.abs(scaleY)
        );

        // Get the layer for this shape to convert coordinates properly
        const shapeLayer = getShapeLayer(selectedShapes[index].id);
        if (!shapeLayer) return;

        // node.x() and node.y() are relative to the layer, convert to world coordinates
        const newX = node.x() + shapeLayer.x;
        const newY = node.y() + shapeLayer.y;

        console.log("newWidth", newWidth);
        console.log("newHeight", newHeight);

        console.log("selectedShapes[index]", selectedShapes[index]);

        // Update the shape props
        onShapeChange(selectedShapes[index].id, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      });
    };

    */
    }

    return (
      <React.Fragment>
        <Transformer
          ref={trRef}
          flipEnabled={false}
          padding={0}
          ignoreStroke={true}
          rotateEnabled={false}
          borderStroke="#29A9FF"
          borderStrokeWidth={1}
          anchorStroke="#29A9FF"
          anchorFill="white"
          anchorStrokeWidth={1}
          anchorSize={8}
          anchorCornerRadius={2}
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-right",
            "bottom-left",
          ]}
          onTransformEnd={(e) => {
            handleMultipleTransformEnd(e as Konva.KonvaEventObject<MouseEvent>);
          }}
        />

        {/* Custom Side Anchors */}
        <Group
          x={anchorPositions.topCenter.x}
          y={anchorPositions.topCenter.y}
          rotation={boundingBox.rotation || 0}
          offsetX={boundingBox.width / 2}
          offsetY={anchorThickness / 2}
        >
          <SideAnchor
            x={7}
            y={0}
            width={boundingBox.width - 15}
            height={anchorThickness}
            side="top"
            rotation={boundingBox.rotation || 0}
            onDrag={(deltaX, deltaY) =>
              handleMultiSideAnchorDrag("top", deltaX, deltaY)
            }
            visible={true}
          />
        </Group>

        <Group
          x={anchorPositions.bottomCenter.x}
          y={anchorPositions.bottomCenter.y}
          rotation={boundingBox.rotation || 0}
          offsetX={boundingBox.width / 2}
          offsetY={anchorThickness / 2}
        >
          <SideAnchor
            x={7}
            y={0}
            width={boundingBox.width - 15}
            height={anchorThickness}
            side="bottom"
            rotation={boundingBox.rotation || 0}
            onDrag={(deltaX, deltaY) =>
              handleMultiSideAnchorDrag("bottom", deltaX, deltaY)
            }
            visible={true}
          />
        </Group>

        <Group
          x={anchorPositions.leftCenter.x}
          y={anchorPositions.leftCenter.y}
          rotation={boundingBox.rotation || 0}
          offsetX={anchorThickness / 2}
          offsetY={boundingBox.height / 2}
        >
          <SideAnchor
            x={0}
            y={7}
            width={anchorThickness}
            height={boundingBox.height - 15}
            side="left"
            rotation={boundingBox.rotation || 0}
            onDrag={(deltaX, deltaY) =>
              handleMultiSideAnchorDrag("left", deltaX, deltaY)
            }
            visible={true}
          />
        </Group>

        <Group
          x={anchorPositions.rightCenter.x}
          y={anchorPositions.rightCenter.y}
          rotation={boundingBox.rotation || 0}
          offsetX={anchorThickness / 2}
          offsetY={boundingBox.height / 2}
        >
          <SideAnchor
            x={0}
            y={7}
            width={anchorThickness}
            height={boundingBox.height - 15}
            side="right"
            rotation={boundingBox.rotation || 0}
            onDrag={(deltaX, deltaY) =>
              handleMultiSideAnchorDrag("right", deltaX, deltaY)
            }
            visible={true}
          />
        </Group>

        {/* Custom Rotation Anchors for Multiple Selection */}
        <RotationAnchor
          x={anchorPositions.topLeft.x}
          y={anchorPositions.topLeft.y}
          corner="top-left"
          groupCenterX={boundingBox.x}
          groupCenterY={boundingBox.y}
          onRotate={(angle) => handleMultiRotation(angle)}
          visible={true}
          stageScale={stageScale}
          currentRotation={boundingBox.rotation || 0}
        />

        <RotationAnchor
          x={anchorPositions.topRight.x}
          y={anchorPositions.topRight.y}
          corner="top-right"
          groupCenterX={boundingBox.x}
          groupCenterY={boundingBox.y}
          onRotate={(angle) => handleMultiRotation(angle)}
          visible={true}
          stageScale={stageScale}
          currentRotation={boundingBox.rotation || 0}
        />

        <RotationAnchor
          x={anchorPositions.bottomLeft.x}
          y={anchorPositions.bottomLeft.y}
          corner="bottom-left"
          groupCenterX={boundingBox.x}
          groupCenterY={boundingBox.y}
          onRotate={(angle) => handleMultiRotation(angle)}
          visible={true}
          stageScale={stageScale}
          currentRotation={boundingBox.rotation || 0}
        />

        <RotationAnchor
          x={anchorPositions.bottomRight.x}
          y={anchorPositions.bottomRight.y}
          corner="bottom-right"
          groupCenterX={boundingBox.x}
          groupCenterY={boundingBox.y}
          onRotate={(angle) => handleMultiRotation(angle)}
          visible={true}
          stageScale={stageScale}
          currentRotation={boundingBox.rotation || 0}
        />
      </React.Fragment>
    );
  }

  if (selectedShapes.length === 1) {
    const shape = selectedShapes[0];
    const { width, height } = getShapeDimensions(shape);

    // Calc rotated anchor positions
    const rotation = ((shape.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    const anchorThickness = 20 / stageScale;

    const topCenterX = shape.x + (0 * cos - -halfHeight * sin);
    const topCenterY = shape.y + (0 * sin + -halfHeight * cos);

    const bottomCenterX = shape.x + (0 * cos - halfHeight * sin);
    const bottomCenterY = shape.y + (0 * sin + halfHeight * cos);

    const leftCenterX = shape.x + (-halfWidth * cos - 0 * sin);
    const leftCenterY = shape.y + (-halfWidth * sin + 0 * cos);

    const rightCenterX = shape.x + (halfWidth * cos - 0 * sin);
    const rightCenterY = shape.y + (halfWidth * sin + 0 * cos);

    const topLeftX = shape.x + (-halfWidth * cos - -halfHeight * sin);
    const topLeftY = shape.y + (-halfWidth * sin + -halfHeight * cos);

    const topRightX = shape.x + (halfWidth * cos - -halfHeight * sin);
    const topRightY = shape.y + (halfWidth * sin + -halfHeight * cos);

    const bottomLeftX = shape.x + (-halfWidth * cos - halfHeight * sin);
    const bottomLeftY = shape.y + (-halfWidth * sin + halfHeight * cos);

    const bottomRightX = shape.x + (halfWidth * cos - halfHeight * sin);
    const bottomRightY = shape.y + (halfWidth * sin + halfHeight * cos);

    return (
      <React.Fragment>
        <Transformer
          ref={trRef}
          flipEnabled={false}
          padding={0}
          ignoreStroke={true}
          rotateEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
          borderStroke="#29A9FF"
          borderStrokeWidth={1}
          anchorStroke="#29A9FF"
          anchorFill="white"
          anchorStrokeWidth={1}
          anchorSize={8}
          anchorCornerRadius={0}
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-right",
            "bottom-left",
          ]}
        />

        {/* Custom Side Anchors */}
        <Group
          x={topCenterX}
          y={topCenterY}
          rotation={shape.rotation || 0}
          offsetX={width / 2}
          offsetY={anchorThickness / 2}
        >
          <SideAnchor
            x={7}
            y={0}
            width={width - 15}
            height={anchorThickness}
            side="top"
            rotation={shape.rotation || 0}
            onDrag={(deltaX, deltaY) =>
              handleSideAnchorDrag(shape, "top", deltaX, deltaY)
            }
            visible={true}
          />
        </Group>

        <Group
          x={bottomCenterX}
          y={bottomCenterY}
          rotation={shape.rotation || 0}
          offsetX={width / 2}
          offsetY={anchorThickness / 2}
        >
          <SideAnchor
            x={7}
            y={0}
            width={width - 15}
            height={anchorThickness}
            side="bottom"
            rotation={shape.rotation || 0}
            onDrag={(deltaX, deltaY) =>
              handleSideAnchorDrag(shape, "bottom", deltaX, deltaY)
            }
            visible={true}
          />
        </Group>

        <Group
          x={leftCenterX}
          y={leftCenterY}
          rotation={shape.rotation || 0}
          offsetX={anchorThickness / 2}
          offsetY={height / 2}
        >
          <SideAnchor
            x={0}
            y={7}
            width={anchorThickness}
            height={height - 15}
            side="left"
            rotation={shape.rotation || 0}
            onDrag={(deltaX, deltaY) =>
              handleSideAnchorDrag(shape, "left", deltaX, deltaY)
            }
            visible={true}
          />
        </Group>

        <Group
          x={rightCenterX}
          y={rightCenterY}
          rotation={shape.rotation || 0}
          offsetX={anchorThickness / 2}
          offsetY={height / 2}
        >
          <SideAnchor
            x={0}
            y={7}
            width={anchorThickness}
            height={height - 15}
            side="right"
            rotation={shape.rotation || 0}
            onDrag={(deltaX, deltaY) =>
              handleSideAnchorDrag(shape, "right", deltaX, deltaY)
            }
            visible={true}
          />
        </Group>

        {/* Custom Rotation Anchors */}
        <RotationAnchor
          x={topLeftX}
          y={topLeftY}
          corner="top-left"
          groupCenterX={shape.x}
          groupCenterY={shape.y}
          onRotate={(angle) => handleRotation(shape, angle)}
          visible={true}
          stageScale={stageScale}
          currentRotation={shape.rotation || 0}
        />

        <RotationAnchor
          x={topRightX}
          y={topRightY}
          corner="top-right"
          groupCenterX={shape.x}
          groupCenterY={shape.y}
          onRotate={(angle) => handleRotation(shape, angle)}
          visible={true}
          stageScale={stageScale}
          currentRotation={shape.rotation || 0}
        />

        <RotationAnchor
          x={bottomLeftX}
          y={bottomLeftY}
          corner="bottom-left"
          groupCenterX={shape.x}
          groupCenterY={shape.y}
          onRotate={(angle) => handleRotation(shape, angle)}
          visible={true}
          stageScale={stageScale}
          currentRotation={shape.rotation || 0}
        />

        <RotationAnchor
          x={bottomRightX}
          y={bottomRightY}
          corner="bottom-right"
          groupCenterX={shape.x}
          groupCenterY={shape.y}
          onRotate={(angle) => handleRotation(shape, angle)}
          visible={true}
          stageScale={stageScale}
          currentRotation={shape.rotation || 0}
        />
      </React.Fragment>
    );
  }
}
