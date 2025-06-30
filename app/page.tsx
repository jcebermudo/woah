"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Rect,
  Ellipse,
  Star,
  Transformer,
  Text,
  Group,
} from "react-konva";
import Konva from "konva";
import {
  Circle,
  Download,
  Frame,
  Image,
  Square,
  Star as StarIcon,
  Type,
  ChevronDown,
  ChevronRight,
  Layers,
  Eye,
  EyeOff,
} from "lucide-react";

// Define shape interfaces
interface BaseShape {
  id: string;
  x: number;
  y: number;
  fill: string;
  draggable: boolean;
  rotation?: number;
}

interface RectShape extends BaseShape {
  type: "rect";
  width: number;
  height: number;
}

interface CircleShape extends BaseShape {
  type: "circle";
  width: number;
  height: number;
}

interface StarShape extends BaseShape {
  type: "star";
  width: number;
  height: number;
  numPoints: number;
  innerRadius: number;
  outerRadius: number;
}

// Define layer interface (renamed from GroupContainer)
interface LayerContainer extends BaseShape {
  type: "layer";
  width: number;
  height: number;
  fill: string;
  children: string[]; // Array of shape IDs contained in this layer
  showBorder: boolean;
}

type Shape = RectShape | CircleShape | StarShape;
type Container = LayerContainer;
type CanvasElement = Shape | Container;

interface ShapeComponentProps {
  shapeProps: Shape;
  isSelected: boolean;
  isHovered: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Shape) => void;
  onHover: (hovered: boolean) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  stageScale: number;
  worldX: number;
  worldY: number;
}

interface LayerComponentProps {
  layerProps: LayerContainer;
  isSelected: boolean;
  isHovered: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onChange: (newAttrs: LayerContainer) => void;
  onHover: (hovered: boolean) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  children: React.ReactNode;
  stageScale: number;
}

// Custom Side Anchor Component
interface SideAnchorProps {
  x: number;
  y: number;
  width: number;
  height: number;
  side: "top" | "bottom" | "left" | "right";
  onDrag: (deltaX: number, deltaY: number) => void;
  visible: boolean;
  rotation?: number;
}

// Custom Rotation Anchor Component
interface RotationAnchorProps {
  x: number;
  y: number;
  corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  groupCenterX: number;
  groupCenterY: number;
  onRotate: (angle: number) => void;
  visible: boolean;
  stageScale: number;
  currentRotation: number;
}

const SideAnchor: React.FC<SideAnchorProps> = ({
  x,
  y,
  width,
  height,
  side,
  onDrag,
  visible,
  rotation = 0,
}) => {
  const dragStartPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  if (!visible) return null;

  const getCursor = () => {
    // For perpendicular cursors, we need the perpendicular direction to the edge
    const rotationRad = (rotation * Math.PI) / 180;

    // Calculate the perpendicular direction to the edge (resize direction)
    let perpAngle = 0;
    switch (side) {
      case "top":
      case "bottom":
        // For horizontal edges, perpendicular direction is vertical (rotated)
        perpAngle = rotationRad + Math.PI / 2; // 90 degrees from edge direction
        break;
      case "left":
      case "right":
        // For vertical edges, perpendicular direction is horizontal (rotated)
        perpAngle = rotationRad; // Same as rotation for horizontal direction
        break;
    }

    // Normalize angle to 0-π range (we only need direction, not orientation)
    perpAngle = ((perpAngle % Math.PI) + Math.PI) % Math.PI;

    // Convert to degrees for cursor selection
    const perpDegrees = (perpAngle * 180) / Math.PI;

    // Map angle to appropriate cursor with 4 directions (each covers 45° range)
    // The cursor should indicate the resize direction (perpendicular to edge)
    if (perpDegrees < 22.5 || perpDegrees >= 157.5) {
      return "ew-resize"; // Horizontal resize
    } else if (perpDegrees >= 22.5 && perpDegrees < 67.5) {
      return "nwse-resize"; // Diagonal ↖↘ resize
    } else if (perpDegrees >= 67.5 && perpDegrees < 112.5) {
      return "ns-resize"; // Vertical resize
    } else {
      return "nesw-resize"; // Diagonal ↗↙ resize
    }
  };

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="transparent"
      stroke="transparent"
      draggable
      onMouseEnter={() => {
        if (!isDragging.current) {
          document.body.style.cursor = getCursor();
        }
      }}
      onMouseLeave={() => {
        if (!isDragging.current) {
          document.body.style.cursor = "default";
        }
      }}
      onDragStart={(e) => {
        isDragging.current = true;
        document.body.style.cursor = getCursor();
        const layer = e.target.getLayer();
        const pos = layer?.getRelativePointerPosition();
        if (pos) {
          dragStartPos.current = { x: pos.x, y: pos.y };
        }
      }}
      onDragMove={(e) => {
        document.body.style.cursor = getCursor();
        const layer = e.target.getLayer();
        const pos = layer?.getRelativePointerPosition();
        if (pos) {
          const deltaX = pos.x - dragStartPos.current.x;
          const deltaY = pos.y - dragStartPos.current.y;
          onDrag(deltaX, deltaY);
          dragStartPos.current = { x: pos.x, y: pos.y };

          // Reset anchor position to prevent it from moving
          e.target.x(x);
          e.target.y(y);
        }
      }}
      onDragEnd={() => {
        isDragging.current = false;
        document.body.style.cursor = "default";
      }}
    />
  );
};

