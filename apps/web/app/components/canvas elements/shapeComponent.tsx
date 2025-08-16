"use client";

import React, { useRef, useEffect, useState } from "react";
import { usePlaybackStore } from "@/app/zustland/store";
import {
  CircleShape,
  RectShape,
  Shape,
  StarShape,
} from "@/types/canvasElements";
import { Rect, Ellipse, Star, Group, Transformer } from "react-konva";
import Konva from "konva";
import { SideAnchor, RotationAnchor } from "./transformers/anchors";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { AnimationManager } from "@/utils/animations";

gsap.registerPlugin(useGSAP);

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
  handleMultiDragEnd: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  stageScale: number;
  worldX: number;
  worldY: number;
  elementRefs: React.RefObject<Map<string, Konva.Node>>;
  isMultipleSelected: boolean; // Add this new prop
  selectedIds: string[];
}

export default function ShapeComponent({
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
  elementRefs,
  isMultipleSelected,
  handleMultiDragEnd,
  selectedIds,
}: ShapeComponentProps) {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const animationManagerRef = useRef<AnimationManager>(new AnimationManager());
  const { timelinePlayhead, isTimelinePlaying, timelineDuration } =
    usePlaybackStore();

  const handleShapeDragEnd = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isMultipleSelected && selectedIds.includes(shapeProps.id)) {
      // This is a multi-drag operation
      handleMultiDragEnd(e);
    } else {
      // Single shape drag
      handleDragEnd(e as Konva.KonvaEventObject<DragEvent>);
    }
  };

  // Dynamic animation system
  useGSAP(() => {
    if (shapeProps.animations?.length) {
      const manager = animationManagerRef.current;

      // Clear existing animations
      manager.killAllAnimations();

      // Create new animations based on shape's animation config
      shapeProps.animations.forEach((animation) => {
        if (animation.enabled) {
          const originalProps = {
            rotation: shapeProps.rotation || 0,
            x: shapeProps.x,
            y: shapeProps.y,
            opacity: 1,
          };

          const timeline = manager.createAnimationTimeline(
            shapeRef.current,
            animation,
            originalProps
          );

          manager.addTimeline(animation.id, timeline);
        }
      });
    }

    // Cleanup function
    return () => {
      animationManagerRef.current.killAllAnimations();
    };
  }, [shapeProps.animations, shapeProps.id]);

  useEffect(() => {
    if (!shapeProps.animations?.length || !shapeRef.current) return;

    const manager = animationManagerRef.current;

    // This effect runs on every playhead change for immediate visual updates
    shapeProps.animations.forEach((animation) => {
      if (animation.enabled) {
        manager.seekAnimationToTime(
          animation.id,
          timelinePlayhead,
          timelineDuration,
          animation
        );
      }
    });
  }, [timelinePlayhead]);

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
    // If multiple shapes are selected, let the main transformer handle updates
    if (isMultipleSelected) {
      return;
    }

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

    console.log("updatedShape", updatedShape);

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
    // Note: deltaX and deltaY are already in the correct coordinate system
    // from layer.getRelativePointerPosition(), so no stage scale adjustment needed

    // Convert rotation to radians for calculations
    const rotation = ((shapeProps.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    // Transform the drag delta to the shape's local coordinate system
    const localDeltaX = deltaX * cos + deltaY * sin;
    const localDeltaY = -deltaX * sin + deltaY * cos;

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
      onDragEnd: handleShapeDragEnd,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onTransformEnd: handleTransformEnd,
      stroke: getStroke(),
      strokeWidth: getStrokeWidth(),
      dash: getDash(),
    };

    switch (shapeProps.type) {
      case "rect":
        const rectShape = shapeProps as RectShape;
        return (
          <Rect
            className="gsap-animated-rect"
            {...commonProps}
            width={rectShape.width}
            height={rectShape.height}
            offsetX={rectShape.width / 2}
            offsetY={rectShape.height / 2}
            cornerRadius={0}
            strokeScaleEnabled={false}
            ref={(node) => {
              if (node && elementRefs.current) {
                elementRefs.current.set(shapeProps.id, node);
              }
              // Also set the shapeRef for GSAP
              shapeRef.current = node;
            }}
            onTransformEnd={handleTransformEnd}
            onDragEnd={handleShapeDragEnd}
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
            ref={(node) => {
              if (node && elementRefs.current) {
                elementRefs.current.set(shapeProps.id, node);
              }
              shapeRef.current = node;
            }}
            onTransformEnd={handleTransformEnd}
            onDragEnd={handleShapeDragEnd}
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
            ref={(node) => {
              if (node && elementRefs.current) {
                elementRefs.current.set(shapeProps.id, node);
              }
              shapeRef.current = node;
            }}
            onTransformEnd={handleTransformEnd}
            onDragEnd={handleShapeDragEnd}
          />
        );

      default:
        return null;
    }
  };

  return <React.Fragment>{renderShape()}</React.Fragment>;
}
