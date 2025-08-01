import {
  Shape,
  RectShape,
  CircleShape,
  StarShape,
} from "@/types/canvasElements";
import { LargeNumberLike } from "crypto";

export interface VirtualShape {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  originalShapes: Shape[];
  originalBounds: Array<{
    shape: Shape;
    relativeX: number;
    relativeY: number;
    originalWidth: number;
    originalHeight: number;
    originalRotation: number;
  }>;
}

export class VirtualShapeContainer {
  private virtualShape: VirtualShape | null = null;

  constructor(
    private onShapeChange: (shapeId: string, newAttrs: Partial<Shape>) => void,
  ) {}

  // Create virtual shape from selected shapes
  createVirtualShape(selectedShapes: Shape[]): VirtualShape {}
}