const RotationAnchor: React.FC<RotationAnchorProps> = ({
  x,
  y,
  corner,
  groupCenterX,
  groupCenterY,
  onRotate,
  visible,
  stageScale,
  currentRotation,
}) => {
  const isDragging = useRef(false);
  const startAngle = useRef(0);
  const initialRotation = useRef(0);

  if (!visible) return null;

  const getOffset = (stageScale: number) => {
    // Position rotation anchors just next to the corner anchors
    const baseOffset = 12; // Small offset to place next to corner anchor
    const offset = baseOffset / stageScale; // Adjust for zoom level

    switch (corner) {
      case "top-left":
        return { x: x - offset, y: y }; // Left of top-left corner
      case "top-right":
        return { x: x + offset, y: y }; // Right of top-right corner
      case "bottom-left":
        return { x: x, y: y + offset }; // Below bottom-left corner
      case "bottom-right":
        return { x: x, y: y + offset }; // Below bottom-right corner
      default:
        return { x, y };
    }
  };

  const offsetPos = getOffset(stageScale);

  // Larger scale-adjusted radius for easier targeting
  const anchorRadius = Math.max(12, 24 / stageScale);

  return (
    <Ellipse
      x={offsetPos.x}
      y={offsetPos.y}
      radiusX={anchorRadius}
      radiusY={anchorRadius}
      fill="transparent"
      stroke="transparent"
      draggable
      onMouseEnter={() => {
        document.body.style.cursor = "crosshair";
      }}
      onMouseLeave={() => {
        if (!isDragging.current) {
          document.body.style.cursor = "default";
        }
      }}
      onDragStart={(e) => {
        isDragging.current = true;
        document.body.style.cursor = "crosshair";

        // Store the initial angle and rotation when drag starts
        const layer = e.target.getLayer();
        const pos = layer?.getRelativePointerPosition();
        if (pos) {
          startAngle.current = Math.atan2(
            pos.y - groupCenterY,
            pos.x - groupCenterX
          );
          initialRotation.current = currentRotation; // Use the current rotation from props
        }
      }}
      onDragMove={(e) => {
        const layer = e.target.getLayer();
        const pos = layer?.getRelativePointerPosition();
        if (pos) {
          // Calculate current angle
          const currentAngle = Math.atan2(
            pos.y - groupCenterY,
            pos.x - groupCenterX
          );

          // Calculate the difference from start angle
          let deltaAngle = currentAngle - startAngle.current;

          // Normalize angle difference to prevent jumps at boundaries
          if (deltaAngle > Math.PI) {
            deltaAngle -= 2 * Math.PI;
          } else if (deltaAngle < -Math.PI) {
            deltaAngle += 2 * Math.PI;
          }

          // Convert to degrees and add to initial rotation
          const deltaRotationDegrees = (deltaAngle * 180) / Math.PI;
          const newRotation = initialRotation.current + deltaRotationDegrees;

          onRotate(newRotation);

          // Reset anchor position to prevent it from moving
          e.target.x(offsetPos.x);
          e.target.y(offsetPos.y);
        }
      }}
      onDragEnd={() => {
        isDragging.current = false;
        document.body.style.cursor = "default";
      }}
    />
  );
};

