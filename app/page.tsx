"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Star,
  Transformer,
  Text,
  Group,
} from "react-konva";
import Konva from "konva";
import { Download } from "lucide-react";

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
  radius: number;
}

interface StarShape extends BaseShape {
  type: "star";
  numPoints: number;
  innerRadius: number;
  outerRadius: number;
}

// Define group interface
interface GroupContainer extends BaseShape {
  type: "group";
  width: number;
  height: number;
  children: string[]; // Array of shape IDs contained in this group
  showBorder: boolean;
}

type Shape = RectShape | CircleShape | StarShape;
type Container = GroupContainer;
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
}

interface GroupComponentProps {
  groupProps: GroupContainer;
  isSelected: boolean;
  isHovered: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onChange: (newAttrs: GroupContainer) => void;
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
        const pos = e.target.getStage()?.getPointerPosition();
        if (pos) {
          dragStartPos.current = { x: pos.x, y: pos.y };
        }
      }}
      onDragMove={(e) => {
        document.body.style.cursor = getCursor();
        const pos = e.target.getStage()?.getPointerPosition();
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
}) => {
  const initialAngle = useRef(0);
  const isDragging = useRef(false);

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
  const anchorRadius = Math.max(8, 16 / stageScale);

  const calculateAngle = (pointX: number, pointY: number) => {
    const deltaX = pointX - groupCenterX;
    const deltaY = pointY - groupCenterY;
    return Math.atan2(deltaY, deltaX);
  };

  return (
    <Circle
      x={offsetPos.x}
      y={offsetPos.y}
      radius={anchorRadius}
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
        const pos = e.target.getStage()?.getPointerPosition();
        if (pos) {
          initialAngle.current = calculateAngle(pos.x, pos.y);
        }
        document.body.style.cursor = "crosshair";
      }}
      onDragMove={(e) => {
        const pos = e.target.getStage()?.getPointerPosition();
        if (pos) {
          const currentAngle = calculateAngle(pos.x, pos.y);
          const deltaAngle = currentAngle - initialAngle.current;

          // Convert to degrees and apply rotation
          const deltaRotation = (deltaAngle * 180) / Math.PI;
          onRotate(deltaRotation);

          initialAngle.current = currentAngle;

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

// Group Component for containers
const GroupComponent: React.FC<GroupComponentProps> = ({
  groupProps,
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
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if ((isSelected || isDragging) && trRef.current && groupRef.current) {
      // Attach transformer manually
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isDragging]);

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragStart();
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // The drag is handled by the outer container group
    // e.target is the outer container group, so we get its position
    // Account for the offset since we're now rotating around center
    onChange({
      ...groupProps,
      x: e.target.x(),
      y: e.target.y(),
    });

    // Auto-select the group after dragging (Figma-like behavior)
    onSelect();
    onDragEnd();
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = groupRef.current;
    const transformer = trRef.current;
    if (!node || !transformer) return;

    // Scale that was just applied by Konva
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scaling on the node so we can work with explicit width/height
    node.scaleX(1);
    node.scaleY(1);

    // New explicit dimensions
    const newWidth = Math.max(50, groupProps.width * Math.abs(scaleX));
    const newHeight = Math.max(50, groupProps.height * Math.abs(scaleY));

    // Which anchor was dragged?
    const activeAnchor: string | undefined = (transformer as any)
      ._movingAnchorName;

    // Keep the inner node centered inside its own coordinate space
    node.x(newWidth / 2);
    node.y(newHeight / 2);

    // If we failed to detect the anchor or it is not a corner, just update size in place
    if (!activeAnchor || !activeAnchor.includes("-")) {
      onChange({ ...groupProps, width: newWidth, height: newHeight });
      return;
    }

    // Old & new half-sizes
    const oldHalfW = groupProps.width / 2;
    const oldHalfH = groupProps.height / 2;
    const newHalfW = newWidth / 2;
    const newHalfH = newHeight / 2;

    // Rotation helpers
    const rotation = ((groupProps.rotation ?? 0) * Math.PI) / 180;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    // Convert local (object) coordinates to world coordinates
    const toWorld = (lx: number, ly: number) => ({
      x: groupProps.x + lx * cos - ly * sin,
      y: groupProps.y + lx * sin + ly * cos,
    });

    // Determine which corner should stay fixed (the opposite one)
    const fixedCorner = (() => {
      switch (activeAnchor) {
        case "top-left":
          return toWorld(oldHalfW, oldHalfH); // bottom-right is fixed
        case "top-right":
          return toWorld(-oldHalfW, oldHalfH); // bottom-left is fixed
        case "bottom-left":
          return toWorld(oldHalfW, -oldHalfH); // top-right is fixed
        case "bottom-right":
          return toWorld(-oldHalfW, -oldHalfH); // top-left is fixed
        default:
          return { x: groupProps.x, y: groupProps.y };
      }
    })();

    // Map for local vector from center to the fixed corner after resize
    const anchorVectorMap: Record<string, [number, number]> = {
      "top-left": [newHalfW, newHalfH],
      "top-right": [-newHalfW, newHalfH],
      "bottom-left": [newHalfW, -newHalfH],
      "bottom-right": [-newHalfW, -newHalfH],
    };

    const [vecLX, vecLY] = anchorVectorMap[activeAnchor];

    const vecWX = vecLX * cos - vecLY * sin;
    const vecWY = vecLX * sin + vecLY * cos;

    const newCenterX = fixedCorner.x - vecWX;
    const newCenterY = fixedCorner.y - vecWY;

    // Commit the updated props
    onChange({
      ...groupProps,
      x: newCenterX,
      y: newCenterY,
      width: newWidth,
      height: newHeight,
    });
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
    if (groupProps.showBorder) return "#29A9FF";
    return "transparent";
  };

  const getStrokeWidth = () => {
    if (isSelected) return 1;
    if (isHovered) return 1;
    if (isDragging) return 1;
    if (groupProps.showBorder) return 1;
    return 0;
  };

  const getDash = () => {
    if (isDragging && !isSelected) return [5, 5];
    if (groupProps.showBorder && !isSelected && !isHovered) return [3, 3];
    return undefined;
  };

  const getFill = () => {
    if (isSelected || isHovered) return "rgba(0, 102, 255, 0.05)";
    return "transparent";
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
    const rotation = ((groupProps.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    // Transform the drag delta to the group's local coordinate system
    const localDeltaX = adjustedDeltaX * cos + adjustedDeltaY * sin;
    const localDeltaY = -adjustedDeltaX * sin + adjustedDeltaY * cos;

    // Calculate current center and half dimensions
    const centerX = groupProps.x;
    const centerY = groupProps.y;
    const halfWidth = groupProps.width / 2;
    const halfHeight = groupProps.height / 2;

    // The key insight: we need to keep the OPPOSITE edge fixed, not the dragged edge
    // Calculate the position of the fixed edge (opposite to the one being dragged)
    let fixedEdgeCenterX = centerX;
    let fixedEdgeCenterY = centerY;
    let newWidth = groupProps.width;
    let newHeight = groupProps.height;

    switch (side) {
      case "top":
        // Dragging top edge, so keep bottom edge fixed
        fixedEdgeCenterX = centerX + (0 * cos - halfHeight * sin);
        fixedEdgeCenterY = centerY + (0 * sin + halfHeight * cos);
        // Calculate new height based on local movement (negative because top edge moves up to reduce height)
        newHeight = Math.max(50, groupProps.height - localDeltaY);
        break;
      case "bottom":
        // Dragging bottom edge, so keep top edge fixed
        fixedEdgeCenterX = centerX + (0 * cos - -halfHeight * sin);
        fixedEdgeCenterY = centerY + (0 * sin + -halfHeight * cos);
        // Calculate new height based on local movement
        newHeight = Math.max(50, groupProps.height + localDeltaY);
        break;
      case "left":
        // Dragging left edge, so keep right edge fixed
        fixedEdgeCenterX = centerX + (halfWidth * cos - 0 * sin);
        fixedEdgeCenterY = centerY + (halfWidth * sin + 0 * cos);
        // Calculate new width based on local movement (negative because left edge moves left to increase width)
        newWidth = Math.max(50, groupProps.width - localDeltaX);
        break;
      case "right":
        // Dragging right edge, so keep left edge fixed
        fixedEdgeCenterX = centerX + (-halfWidth * cos - 0 * sin);
        fixedEdgeCenterY = centerY + (-halfWidth * sin + 0 * cos);
        // Calculate new width based on local movement
        newWidth = Math.max(50, groupProps.width + localDeltaX);
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

    onChange({
      ...groupProps,
      x: newCenterX,
      y: newCenterY,
      width: newWidth,
      height: newHeight,
    });
  };

  const handleRotation = (deltaRotation: number) => {
    const currentRotation = groupProps.rotation || 0;
    const newRotation = currentRotation + deltaRotation;

    onChange({
      ...groupProps,
      rotation: newRotation,
    });
  };

  return (
    <React.Fragment>
      {/* Container Group that moves together but only the inner group gets selected */}
      <Group
        x={groupProps.x}
        y={groupProps.y}
        offsetX={groupProps.width / 2}
        offsetY={groupProps.height / 2}
        rotation={groupProps.rotation || 0}
        draggable={groupProps.draggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ cursor: "none !important" }}
      >
        {/* Selectable Group - only this gets the transformer */}
        <Group
          ref={groupRef}
          x={groupProps.width / 2}
          y={groupProps.height / 2}
          width={groupProps.width}
          height={groupProps.height}
          onTransformEnd={handleTransformEnd}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={onSelect}
          onTap={onSelect}
        >
          {/* Background rectangle for the group */}
          <Rect
            x={-groupProps.width / 2}
            y={-groupProps.height / 2}
            width={groupProps.width}
            height={groupProps.height}
            fill={getFill()}
            stroke={getStroke()}
            strokeWidth={getStrokeWidth()}
            strokeScaleEnabled={false}
            dash={getDash()}
          />

          {/* Children shapes with clipping */}
          <Group
            x={-groupProps.width / 2}
            y={-groupProps.height / 2}
            clipFunc={(ctx: any) => {
              // Clip children to group bounds
              ctx.rect(0, 0, groupProps.width, groupProps.height);
            }}
          >
            {children}
          </Group>
        </Group>
      </Group>

      {/* Custom Side Anchors */}
      {isSelected && (
        <React.Fragment>
          {(() => {
            // Calculate rotated side anchor positions
            const rotation = ((groupProps.rotation || 0) * Math.PI) / 180;
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);
            const halfWidth = groupProps.width / 2;
            const halfHeight = groupProps.height / 2;

            // Calculate anchor strip thickness
            const anchorThickness = 5;

            // Calculate rotated positions for each side anchor
            // Top side anchor
            const topCenterX =
              groupProps.x +
              (0 * cos - (-halfHeight - anchorThickness / 2) * sin);
            const topCenterY =
              groupProps.y +
              (0 * sin + (-halfHeight - anchorThickness / 2) * cos);

            // Bottom side anchor
            const bottomCenterX =
              groupProps.x +
              (0 * cos - (halfHeight + anchorThickness / 2) * sin);
            const bottomCenterY =
              groupProps.y +
              (0 * sin + (halfHeight + anchorThickness / 2) * cos);

            // Left side anchor
            const leftCenterX =
              groupProps.x +
              ((-halfWidth - anchorThickness / 2) * cos - 0 * sin);
            const leftCenterY =
              groupProps.y +
              ((-halfWidth - anchorThickness / 2) * sin + 0 * cos);

            // Right side anchor
            const rightCenterX =
              groupProps.x +
              ((halfWidth + anchorThickness / 2) * cos - 0 * sin);
            const rightCenterY =
              groupProps.y +
              ((halfWidth + anchorThickness / 2) * sin + 0 * cos);

            return (
              <>
                {/* Top anchor - rotated strip along the top border */}
                <Group
                  x={topCenterX}
                  y={topCenterY}
                  rotation={groupProps.rotation || 0}
                  offsetX={groupProps.width / 2}
                  offsetY={anchorThickness / 2}
                >
                  <SideAnchor
                    x={0}
                    y={0}
                    width={groupProps.width}
                    height={anchorThickness}
                    side="top"
                    rotation={groupProps.rotation || 0}
                    onDrag={(deltaX, deltaY) =>
                      handleSideAnchorDrag("top", deltaX, deltaY, stageScale)
                    }
                    visible={true}
                  />
                </Group>

                {/* Bottom anchor - rotated strip along the bottom border */}
                <Group
                  x={bottomCenterX}
                  y={bottomCenterY}
                  rotation={groupProps.rotation || 0}
                  offsetX={groupProps.width / 2}
                  offsetY={anchorThickness / 2}
                >
                  <SideAnchor
                    x={0}
                    y={0}
                    width={groupProps.width}
                    height={anchorThickness}
                    side="bottom"
                    rotation={groupProps.rotation || 0}
                    onDrag={(deltaX, deltaY) =>
                      handleSideAnchorDrag("bottom", deltaX, deltaY, stageScale)
                    }
                    visible={true}
                  />
                </Group>

                {/* Left anchor - rotated strip along the left border */}
                <Group
                  x={leftCenterX}
                  y={leftCenterY}
                  rotation={groupProps.rotation || 0}
                  offsetX={anchorThickness / 2}
                  offsetY={groupProps.height / 2}
                >
                  <SideAnchor
                    x={0}
                    y={0}
                    width={anchorThickness}
                    height={groupProps.height}
                    side="left"
                    rotation={groupProps.rotation || 0}
                    onDrag={(deltaX, deltaY) =>
                      handleSideAnchorDrag("left", deltaX, deltaY, stageScale)
                    }
                    visible={true}
                  />
                </Group>

                {/* Right anchor - rotated strip along the right border */}
                <Group
                  x={rightCenterX}
                  y={rightCenterY}
                  rotation={groupProps.rotation || 0}
                  offsetX={anchorThickness / 2}
                  offsetY={groupProps.height / 2}
                >
                  <SideAnchor
                    x={0}
                    y={0}
                    width={anchorThickness}
                    height={groupProps.height}
                    side="right"
                    rotation={groupProps.rotation || 0}
                    onDrag={(deltaX, deltaY) =>
                      handleSideAnchorDrag("right", deltaX, deltaY, stageScale)
                    }
                    visible={true}
                  />
                </Group>
              </>
            );
          })()}

          {/* Custom Rotation Anchors - positioned offset from corner anchors */}
          {(() => {
            // Calculate rotated corner positions
            const rotation = ((groupProps.rotation || 0) * Math.PI) / 180;
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);
            const halfWidth = groupProps.width / 2;
            const halfHeight = groupProps.height / 2;

            // Calculate actual corner positions after rotation
            const topLeftX =
              groupProps.x + (-halfWidth * cos - -halfHeight * sin);
            const topLeftY =
              groupProps.y + (-halfWidth * sin + -halfHeight * cos);

            const topRightX =
              groupProps.x + (halfWidth * cos - -halfHeight * sin);
            const topRightY =
              groupProps.y + (halfWidth * sin + -halfHeight * cos);

            const bottomLeftX =
              groupProps.x + (-halfWidth * cos - halfHeight * sin);
            const bottomLeftY =
              groupProps.y + (-halfWidth * sin + halfHeight * cos);

            const bottomRightX =
              groupProps.x + (halfWidth * cos - halfHeight * sin);
            const bottomRightY =
              groupProps.y + (halfWidth * sin + halfHeight * cos);

            return (
              <>
                <RotationAnchor
                  x={topLeftX}
                  y={topLeftY}
                  corner="top-left"
                  groupCenterX={groupProps.x}
                  groupCenterY={groupProps.y}
                  onRotate={handleRotation}
                  visible={true}
                  stageScale={stageScale}
                />

                <RotationAnchor
                  x={topRightX}
                  y={topRightY}
                  corner="top-right"
                  groupCenterX={groupProps.x}
                  groupCenterY={groupProps.y}
                  onRotate={handleRotation}
                  visible={true}
                  stageScale={stageScale}
                />

                <RotationAnchor
                  x={bottomLeftX}
                  y={bottomLeftY}
                  corner="bottom-left"
                  groupCenterX={groupProps.x}
                  groupCenterY={groupProps.y}
                  onRotate={handleRotation}
                  visible={true}
                  stageScale={stageScale}
                />

                <RotationAnchor
                  x={bottomRightX}
                  y={bottomRightY}
                  corner="bottom-right"
                  groupCenterX={groupProps.x}
                  groupCenterY={groupProps.y}
                  onRotate={handleRotation}
                  visible={true}
                  stageScale={stageScale}
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
          centeredScaling={false}
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
    </React.Fragment>
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
      updatedShape = {
        ...shapeProps,
        x: node.x(),
        y: node.y(),
        radius: Math.max(
          5,
          (shapeProps as CircleShape).radius * Math.max(scaleX, scaleY)
        ),
        rotation: node.rotation(),
      } as CircleShape;
    } else if (shapeProps.type === "star") {
      const starShape = shapeProps as StarShape;
      updatedShape = {
        ...shapeProps,
        x: node.x(),
        y: node.y(),
        innerRadius: Math.max(
          5,
          starShape.innerRadius * Math.max(scaleX, scaleY)
        ),
        outerRadius: Math.max(
          10,
          starShape.outerRadius * Math.max(scaleX, scaleY)
        ),
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
    if (isDragging && !isSelected) return [5, 5];
    return undefined;
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
            cornerRadius={5}
          />
        );

      case "circle":
        const circleShape = shapeProps as CircleShape;
        return <Circle {...commonProps} radius={circleShape.radius} />;

      case "star":
        const starShape = shapeProps as StarShape;
        return (
          <Star
            {...commonProps}
            numPoints={starShape.numPoints}
            innerRadius={starShape.innerRadius}
            outerRadius={starShape.outerRadius}
          />
        );

      default:
        return null;
    }
  };

  return (
    <React.Fragment>
      {renderShape()}
      {(isSelected || isDragging) && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
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
            "top-center",
            "top-right",
            "middle-right",
            "bottom-right",
            "bottom-center",
            "bottom-left",
            "middle-left",
          ]}
        />
      )}
    </React.Fragment>
  );
};

// Initial shapes with different types
const initialShapes: Shape[] = [
  {
    id: "rect1",
    type: "rect",
    x: 200,
    y: 100,
    width: 100,
    height: 80,
    fill: "#4F46E5",
    draggable: true,
  },
  {
    id: "circle1",
    type: "circle",
    x: 400,
    y: 200,
    radius: 50,
    fill: "#EF4444",
    draggable: true,
  },
  {
    id: "star1",
    type: "star",
    x: 600,
    y: 150,
    numPoints: 5,
    innerRadius: 30,
    outerRadius: 50,
    fill: "#F59E0B",
    draggable: true,
  },
];

// Initial groups
const initialGroups: GroupContainer[] = [
  {
    id: "group1",
    type: "group",
    x: 100,
    y: 250,
    width: 100,
    height: 100,
    fill: "transparent",
    draggable: true,
    children: [],
    showBorder: true,
  },
];

const App: React.FC = () => {
  const [shapes, setShapes] = useState<Shape[]>(initialShapes);
  const [groups, setGroups] = useState<GroupContainer[]>(initialGroups);
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

  const handleGroupChange = (index: number, newAttrs: GroupContainer) => {
    const newGroups = groups.slice();
    newGroups[index] = newAttrs;
    setGroups(newGroups);
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

  // Helper function to check if a shape is inside a group
  const getShapeGroup = (shapeId: string): GroupContainer | null => {
    return groups.find((group) => group.children.includes(shapeId)) || null;
  };

  // Function to add a shape to a group
  const addShapeToGroup = (shapeId: string, groupId: string) => {
    const newGroups = groups.map((group) => {
      if (group.id === groupId) {
        return {
          ...group,
          children: [...group.children.filter((id) => id !== shapeId), shapeId],
        };
      }
      // Remove from other groups
      return {
        ...group,
        children: group.children.filter((id) => id !== shapeId),
      };
    });
    setGroups(newGroups);
  };

  return (
    <div className="bg-white min-h-screen relative">
      {/* Toolbar */}
      <div className="absolute top-0 left-0 w-full bg-white border-b-1 border-[#E3E3E3] z-10 p-[15px]">
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
          <div className="flex items-center justify-between h-full w-full">
            <span className="text-[16px] font-semibold text-black">
              Untitled
            </span>
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
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        ref={stageRef}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stageX}
        y={stageY}
      >
        <Layer>
          {/* Render groups first (as background containers) */}
          {groups.map((group, i) => (
            <GroupComponent
              key={group.id}
              groupProps={group}
              isSelected={group.id === selectedId}
              isHovered={group.id === hoveredId}
              isDragging={group.id === draggingId}
              stageScale={stageScale}
              onSelect={() => {
                selectShape(group.id);
              }}
              onChange={(newAttrs) => handleGroupChange(i, newAttrs)}
              onHover={(hovered) => handleShapeHover(group.id, hovered)}
              onDragStart={() => handleDragStart(group.id)}
              onDragEnd={() => handleDragEnd(group.id)}
            >
              {/* Render shapes that belong to this group */}
              {shapes
                .filter((shape, shapeIndex) => {
                  const currentGroup = getShapeGroup(shape.id);
                  return currentGroup?.id === group.id;
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
                        // Adjust position relative to group
                        x: shape.x - group.x,
                        y: shape.y - group.y,
                      }}
                      isSelected={shape.id === selectedId}
                      isHovered={shape.id === hoveredId}
                      isDragging={shape.id === draggingId}
                      onSelect={() => {
                        selectShape(shape.id);
                      }}
                      onChange={(newAttrs) => {
                        // Adjust position back to world coordinates
                        const worldAttrs = {
                          ...newAttrs,
                          x: newAttrs.x + group.x,
                          y: newAttrs.y + group.y,
                        };
                        handleShapeChange(originalIndex, worldAttrs);
                      }}
                      onHover={(hovered) => handleShapeHover(shape.id, hovered)}
                      onDragStart={() => handleDragStart(shape.id)}
                      onDragEnd={() => handleDragEnd(shape.id)}
                    />
                  );
                })}
            </GroupComponent>
          ))}

          {/* Render ungrouped shapes */}
          {shapes
            .filter((shape) => !getShapeGroup(shape.id))
            .map((shape, i) => {
              const originalIndex = shapes.findIndex((s) => s.id === shape.id);
              return (
                <ShapeComponent
                  key={shape.id}
                  shapeProps={shape}
                  isSelected={shape.id === selectedId}
                  isHovered={shape.id === hoveredId}
                  isDragging={shape.id === draggingId}
                  onSelect={() => {
                    selectShape(shape.id);
                  }}
                  onChange={(newAttrs) =>
                    handleShapeChange(originalIndex, newAttrs)
                  }
                  onHover={(hovered) => handleShapeHover(shape.id, hovered)}
                  onDragStart={() => handleDragStart(shape.id)}
                  onDragEnd={() => handleDragEnd(shape.id)}
                />
              );
            })}
        </Layer>
      </Stage>
    </div>
  );
};

export default App;
