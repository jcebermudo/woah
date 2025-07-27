"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { ShapeAnimation } from "@/types/canvasElements";

interface AnimationBarProps {
  animation: ShapeAnimation;
  totalDuration: number;
  timelineWidth: number;
  zoomLevel: number;
  panOffset: number;
  onAnimationChange: (updatedAnimation: ShapeAnimation) => void;
  onSelect: () => void;
  isSelected: boolean;
}

interface DragState {
  isDragging: boolean;
  dragType: "move" | "resize-left" | "resize-right" | null;
  startX: number;
  startTime: number;
  startDuration: number;
}

export default function AnimationBar({
  animation,
  totalDuration,
  timelineWidth,
  zoomLevel,
  panOffset,
  onAnimationChange,
  onSelect,
  isSelected,
}: AnimationBarProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    startX: 0,
    startTime: 0,
    startDuration: 0,
  });

  const barRef = useRef<HTMLDivElement>(null);

  const screenStartPosition =
    (animation.startTime / totalDuration) * timelineWidth * zoomLevel -
    panOffset;
  const screenWidth =
    (animation.duration / totalDuration) * timelineWidth * zoomLevel;

  const getAnimationColor = (type: string) => {
    switch (type) {
      case "spin":
        return "#FF6B6B";
      case "pulse":
        return "#4ECDC4";
      case "bounce":
        return "#45B7D1";
      case "fade":
        return "#96CEB4";
      case "shake":
        return "#FFEAA7";
      default:
        return "#DDA0DD";
    }
  };

  const handleMouseDown = useCallback(
    (
      e: React.MouseEvent,
      dragType: "move" | "resize-left" | "resize-right"
    ) => {
      e.stopPropagation();

      onSelect();

      setDragState({
        isDragging: true,
        dragType,
        startX: e.clientX,
        startTime: animation.startTime,
        startDuration: animation.duration,
      });
    },
    [animation.startTime, animation.duration, onSelect]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging || !dragState.dragType) return;

      const deltaX = e.clientX - dragState.startX;
      const timeDelta = (deltaX + panOffset) / (zoomLevel * timelineWidth);

      let newStartTime = dragState.startTime;
      let newDuration = dragState.startDuration;

      switch (dragState.dragType) {
        case "move":
          newStartTime = Math.max(
            0,
            Math.min(
              totalDuration - animation.duration,
              dragState.startTime + timeDelta
            )
          );
          break;

        case "resize-left":
          const newStart = Math.max(
            0,
            Math.min(
              dragState.startTime + dragState.startDuration - 0.1,
              dragState.startTime + timeDelta
            )
          );
          newDuration =
            dragState.startDuration + (dragState.startTime - newStart);
          newStartTime = newStart;
          break;

        case "resize-right":
          newDuration = Math.max(
            0.1,
            Math.min(
              totalDuration - dragState.startTime,
              dragState.startDuration + timeDelta
            )
          );
          break;
      }

      onAnimationChange({
        ...animation,
        startTime: newStartTime,
        duration: newDuration,
      });
    },
    [
      dragState,
      animation,
      totalDuration,
      timelineWidth,
      zoomLevel,
      panOffset,
      onAnimationChange,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      dragType: null,
      startX: 0,
      startTime: 0,
      startDuration: 0,
    });
  }, []);

  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  if (
    screenStartPosition + screenWidth < 0 ||
    screenStartPosition > window.innerWidth
  ) {
    return null;
  }

  const color = getAnimationColor(animation.type);

  return (
    <div
      ref={barRef}
      className={`absolute h-[36px] rounded-md flex items-center border border-opacity-50 select-none ${
        isSelected ? "ring-2 ring-white ring-opacity-50" : ""
      }`}
      style={{
        left: `${screenStartPosition + 30}px`,
        width: `${Math.max(20, screenWidth)}px`,
        backgroundColor: color,
        borderColor: color,
        opacity: animation.enabled ? 0.8 : 0.4,
        cursor: dragState.isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={(e) => handleMouseDown(e, "move")}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 w-2 h-full bg-white bg-opacity-20 cursor-ew-resize hover:bg-opacity-40 rounded-l-md"
        onMouseDown={(e) => handleMouseDown(e, "resize-left")}
      />

      {/* Content */}
      <div className="flex-1 px-2 text-white text-xs font-medium truncate pointer-events-none">
        {animation.type}
        {animation.repeat === -1 && " ∞"}
      </div>

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 w-2 h-full bg-white bg-opacity-20 cursor-ew-resize hover:bg-opacity-40 rounded-r-md"
        onMouseDown={(e) => handleMouseDown(e, "resize-right")}
      />
    </div>
  );
}