// Layer Component for containers
const LayerComponent: React.FC<LayerComponentProps> = ({
  layerProps,
  isSelected,
  isHovered,
  isDragging,
  onSelect,
  onChange,
  onHover,
  onDragStart,
  onDragEnd,
  children,
  stageScale,
}) => {
  const rectRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if ((isSelected || isDragging) && trRef.current && rectRef.current) {
      // Attach transformer manually
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isDragging]);

  const handleMouseEnter = () => {
    onHover(true);
    document.body.style.cursor = "pointer";
  };

  const handleMouseLeave = () => {
    onHover(false);
    document.body.style.cursor = "default";
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = rectRef.current;
    const transformer = trRef.current;
    if (!node || !transformer) return;

    // Scale that was just applied by Konva
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scaling on the node so we can work with explicit width/height
    node.scaleX(1);
    node.scaleY(1);

    // New explicit dimensions
    const newWidth = Math.max(50, layerProps.width * Math.abs(scaleX));
    const newHeight = Math.max(50, layerProps.height * Math.abs(scaleY));

    // Update the layer props
    onChange({
      ...layerProps,
      x: node.x(),
      y: node.y(),
      width: newWidth,
      height: newHeight,
      rotation: node.rotation(),
    });
  };

  const handleSideAnchorDrag = (
    side: "top" | "bottom" | "left" | "right",
    deltaX: number,
    deltaY: number,
    stageScale: number
  ) => {
    // Adjust deltas for stage scale to fix zoom sensitivity
    const adjustedDeltaX = deltaX / stageScale;
    const adjustedDeltaY = deltaY / stageScale;

    // Convert rotation to radians for calculations
    const rotation = ((layerProps.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    // Transform the drag delta to the layer's local coordinate system
    const localDeltaX = adjustedDeltaX * cos + adjustedDeltaY * sin;
    const localDeltaY = -adjustedDeltaX * sin + adjustedDeltaY * cos;

    // Calculate current center and half dimensions
    const centerX = layerProps.x;
    const centerY = layerProps.y;
    const halfWidth = layerProps.width / 2;
    const halfHeight = layerProps.height / 2;

    // Calculate the position of the fixed edge (opposite to the one being dragged)
    let fixedEdgeCenterX = centerX;
    let fixedEdgeCenterY = centerY;
    let newWidth = layerProps.width;
    let newHeight = layerProps.height;

    switch (side) {
      case "top":
        fixedEdgeCenterX = centerX + (0 * cos - halfHeight * sin);
        fixedEdgeCenterY = centerY + (0 * sin + halfHeight * cos);
        newHeight = Math.max(50, layerProps.height - localDeltaY);
        break;
      case "bottom":
        fixedEdgeCenterX = centerX + (0 * cos - -halfHeight * sin);
        fixedEdgeCenterY = centerY + (0 * sin + -halfHeight * cos);
        newHeight = Math.max(50, layerProps.height + localDeltaY);
        break;
      case "left":
        fixedEdgeCenterX = centerX + (halfWidth * cos - 0 * sin);
        fixedEdgeCenterY = centerY + (halfWidth * sin + 0 * cos);
        newWidth = Math.max(50, layerProps.width - localDeltaX);
        break;
      case "right":
        fixedEdgeCenterX = centerX + (-halfWidth * cos - 0 * sin);
        fixedEdgeCenterY = centerY + (-halfWidth * sin + 0 * cos);
        newWidth = Math.max(50, layerProps.width + localDeltaX);
        break;
    }

    // Calculate where the new center should be to keep the fixed edge in place
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

    onChange({
      ...layerProps,
      x: newCenterX,
      y: newCenterY,
      width: newWidth,
      height: newHeight,
    });
  };

  const handleRotation = (absoluteRotation: number) => {
    onChange({
      ...layerProps,
      rotation: absoluteRotation,
    });
  };

  return (
    <Layer draggable={true} width={layerProps.width} height={layerProps.height}>
      {/* Background rectangle to make layer visible */}
      <Rect
        ref={rectRef}
        x={layerProps.x}
        y={layerProps.y}
        width={layerProps.width}
        height={layerProps.height}
        offsetX={layerProps.width / 2}
        offsetY={layerProps.height / 2}
        rotation={layerProps.rotation || 0}
        fill="white"
        strokeScaleEnabled={false}
        stroke={
          isSelected || isHovered
            ? "#29A9FF"
            : layerProps.showBorder
            ? "#29A9FF"
            : "transparent"
        }
        strokeWidth={
          isSelected || isHovered ? 2 : layerProps.showBorder ? 1 : 0
        }
        dash={
          layerProps.showBorder && !isSelected && !isHovered
            ? [3, 3]
            : undefined
        }
        draggable={false}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onDragStart}
        onDragEnd={(e) => {
          onChange({
            ...layerProps,
            x: e.target.x(),
            y: e.target.y(),
          });
          onSelect();
          onDragEnd();
        }}
        onTransformEnd={handleTransformEnd}
      />

      {/* Children shapes now rendered inside a group so they inherit the layer's position and rotation */}
      <Group
        x={layerProps.x}
        y={layerProps.y}
        clip={{
          x: -layerProps.width / 2,
          y: -layerProps.height / 2,
          width: layerProps.width,
          height: layerProps.height,
        }}
      >
        {children}
      </Group>

      {/* Custom Side Anchors */}
      {isSelected && (
        <React.Fragment>
          {(() => {
            // Calculate rotated side anchor positions
            const rotation = ((layerProps.rotation || 0) * Math.PI) / 180;
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);
            const halfWidth = layerProps.width / 2;
            const halfHeight = layerProps.height / 2;

            // Calculate anchor strip thickness
            const anchorThickness = 20 / stageScale;

            // Calculate rotated positions for each side anchor
            const topCenterX = layerProps.x + (0 * cos - -halfHeight * sin);
            const topCenterY = layerProps.y + (0 * sin + -halfHeight * cos);

            const bottomCenterX = layerProps.x + (0 * cos - halfHeight * sin);
            const bottomCenterY = layerProps.y + (0 * sin + halfHeight * cos);

            const leftCenterX = layerProps.x + (-halfWidth * cos - 0 * sin);
            const leftCenterY = layerProps.y + (-halfWidth * sin + 0 * cos);

            const rightCenterX = layerProps.x + (halfWidth * cos - 0 * sin);
            const rightCenterY = layerProps.y + (halfWidth * sin + 0 * cos);

            return (
              <>
                {/* Top anchor */}
                <Group
                  x={topCenterX}
                  y={topCenterY}
                  rotation={layerProps.rotation || 0}
                  offsetX={layerProps.width / 2}
                  offsetY={anchorThickness / 2}
                >
                  <SideAnchor
                    x={0}
                    y={0}
                    width={layerProps.width}
                    height={anchorThickness}
                    side="top"
                    rotation={layerProps.rotation || 0}
                    onDrag={(deltaX, deltaY) =>
                      handleSideAnchorDrag("top", deltaX, deltaY, stageScale)
                    }
                    visible={true}
                  />
                </Group>

                {/* Bottom anchor */}
                <Group
                  x={bottomCenterX}
                  y={bottomCenterY}
                  rotation={layerProps.rotation || 0}
                  offsetX={layerProps.width / 2}
                  offsetY={anchorThickness / 2}
                >
                  <SideAnchor
                    x={0}
                    y={0}
                    width={layerProps.width}
                    height={anchorThickness}
                    side="bottom"
                    rotation={layerProps.rotation || 0}
                    onDrag={(deltaX, deltaY) =>
                      handleSideAnchorDrag("bottom", deltaX, deltaY, stageScale)
                    }
                    visible={true}
                  />
                </Group>

                {/* Left anchor */}
                <Group
                  x={leftCenterX}
                  y={leftCenterY}
                  rotation={layerProps.rotation || 0}
                  offsetX={anchorThickness / 2}
                  offsetY={layerProps.height / 2}
                >
                  <SideAnchor
                    x={0}
                    y={0}
                    width={anchorThickness}
                    height={layerProps.height}
                    side="left"
                    rotation={layerProps.rotation || 0}
                    onDrag={(deltaX, deltaY) =>
                      handleSideAnchorDrag("left", deltaX, deltaY, stageScale)
                    }
                    visible={true}
                  />
                </Group>

                {/* Right anchor */}
                <Group
                  x={rightCenterX}
                  y={rightCenterY}
                  rotation={layerProps.rotation || 0}
                  offsetX={anchorThickness / 2}
                  offsetY={layerProps.height / 2}
                >
                  <SideAnchor
                    x={0}
                    y={0}
                    width={anchorThickness}
                    height={layerProps.height}
                    side="right"
                    rotation={layerProps.rotation || 0}
                    onDrag={(deltaX, deltaY) =>
                      handleSideAnchorDrag("right", deltaX, deltaY, stageScale)
                    }
                    visible={true}
                  />
                </Group>
              </>
            );
          })()}
        </React.Fragment>
      )}

      {/* Corner anchors with transformer for corner resizing */}
      {(isSelected || isDragging) && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          centeredScaling={false}
          padding={0}
          ignoreStroke={true}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to minimum size
            if (Math.abs(newBox.width) < 50 || Math.abs(newBox.height) < 50) {
              return oldBox;
            }
            return newBox;
          }}
          // Figma-like styling
          borderStroke="#29A9FF"
          borderStrokeWidth={2}
          anchorStroke="#29A9FF"
          anchorFill="white"
          anchorStrokeWidth={1}
          anchorSize={isDragging && !isSelected ? 6 : 8}
          anchorCornerRadius={1}
          rotateEnabled={false}
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-right",
            "bottom-left",
          ]}
        />
      )}
    </Layer>
  );
};

