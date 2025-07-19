// SHAPE TYPES

// Define shape interfaces
export interface BaseShape {
  id: string;
  x: number;
  y: number;
  fill: string;
  draggable: boolean;
  rotation?: number;
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

export type Shape = RectShape | CircleShape | StarShape;

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
