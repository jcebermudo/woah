import { LayerContainer } from "@/types/canvasElements";
import React, { useEffect, useRef } from "react";
import { Group, Layer, Rect, Transformer } from "react-konva";
import Konva from "konva";
import { SideAnchor } from "./transformers/anchors";

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

export default function LayerComponent({
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
}: LayerComponentProps) {
    const rectRef = useRef<Konva.Rect>(null);
    const trRef = useRef<Konva.Transformer>(null);

    useEffect(() => {
        if ((isSelected || isDragging) && trRef.current && rectRef.current) {
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
      <Layer
        draggable={true}
        width={layerProps.width}
        height={layerProps.height}
      >
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
                        handleSideAnchorDrag(
                          "bottom",
                          deltaX,
                          deltaY,
                          stageScale
                        )
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
                        handleSideAnchorDrag(
                          "right",
                          deltaX,
                          deltaY,
                          stageScale
                        )
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


}