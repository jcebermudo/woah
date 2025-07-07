import { useRef } from "react";
import { Ellipse, Rect } from "react-konva";

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

export function SideAnchor({
  x,
  y,
  width,
  height,
  side,
  onDrag,
  visible,
  rotation = 0,
}: SideAnchorProps) {
  const dragStartPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  if (!visible) return null;

  const getCursor = () => {
    const rotationRad = (rotation * Math.PI) / 180;

    let perpAngle = 0;
    switch (side) {
      case "top":
      case "bottom":
        perpAngle = rotationRad + Math.PI / 2;
        break;
      case "left":
      case "right":
        perpAngle = rotationRad;
        break;
    }

    perpAngle = ((perpAngle % Math.PI) + Math.PI) % Math.PI;

    const perpDegrees = (perpAngle * 180) / Math.PI;

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
}

export function RotationAnchor({
  x,
  y,
  corner,
  groupCenterX,
  groupCenterY,
  onRotate,
  visible,
  stageScale,
  currentRotation,
}: RotationAnchorProps) {
  const isDragging = useRef(false);
  const startAngle = useRef(0);
  const initialRotation = useRef(0);

  if (!visible) return null;

  const getOffset = (stageScale: number) => {
    const baseOffset = 12;
    const offset = baseOffset / stageScale;

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
}
