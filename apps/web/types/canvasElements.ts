// SHAPE TYPES

// Define shape interfaces
export interface BaseShape {
  id: string;
  x: number;
  y: number;
  fill: string;
  draggable: boolean;
  rotation?: number;
  animations?: ShapeAnimation[];
}

export interface RectShape extends BaseShape {
  type: "rect";
  width: number;
  height: number;
}

export interface CircleShape extends BaseShape {
  type: "circle";
  width: number;
  height: number;
}

export interface StarShape extends BaseShape {
  type: "star";
  width: number;
  height: number;
  numPoints: number;
  innerRadius: number;
  outerRadius: number;
}

// Enhanced animation types
export interface BaseAnimation {
  id: string;
  type: string;
  duration: number;
  startTime: number;
  enabled: boolean;
  playOnSelect?: boolean;
  repeat?: number; // -1 for infinite
  ease?: string;
}

export interface SpinAnimation extends BaseAnimation {
  type: "spin";
  startTime: number;
  direction: "clockwise" | "counterclockwise";
  degrees?: number; // Default 360
}

export interface PulseAnimation extends BaseAnimation {
  type: "pulse";
  startTime: number;
  scaleFrom: number;
  scaleTo: number;
}

export interface BounceAnimation extends BaseAnimation {
  type: "bounce";
  startTime: number;
  height: number;
  bounces?: number;
}

export interface FadeAnimation extends BaseAnimation {
  type: "fade";
  startTime: number;
  opacityFrom: number;
  opacityTo: number;
}

export interface ShakeAnimation extends BaseAnimation {
  type: "shake";
  startTime: number;
  intensity: number;
  axis: "x" | "y" | "both";
}

export interface BounceUpAnimation extends BaseAnimation {
  type: "Bounce Up";
  startTime: number;
  startLocation: number;
  endLocation: number;
}

export type ShapeAnimation =
  | SpinAnimation
  | PulseAnimation
  | BounceAnimation
  | FadeAnimation
  | ShakeAnimation
  | BounceUpAnimation;

export type Shape = RectShape | CircleShape | StarShape;

// Animation helper types
export interface AnimationTemplate {
  type: string;
  name: string;
  defaultValues: Partial<ShapeAnimation>;
}

export interface ShapeComponentProps {
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

// LAYER TYPES

// Define layer interface (renamed from GroupContainer)
export interface LayerContainer extends BaseShape {
  type: "layer";
  width: number;
  height: number;
  fill: string;
  children: string[]; // Array of shape IDs contained in this layer
  showBorder: boolean;
  duration: number;
}

export type Container = LayerContainer;

export interface LayerComponentProps {
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