// Generic Shape Component that handles all shape types
const ShapeComponent: React.FC<ShapeComponentProps> = ({
  shapeProps,
  isSelected,
  isHovered,
  isDragging,
  onSelect,
  onChange,
  onHover,
  onDragStart,
  onDragEnd,
  stageScale,
  worldX,
  worldY,
}) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if ((isSelected || isDragging) && trRef.current && shapeRef.current) {
      // Attach transformer manually
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isDragging]);

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragStart();
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({
      ...shapeProps,
      x: e.target.x(),
      y: e.target.y(),
    });

    // Auto-select the shape after dragging (Figma-like behavior)
    onSelect();
    onDragEnd();
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1
    node.scaleX(1);
    node.scaleY(1);

    // Update shape based on type
    let updatedShape: Shape;

    if (shapeProps.type === "rect") {
      updatedShape = {
        ...shapeProps,
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        rotation: node.rotation(),
      } as RectShape;
    } else if (shapeProps.type === "circle") {
      const circleShape = shapeProps as CircleShape;
      updatedShape = {
        ...shapeProps,
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        rotation: node.rotation(),
      } as CircleShape;
    } else if (shapeProps.type === "star") {
      const starShape = shapeProps as StarShape;
      updatedShape = {
        ...shapeProps,
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        rotation: node.rotation(),
      } as StarShape;
    } else {
      updatedShape = shapeProps;
    }

    onChange(updatedShape);
  };

  const handleMouseEnter = () => {
    onHover(true);
    document.body.style.cursor = "pointer";
  };

  const handleMouseLeave = () => {
    onHover(false);
    document.body.style.cursor = "default";
  };

  // Determine stroke based on state
  const getStroke = () => {
    if (isSelected) return "#29A9FF";
    if (isHovered || isDragging) return "#29A9FF";
    return "transparent";
  };

  const getStrokeWidth = () => {
    if (isSelected) return 2;
    if (isHovered) return 1.5;
    if (isDragging) return 2;
    return 0;
  };

  const getDash = () => {
    return undefined;
  };

  const handleSideAnchorDrag = (
    side: "top" | "bottom" | "left" | "right",
    deltaX: number,
    deltaY: number
  ) => {
    // Adjust deltas for stage scale to fix zoom sensitivity
    const adjustedDeltaX = deltaX / stageScale;
    const adjustedDeltaY = deltaY / stageScale;

    // Convert rotation to radians for calculations
    const rotation = ((shapeProps.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    // Transform the drag delta to the shape's local coordinate system
    const localDeltaX = adjustedDeltaX * cos + adjustedDeltaY * sin;
    const localDeltaY = -adjustedDeltaX * sin + adjustedDeltaY * cos;

    // Get shape dimensions
    let width = 0;
    let height = 0;

    if (shapeProps.type === "rect") {
      const rectShape = shapeProps as RectShape;
      width = rectShape.width;
      height = rectShape.height;
    } else if (shapeProps.type === "circle") {
      const circleShape = shapeProps as CircleShape;
      width = circleShape.width;
      height = circleShape.height;
    } else if (shapeProps.type === "star") {
      const starShape = shapeProps as StarShape;
      width = starShape.width;
      height = starShape.height;
    }

    // Calculate current center and half dimensions
    const centerX = shapeProps.x;
    const centerY = shapeProps.y;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Calculate the position of the fixed edge (opposite to the one being dragged)
    let fixedEdgeCenterX = centerX;
    let fixedEdgeCenterY = centerY;
    let newWidth = width;
    let newHeight = height;

    switch (side) {
      case "top":
        // Dragging top edge, so keep bottom edge fixed
        fixedEdgeCenterX = centerX + (0 * cos - halfHeight * sin);
        fixedEdgeCenterY = centerY + (0 * sin + halfHeight * cos);
        // Calculate new height based on local movement (negative because top edge moves up to reduce height)
        newHeight = Math.max(5, height - localDeltaY);
        break;
      case "bottom":
        // Dragging bottom edge, so keep top edge fixed
        fixedEdgeCenterX = centerX + (0 * cos - -halfHeight * sin);
        fixedEdgeCenterY = centerY + (0 * sin + -halfHeight * cos);
        // Calculate new height based on local movement
        newHeight = Math.max(5, height + localDeltaY);
        break;
      case "left":
        // Dragging left edge, so keep right edge fixed
        fixedEdgeCenterX = centerX + (halfWidth * cos - 0 * sin);
        fixedEdgeCenterY = centerY + (halfWidth * sin + 0 * cos);
        // Calculate new width based on local movement (negative because left edge moves left to increase width)
        newWidth = Math.max(5, width - localDeltaX);
        break;
      case "right":
        // Dragging right edge, so keep left edge fixed
        fixedEdgeCenterX = centerX + (-halfWidth * cos - 0 * sin);
        fixedEdgeCenterY = centerY + (-halfWidth * sin + 0 * cos);
        // Calculate new width based on local movement
        newWidth = Math.max(5, width + localDeltaX);
        break;
    }

    // Calculate where the new center should be to keep the fixed edge (opposite edge) in place
    const newHalfWidth = newWidth / 2;
    const newHalfHeight = newHeight / 2;

    let newCenterX = centerX;
    let newCenterY = centerY;

    switch (side) {
      case "top":
        // Keep bottom edge center fixed, calculate new center position
        newCenterX = fixedEdgeCenterX - (0 * cos - newHalfHeight * sin);
        newCenterY = fixedEdgeCenterY - (0 * sin + newHalfHeight * cos);
        break;
      case "bottom":
        // Keep top edge center fixed, calculate new center position
        newCenterX = fixedEdgeCenterX - (0 * cos - -newHalfHeight * sin);
        newCenterY = fixedEdgeCenterY - (0 * sin + -newHalfHeight * cos);
        break;
      case "left":
        // Keep right edge center fixed, calculate new center position
        newCenterX = fixedEdgeCenterX - (newHalfWidth * cos - 0 * sin);
        newCenterY = fixedEdgeCenterY - (newHalfWidth * sin + 0 * cos);
        break;
      case "right":
        // Keep left edge center fixed, calculate new center position
        newCenterX = fixedEdgeCenterX - (-newHalfWidth * cos - 0 * sin);
        newCenterY = fixedEdgeCenterY - (-newHalfWidth * sin + 0 * cos);
        break;
    }

    // Create updated shape based on type
    let updatedShape: Shape;

    if (shapeProps.type === "rect") {
      updatedShape = {
        ...shapeProps,
        x: newCenterX,
        y: newCenterY,
        width: newWidth,
        height: newHeight,
      } as RectShape;
    } else if (shapeProps.type === "circle") {
      updatedShape = {
        ...shapeProps,
        x: newCenterX,
        y: newCenterY,
        width: newWidth,
        height: newHeight,
      } as CircleShape;
    } else if (shapeProps.type === "star") {
      updatedShape = {
        ...shapeProps,
        x: newCenterX,
        y: newCenterY,
        width: newWidth,
        height: newHeight,
      } as StarShape;
    } else {
      updatedShape = shapeProps;
    }

    onChange(updatedShape);
  };

  const handleRotation = (absoluteRotation: number) => {
    // Create updated shape based on type
    let updatedShape: Shape;

    if (shapeProps.type === "rect") {
      updatedShape = {
        ...shapeProps,
        rotation: absoluteRotation,
      } as RectShape;
    } else if (shapeProps.type === "circle") {
      updatedShape = {
        ...shapeProps,
        rotation: absoluteRotation,
      } as CircleShape;
    } else if (shapeProps.type === "star") {
      updatedShape = {
        ...shapeProps,
        rotation: absoluteRotation,
      } as StarShape;
    } else {
      updatedShape = shapeProps;
    }

    onChange(updatedShape);
  };

  const renderShape = () => {
    const commonProps = {
      onClick: onSelect,
      onTap: onSelect,
      ref: shapeRef,
      x: shapeProps.x,
      y: shapeProps.y,
      fill: shapeProps.fill,
      draggable: shapeProps.draggable,
      rotation: shapeProps.rotation || 0,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onTransformEnd: handleTransformEnd,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      stroke: getStroke(),
      strokeWidth: getStrokeWidth(),
      dash: getDash(),
    };

    switch (shapeProps.type) {
      case "rect":
        const rectShape = shapeProps as RectShape;
        return (
          <Rect
            {...commonProps}
            width={rectShape.width}
            height={rectShape.height}
            offsetX={rectShape.width / 2}
            offsetY={rectShape.height / 2}
            cornerRadius={0}
            strokeScaleEnabled={false}
          />
        );

      case "circle":
        const circleShape = shapeProps as CircleShape;
        return (
          <Ellipse
            {...commonProps}
            radiusX={circleShape.width / 2}
            radiusY={circleShape.height / 2}
            offsetX={0}
            offsetY={0}
            strokeScaleEnabled={false}
          />
        );

      case "star":
        const starShape = shapeProps as StarShape;
        // Calculate scale factors based on width/height vs base radius
        const baseOuterRadius = starShape.outerRadius;
        const scaleX = starShape.width / (baseOuterRadius * 2);
        const scaleY = starShape.height / (baseOuterRadius * 2);

        return (
          <Star
            {...commonProps}
            numPoints={starShape.numPoints}
            innerRadius={starShape.innerRadius}
            outerRadius={starShape.outerRadius}
            scaleX={scaleX}
            scaleY={scaleY}
            offsetX={0}
            offsetY={0}
            strokeScaleEnabled={false}
          />
        );

      default:
        return null;
    }
  };

  // Get shape dimensions for side anchors
  const getShapeDimensions = () => {
    if (shapeProps.type === "rect") {
      const rectShape = shapeProps as RectShape;
      return { width: rectShape.width, height: rectShape.height };
    } else if (shapeProps.type === "circle") {
      const circleShape = shapeProps as CircleShape;
      return { width: circleShape.width, height: circleShape.height };
    } else if (shapeProps.type === "star") {
      const starShape = shapeProps as StarShape;
      return { width: starShape.width, height: starShape.height };
    }
    return { width: 0, height: 0 };
  };

  return (
    <React.Fragment>
      {renderShape()}

      {/* Custom Side Anchors */}
      {isSelected && (
        <React.Fragment>
          {(() => {
            const { width, height } = getShapeDimensions();

            // Calculate rotated side anchor positions
            const rotation = ((shapeProps.rotation || 0) * Math.PI) / 180;
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);
            const halfWidth = width / 2;
            const halfHeight = height / 2;

            // Calculate anchor strip thickness - spans equally inside and outside the edge
            const anchorThickness = 30 / stageScale;

            // Calculate rotated positions for each side anchor
            // Position anchors centered on the edge (half thickness inside, half outside)
            // Top side anchor - centered on top edge
            const topCenterX = shapeProps.x + (0 * cos - -halfHeight * sin);
            const topCenterY = shapeProps.y + (0 * sin + -halfHeight * cos);

            // Bottom side anchor - centered on bottom edge
            const bottomCenterX = shapeProps.x + (0 * cos - halfHeight * sin);
            const bottomCenterY = shapeProps.y + (0 * sin + halfHeight * cos);

            // Left side anchor - centered on left edge
            const leftCenterX = shapeProps.x + (-halfWidth * cos - 0 * sin);
            const leftCenterY = shapeProps.y + (-halfWidth * sin + 0 * cos);

            // Right side anchor - centered on right edge
            const rightCenterX = shapeProps.x + (halfWidth * cos - 0 * sin);
            const rightCenterY = shapeProps.y + (halfWidth * sin + 0 * cos);

            return (
              <>
                {/* Top anchor - rotated strip along the top border */}
                <Group
                  x={topCenterX}
                  y={topCenterY}
                  rotation={shapeProps.rotation || 0}
                  offsetX={width / 2}
                  offsetY={anchorThickness / 2}
                >
                  <SideAnchor
                    x={0}
                    y={0}
                    width={width}
                    height={anchorThickness}
                    side="top"
                    rotation={shapeProps.rotation || 0}
                    onDrag={(deltaX, deltaY) =>
                      handleSideAnchorDrag("top", deltaX, deltaY)
                    }
                    visible={true}
                  />
                </Group>

                {/* Bottom anchor - rotated strip along the bottom border */}
                <Group
                  x={bottomCenterX}
                  y={bottomCenterY}
                  rotation={shapeProps.rotation || 0}
                  offsetX={width / 2}
                  offsetY={anchorThickness / 2}
                >
                  <SideAnchor
                    x={0}
                    y={0}
                    width={width}
                    height={anchorThickness}
                    side="bottom"
                    rotation={shapeProps.rotation || 0}
                    onDrag={(deltaX, deltaY) =>
                      handleSideAnchorDrag("bottom", deltaX, deltaY)
                    }
                    visible={true}
                  />
                </Group>

                {/* Left anchor - rotated strip along the left border */}
                <Group
                  x={leftCenterX}
                  y={leftCenterY}
                  rotation={shapeProps.rotation || 0}
                  offsetX={anchorThickness / 2}
                  offsetY={height / 2}
                >
                  <SideAnchor
                    x={0}
                    y={0}
                    width={anchorThickness}
                    height={height}
                    side="left"
                    rotation={shapeProps.rotation || 0}
                    onDrag={(deltaX, deltaY) =>
                      handleSideAnchorDrag("left", deltaX, deltaY)
                    }
                    visible={true}
                  />
                </Group>

                {/* Right anchor - rotated strip along the right border */}
                <Group
                  x={rightCenterX}
                  y={rightCenterY}
                  rotation={shapeProps.rotation || 0}
                  offsetX={anchorThickness / 2}
                  offsetY={height / 2}
                >
                  <SideAnchor
                    x={0}
                    y={0}
                    width={anchorThickness}
                    height={height}
                    side="right"
                    rotation={shapeProps.rotation || 0}
                    onDrag={(deltaX, deltaY) =>
                      handleSideAnchorDrag("right", deltaX, deltaY)
                    }
                    visible={true}
                  />
                </Group>
              </>
            );
          })()}
        </React.Fragment>
      )}

      {/* Custom Rotation Anchors - positioned offset from corner anchors */}
      {isSelected && (
        <React.Fragment>
          {(() => {
            const { width, height } = getShapeDimensions();

            // Center of shape in local coordinates (relative to parent group)
            const centerX = shapeProps.x;
            const centerY = shapeProps.y;

            // Calculate rotated corner positions
            const rotation = ((shapeProps.rotation || 0) * Math.PI) / 180;
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);
            const halfWidth = width / 2;
            const halfHeight = height / 2;

            // Calculate actual corner positions after rotation in world coordinates
            const topLeftX = centerX + (-halfWidth * cos - -halfHeight * sin);
            const topLeftY = centerY + (-halfWidth * sin + -halfHeight * cos);

            const topRightX = centerX + (halfWidth * cos - -halfHeight * sin);
            const topRightY = centerY + (halfWidth * sin + -halfHeight * cos);

            const bottomLeftX = centerX + (-halfWidth * cos - halfHeight * sin);
            const bottomLeftY = centerY + (-halfWidth * sin + halfHeight * cos);

            const bottomRightX = centerX + (halfWidth * cos - halfHeight * sin);
            const bottomRightY = centerY + (halfWidth * sin + halfHeight * cos);

            return (
              <>
                <RotationAnchor
                  x={topLeftX}
                  y={topLeftY}
                  corner="top-left"
                  groupCenterX={worldX}
                  groupCenterY={worldY}
                  onRotate={handleRotation}
                  visible={true}
                  stageScale={stageScale}
                  currentRotation={shapeProps.rotation || 0}
                />

                <RotationAnchor
                  x={topRightX}
                  y={topRightY}
                  corner="top-right"
                  groupCenterX={worldX}
                  groupCenterY={worldY}
                  onRotate={handleRotation}
                  visible={true}
                  stageScale={stageScale}
                  currentRotation={shapeProps.rotation || 0}
                />

                <RotationAnchor
                  x={bottomLeftX}
                  y={bottomLeftY}
                  corner="bottom-left"
                  groupCenterX={worldX}
                  groupCenterY={worldY}
                  onRotate={handleRotation}
                  visible={true}
                  stageScale={stageScale}
                  currentRotation={shapeProps.rotation || 0}
                />

                <RotationAnchor
                  x={bottomRightX}
                  y={bottomRightY}
                  corner="bottom-right"
                  groupCenterX={worldX}
                  groupCenterY={worldY}
                  onRotate={handleRotation}
                  visible={true}
                  stageScale={stageScale}
                  currentRotation={shapeProps.rotation || 0}
                />
              </>
            );
          })()}
        </React.Fragment>
      )}

      {/* Keep corner anchors with transformer for corner resizing */}
      {(isSelected || isDragging) && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          padding={0}
          ignoreStroke={true}
          rotateEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to minimum size
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
          // Figma-like styling
          borderStroke="#29A9FF"
          borderStrokeWidth={2}
          anchorStroke="#29A9FF"
          anchorFill="white"
          anchorStrokeWidth={2}
          anchorSize={isDragging && !isSelected ? 6 : 8}
          anchorCornerRadius={2}
          rotateAnchorOffset={30}
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-right",
            "bottom-left",
          ]}
        />
      )}
    </React.Fragment>
  );
};

