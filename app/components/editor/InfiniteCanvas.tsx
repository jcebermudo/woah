import { useRef, useEffect, useState } from "react";
import { Stage, Layer, Rect, Text } from "react-konva";
import Konva from "konva";
import {
  CircleShape,
  LayerContainer,
  RectShape,
  Shape,
  StarShape,
} from "@/types/canvasElements";
import LayerComponent from "../canvas elements/layerComponent";
import ShapeComponent from "../canvas elements/shapeComponent";

interface InfiniteCanvasProps {
    dimensions: { width: number; height: number };
    handleStageMouseDown: (e: any) => void;
    handleStageMouseMove: (e: any) => void;
    handleStageMouseUp: () => void;
    stageRef: React.RefObject<Konva.Stage | null>;
    stageScale: number;
    stageX: number;
    stageY: number;
    layers: LayerContainer[];
    shapes: Shape[];
    selectedId: string | null;
    hoveredId: string | null;
    draggingId: string | null;
    selectShape: (id: string | null) => void;
    handleLayerChange: (index: number, newAttrs: LayerContainer) => void;
    handleShapeChange: (index: number, newAttrs: Shape) => void;
    handleShapeHover: (shapeId: string, hovered: boolean) => void;
    handleDragStart: (shapeId: string) => void;
    handleDragEnd: (shapeId: string) => void;
    getShapeLayer: (shapeId: string) => LayerContainer | null;
}

export default function InfiniteCanvas({ dimensions, handleStageMouseDown, handleStageMouseMove, handleStageMouseUp, stageRef, stageScale, stageX, stageY, layers, shapes, selectedId, hoveredId, draggingId, selectShape, handleLayerChange, handleShapeChange, handleShapeHover, handleDragStart, handleDragEnd, getShapeLayer }: InfiniteCanvasProps) {
    
    return (
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
            {shapes
              .filter((shape, shapeIndex) => {
                const currentLayer = getShapeLayer(shape.id);
                return currentLayer?.id === layer.id;
              })
              .map((shape, shapeIndex) => {
                const originalIndex = shapes.findIndex(
                  (s) => s.id === shape.id,
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
    );
}