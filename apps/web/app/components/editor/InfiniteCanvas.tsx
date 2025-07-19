import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Stage, Layer, Rect, Text, Transformer } from "react-konva";
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
  stageRef: React.RefObject<Konva.Stage | null>;
  stageScale: number;
  stageX: number;
  stageY: number;
  layers: LayerContainer[];
  shapes: Shape[];
  selectedIds: string[];
  hoveredId: string | null;
  draggingId: string | null;
  selectShape: (id: string | null) => void;
  handleLayerChange: (index: number, newAttrs: LayerContainer) => void;
  handleShapeChange: (index: number, newAttrs: Shape) => void;
  handleShapeHover: (shapeId: string, hovered: boolean) => void;
  handleDragStart: (shapeId: string) => void;
  handleDragEnd: (shapeId: string) => void;
  getShapeLayer: (shapeId: string) => LayerContainer | null;
  selectionRectangle: {
    visible: boolean;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  transformerRef: React.RefObject<Konva.Transformer | null>;
  elementRefs: React.RefObject<Map<string, Konva.Node>>;
  handleStageClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleTransformEnd: (e: Konva.KonvaEventObject<MouseEvent>) => void;
}

export default function InfiniteCanvas({
  dimensions,
  stageRef,
  stageScale,
  stageX,
  stageY,
  layers,
  shapes,
  selectedIds,
  hoveredId,
  draggingId,
  selectShape,
  handleLayerChange,
  handleShapeChange,
  handleShapeHover,
  handleDragStart,
  handleDragEnd,
  getShapeLayer,
  selectionRectangle,
  transformerRef,
  handleStageClick,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  elementRefs,
  handleTransformEnd,
}: InfiniteCanvasProps) {

  return (
    <Stage
      width={dimensions.width - 250}
      height={dimensions.height - 70}
      style={{ marginLeft: "250px", marginTop: "70px" }}
      onMouseDown={(e) => {
        handleMouseDown?.(e);
      }}
      onMouseMove={(e) => {
        handleMouseMove?.(e);
      }}
      onMouseUp={(e) => {
        handleMouseUp?.(e);
      }}
      ref={stageRef}
      scaleX={stageScale}
      scaleY={stageScale}
      x={stageX}
      y={stageY}
      onClick={handleStageClick}
    >
      <Layer>
        {layers.map((layer, i) => (
          <LayerComponent
            key={layer.id}
            layerProps={layer}
            isSelected={selectedIds.includes(layer.id)}
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
                    isSelected={selectedIds.includes(shape.id)}
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
                    elementRefs={elementRefs}
                    handleMultipleTransformEnd={handleTransformEnd}
                  />
                );
              })}
          </LayerComponent>
        ))}
        {/* Single transformer for all selected shapes */}
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
        {/* Selection rectangle */}
        {selectionRectangle.visible && (
          <Rect
            x={Math.min(selectionRectangle.x1, selectionRectangle.x2)}
            y={Math.min(selectionRectangle.y1, selectionRectangle.y2)}
            width={Math.abs(selectionRectangle.x2 - selectionRectangle.x1)}
            height={Math.abs(selectionRectangle.y2 - selectionRectangle.y1)}
            fill="rgba(41, 169, 255, 0.3)"
            stroke="rgba(97, 191, 255)"
            strokeWidth={1}
            strokeScaleEnabled={false}
          />
        )}
      </Layer>
    </Stage>
  );
}