// Initial layers (renamed from initialGroups)
const initialLayers: LayerContainer[] = [
  {
    id: "layer1",
    type: "layer",
    x: 400,
    y: 300,
    width: 600,
    height: 400,
    fill: "#ffffff",
    draggable: true,
    children: [], // No initial children
    showBorder: true,
  },
];

// Layer Panel Component
interface LayerPanelProps {
  layers: LayerContainer[];
  shapes: Shape[];
  selectedId: string | null;
  onSelectLayer: (id: string) => void;
  onSelectShape: (id: string) => void;
  getShapeLayer: (shapeId: string) => LayerContainer | null;
}

const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  shapes,
  selectedId,
  onSelectLayer,
  onSelectShape,
  getShapeLayer,
}) => {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());

  const toggleLayerExpansion = (layerId: string) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId);
    } else {
      newExpanded.add(layerId);
    }
    setExpandedLayers(newExpanded);
  };

  const getShapeIcon = (shape: Shape) => {
    switch (shape.type) {
      case "rect":
        return <Square className="w-4 h-4" />;
      case "circle":
        return <Circle className="w-4 h-4" />;
      case "star":
        return <StarIcon className="w-4 h-4" />;
      default:
        return <Square className="w-4 h-4" />;
    }
  };

  const getShapeName = (shape: Shape) => {
    switch (shape.type) {
      case "rect":
        return "Rectangle";
      case "circle":
        return "Circle";
      case "star":
        return "Star";
      default:
        return "Shape";
    }
  };

  // Get ungrouped shapes (not in any layer)
  const ungroupedShapes = shapes.filter((shape) => !getShapeLayer(shape.id));

  return (
    <div className="h-screen pt-[80px] px-[10px] overflow-y-auto">
      {/* Render layers */}
      {layers.map((layer) => {
        const isExpanded = expandedLayers.has(layer.id);
        const layerShapes = shapes.filter((shape) =>
          layer.children.includes(shape.id)
        );

        return (
          <div key={layer.id} className="space-y-1">
            {/* Layer header */}
            <div
              className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 ${
                selectedId === layer.id
                  ? "bg-blue-100 border-l-2 border-blue-500"
                  : ""
              }`}
              onClick={() => onSelectLayer(layer.id)}
            >
              <button
                className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerExpansion(layer.id);
                }}
              >
                {layerShapes.length > 0 ? (
                  isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )
                ) : (
                  <div className="w-3 h-3" />
                )}
              </button>
              <Layers className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700 flex-1">
                Layer {layer.id.replace("layer", "")}
              </span>
              <Eye className="w-3 h-3 text-gray-400" />
            </div>

            {/* Layer children */}
            {isExpanded && layerShapes.length > 0 && (
              <div className="ml-6 space-y-1">
                {layerShapes.map((shape) => (
                  <div
                    key={shape.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 ${
                      selectedId === shape.id
                        ? "bg-blue-100 border-l-2 border-blue-500"
                        : ""
                    }`}
                    onClick={() => onSelectShape(shape.id)}
                  >
                    <div className="w-4 h-4 flex items-center justify-center text-gray-500">
                      {getShapeIcon(shape)}
                    </div>
                    <span className="text-sm text-gray-700 flex-1">
                      {getShapeName(shape)}
                    </span>
                    <Eye className="w-3 h-3 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const App: React.FC = () => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [layers, setLayers] = useState<LayerContainer[]>(initialLayers);
  const [selectedId, selectShape] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({
    width: 800, // Default width
    height: 600, // Default height
  });

  // Infinite canvas state
  const [stageScale, setStageScale] = useState(1);
  const [stageX, setStageX] = useState(0);
  const [stageY, setStageY] = useState(0);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [lastPointerPosition, setLastPointerPosition] = useState({
    x: 0,
    y: 0,
  });

  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    // Update dimensions when component mounts
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Handle window resize
    function handleResize() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Handle keyboard events for space key
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" && !isSpacePressed) {
        setIsSpacePressed(true);
        document.body.style.cursor = "grab";
        e.preventDefault();
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        setIsDraggingCanvas(false);
        document.body.style.cursor = "default";
        e.preventDefault();
      }
    }

    // Handle zoom with wheel
    function handleWheel(e: WheelEvent) {
      // Check if Cmd (Mac) or Ctrl (Windows/Linux) is pressed for zoom
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();

        const stage = stageRef.current;
        if (!stage) return;

        const oldScale = stageScale;
        const pointer = stage.getPointerPosition();

        if (!pointer) return;

        const mousePointTo = {
          x: (pointer.x - stageX) / oldScale,
          y: (pointer.y - stageY) / oldScale,
        };

        // Determine zoom direction and amount
        const direction = e.deltaY > 0 ? -1 : 1;
        const zoomFactor = 1.1;
        const newScale =
          direction > 0 ? oldScale * zoomFactor : oldScale / zoomFactor;

        // Clamp scale between reasonable limits
        const clampedScale = Math.max(0.1, Math.min(5, newScale));

        const newPos = {
          x: pointer.x - mousePointTo.x * clampedScale,
          y: pointer.y - mousePointTo.y * clampedScale,
        };

        setStageScale(clampedScale);
        setStageX(newPos.x);
        setStageY(newPos.y);
      } else {
        // Regular scrolling for panning up/down and left/right
        e.preventDefault();

        const scrollSpeed = 1; // Adjust scroll sensitivity
        const deltaX = e.deltaX * scrollSpeed;
        const deltaY = e.deltaY * scrollSpeed;

        // Update stage position for scrolling
        setStageX(stageX - deltaX);
        setStageY(stageY - deltaY);
      }
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("wheel", handleWheel, { passive: false });

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [stageScale, stageX, stageY, isSpacePressed]);

  const checkDeselect = (e: any) => {
    // Don't deselect when panning
    if (isDraggingCanvas) return;

    // Deselect when clicked on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  const handleStageMouseDown = (e: any) => {
    if (isSpacePressed) {
      setIsDraggingCanvas(true);
      document.body.style.cursor = "grabbing";
      const pos = e.target.getStage().getPointerPosition();
      setLastPointerPosition({ x: pos.x, y: pos.y });
      return;
    }
    checkDeselect(e);
  };

  const handleStageMouseMove = (e: any) => {
    if (isDraggingCanvas && isSpacePressed) {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();

      const dx = pos.x - lastPointerPosition.x;
      const dy = pos.y - lastPointerPosition.y;

      setStageX(stageX + dx);
      setStageY(stageY + dy);

      setLastPointerPosition({ x: pos.x, y: pos.y });
    }
  };

  const handleStageMouseUp = () => {
    if (isDraggingCanvas) {
      setIsDraggingCanvas(false);
      if (isSpacePressed) {
        document.body.style.cursor = "grab";
      } else {
        document.body.style.cursor = "default";
      }
    }
  };

  const handleShapeChange = (index: number, newAttrs: Shape) => {
    const newShapes = shapes.slice();
    newShapes[index] = newAttrs;
    setShapes(newShapes);
  };

  const handleLayerChange = (index: number, newAttrs: LayerContainer) => {
    const newLayers = layers.slice();
    newLayers[index] = newAttrs;
    setLayers(newLayers);
  };

  const handleShapeHover = (shapeId: string, hovered: boolean) => {
    setHoveredId(hovered ? shapeId : null);
  };

  const handleDragStart = (shapeId: string) => {
    setDraggingId(shapeId);
  };

  const handleDragEnd = (shapeId: string) => {
    setDraggingId(null);
  };

  // Helper function to check if a shape is inside a layer
  const getShapeLayer = (shapeId: string): LayerContainer | null => {
    return layers.find((layer) => layer.children.includes(shapeId)) || null;
  };

  // Helper function to check if a layer is currently selected
  const isLayerSelected = (): boolean => {
    if (!selectedId) return false;
    console.log(selectedId);
    return layers.some((layer) => layer.id === selectedId);
  };

  // Function to add a shape to a layer
  const addShapeToLayer = (shapeId: string, layerId: string) => {
    const newLayers = layers.map((layer) => {
      if (layer.id === layerId) {
        return {
          ...layer,
          children: [...layer.children.filter((id) => id !== shapeId), shapeId],
        };
      }
      // Remove from other layers
      return {
        ...layer,
        children: layer.children.filter((id) => id !== shapeId),
      };
    });
    setLayers(newLayers);
  };

  const addShapeToSelectedLayer = (shapeType: "rect" | "circle" | "star") => {
    if (!selectedId) return;

    // Check if selected item is a layer
    const selectedLayer = layers.find((layer) => layer.id === selectedId);
    if (!selectedLayer) return;

    // Create new shape ID
    const newShapeId = `${shapeType}_${Date.now()}`;

    let newShape: Shape;

    // Create shape based on type
    switch (shapeType) {
      case "rect":
        newShape = {
          id: newShapeId,
          type: "rect",
          x: selectedLayer.x,
          y: selectedLayer.y,
          width: 100,
          height: 80,
          fill: "#4F46E5",
          draggable: true,
        } as RectShape;
        break;

      case "circle":
        newShape = {
          id: newShapeId,
          type: "circle",
          x: selectedLayer.x,
          y: selectedLayer.y,
          width: 100,
          height: 100,
          fill: "#EF4444",
          draggable: true,
        } as CircleShape;
        break;

      case "star":
        newShape = {
          id: newShapeId,
          type: "star",
          x: selectedLayer.x,
          y: selectedLayer.y,
          width: 100,
          height: 100,
          numPoints: 5,
          innerRadius: 17,
          outerRadius: 40,
          fill: "#F59E0B",
          draggable: true,
        } as StarShape;
        break;
    }

    // Add shape to shapes array
    setShapes([...shapes, newShape]);

    // Add shape to layer's children
    addShapeToLayer(newShapeId, selectedLayer.id);

    // Select the newly created shape
    selectShape(newShapeId);
  };

  return (
    <div className="bg-[#F2F1F3] h-screen overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-0 left-0 w-full bg-white border-b border-[#E3E3E3] z-20 p-[15px]">
        <div className="flex flex-row items-center justify-between h-full w-full gap-[10px]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="31"
            height="26"
            fill="none"
            viewBox="0 0 31 26"
          >
            <path
              fill="#000"
              d="M14.647 17.733c-1.155 3.816-1.563 8.138-6.457 8.07-2.175-.033-3.636-.1-4.791-2.16-1.7-3.04-4.69-19.283-2.787-22.018C1.326.61 4.214.476 5.404.443c.815-.034 1.733-.034 2.345.54C9.04 2.199 8.904 11.519 9.278 13.917c.068.54.306 1.79 1.02 1.823 2.446.102.985-10.03 2.242-11.988.748-1.216 2.957-1.148 4.146-.743.476.169.986.405 1.292.81 1.257 1.622.034 8.477.951 11.179.136.371.408 1.013.884.979.408-.034.748-.71.85-1.047 1.121-3.107.475-12.292 2.413-14.217.543-.54 1.257-.743 2.005-.71 1.189.068 4.282.473 5.063 1.351.476.54.816 1.284.85 2.027.17 3.31-3.195 16.952-4.826 19.992-.51.945-1.257 1.857-2.31 2.16-1.326.372-2.822.609-4.181.372-3.67-.641-4.35-5.133-5.03-8.172"
            />
          </svg>
          <div className="flex items-center justify-start h-full w-full gap-[50px]">
            <span className="text-[16px] font-semibold text-black">
              Untitled
            </span>
            <div className="flex flex-row gap-[5px]">
              <button className="cursor-pointer flex items-center justify-center w-[40px] h-[40px] rounded-[12px] bg-[#F2F1F3]">
                <Frame className="text-[#6A6A6A] w-[20px] h-[20px] stroke-[3px]" />
              </button>
              <button className="cursor-pointer flex items-center justify-center w-[40px] h-[40px] rounded-[12px] bg-[#F2F1F3]">
                <Type className="text-[#6A6A6A] w-[20px] h-[20px] stroke-[3px]" />
              </button>
              <button
                className={`flex items-center justify-center w-[40px] h-[40px] rounded-[12px] bg-[#F2F1F3] ${
                  isLayerSelected() ? "cursor-pointer" : "cursor-not-allowed"
                }`}
                style={{ opacity: isLayerSelected() ? 1 : 0.5 }}
                onClick={() => addShapeToSelectedLayer("rect")}
                disabled={!isLayerSelected()}
              >
                <Square className="text-[#6A6A6A] w-[20px] h-[20px] stroke-[3px]" />
              </button>
              <button
                className={`flex items-center justify-center w-[40px] h-[40px] rounded-[12px] bg-[#F2F1F3] ${
                  isLayerSelected() ? "cursor-pointer" : "cursor-not-allowed"
                }`}
                style={{ opacity: isLayerSelected() ? 1 : 0.5 }}
                onClick={() => addShapeToSelectedLayer("circle")}
                disabled={!isLayerSelected()}
              >
                <Circle className="text-[#6A6A6A] w-[20px] h-[20px] stroke-[3px]" />
              </button>
              <button
                className={`flex items-center justify-center w-[40px] h-[40px] rounded-[12px] bg-[#F2F1F3] ${
                  isLayerSelected() ? "cursor-pointer" : "cursor-not-allowed"
                }`}
                style={{ opacity: isLayerSelected() ? 1 : 0.5 }}
                onClick={() => addShapeToSelectedLayer("star")}
                disabled={!isLayerSelected()}
              >
                <StarIcon className="text-[#6A6A6A] w-[20px] h-[20px] stroke-[3px]" />
              </button>
              <button className="cursor-pointer flex items-center justify-center w-[40px] h-[40px] rounded-[12px] bg-[#F2F1F3]">
                <Image className="text-[#6A6A6A] w-[20px] h-[20px] stroke-[3px]" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-end h-full w-full gap-[10px]">
            <span className="text-[16px] font-semibold text-black px-[17px] py-[7px] bg-[#F2F1F3] rounded-[12px]">
              {Math.round(stageScale * 100)}%
            </span>
            <span className="flex gap-[10px] items-center cursor-pointer text-[16px] font-semibold text-white px-[17px] py-[7px] bg-[#29A9FF] rounded-[12px]">
              <Download className="w-[16px] h-[16px] text-white stroke-[3px]" />
              Export
            </span>
          </div>
        </div>
      </div>
      {/* Sidebar */}
      <div className="absolute top-0 left-0 w-[250px] h-screen bg-white border-r border-[#E3E3E3] z-10">
        <LayerPanel
          layers={layers}
          shapes={shapes}
          selectedId={selectedId}
          onSelectLayer={(id) => selectShape(id)}
          onSelectShape={(id) => selectShape(id)}
          getShapeLayer={(id) => getShapeLayer(id)}
        />
      </div>
      <Stage
        width={dimensions.width - 250}
        height={dimensions.height - 70}
        style={{ marginLeft: "250px", marginTop: "70px" }}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        ref={stageRef}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stageX}
        y={stageY}
      >
        {/* Render layer containers as separate layers */}
        {layers.map((layer, i) => (
          <LayerComponent
            key={layer.id}
            layerProps={layer}
            isSelected={layer.id === selectedId}
            isHovered={layer.id === hoveredId}
            isDragging={layer.id === draggingId}
            stageScale={stageScale}
            onSelect={() => {
              selectShape(layer.id);
            }}
            onChange={(newAttrs) => handleLayerChange(i, newAttrs)}
            onHover={(hovered) => handleShapeHover(layer.id, hovered)}
            onDragStart={() => handleDragStart(layer.id)}
            onDragEnd={() => handleDragEnd(layer.id)}
          >
            {/* Render shapes that belong to this layer */}
            {shapes
              .filter((shape, shapeIndex) => {
                const currentLayer = getShapeLayer(shape.id);
                return currentLayer?.id === layer.id;
              })
              .map((shape, shapeIndex) => {
                const originalIndex = shapes.findIndex(
                  (s) => s.id === shape.id
                );
                return (
                  <ShapeComponent
                    key={shape.id}
                    shapeProps={{
                      ...shape,
                      // Adjust position relative to layer
                      x: shape.x - layer.x,
                      y: shape.y - layer.y,
                    }}
                    isSelected={shape.id === selectedId}
                    isHovered={shape.id === hoveredId}
                    isDragging={shape.id === draggingId}
                    stageScale={stageScale}
                    worldX={shape.x}
                    worldY={shape.y}
                    onSelect={() => {
                      selectShape(shape.id);
                    }}
                    onChange={(newAttrs) => {
                      // Adjust position back to world coordinates
                      const worldAttrs = {
                        ...newAttrs,
                        x: newAttrs.x + layer.x,
                        y: newAttrs.y + layer.y,
                      };
                      handleShapeChange(originalIndex, worldAttrs);
                    }}
                    onHover={(hovered) => handleShapeHover(shape.id, hovered)}
                    onDragStart={() => handleDragStart(shape.id)}
                    onDragEnd={() => handleDragEnd(shape.id)}
                  />
                );
              })}
          </LayerComponent>
        ))}
      </Stage>
    </div>
  );
};

export default App;
