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
