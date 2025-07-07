"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
  selected: boolean;
}

interface TransformHandle {
  x: number;
  y: number;
  type: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
}

export default function Testing() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rectangle, setRectangle] = useState<Rectangle>({
    x: 150,
    y: 100,
    width: 200,
    height: 150,
    selected: true,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialRect, setInitialRect] = useState<Rectangle | null>(null);

  const getTransformHandles = useCallback(
    (rect: Rectangle): TransformHandle[] => {
      const handles: TransformHandle[] = [];
      const { x, y, width, height } = rect;

      // Corner handles
      handles.push({ x: x - 4, y: y - 4, type: "nw" });
      handles.push({ x: x + width - 4, y: y - 4, type: "ne" });
      handles.push({ x: x + width - 4, y: y + height - 4, type: "se" });
      handles.push({ x: x - 4, y: y + height - 4, type: "sw" });

      // Edge handles
      handles.push({ x: x + width / 2 - 4, y: y - 4, type: "n" });
      handles.push({ x: x + width - 4, y: y + height / 2 - 4, type: "e" });
      handles.push({ x: x + width / 2 - 4, y: y + height - 4, type: "s" });
      handles.push({ x: x - 4, y: y + height / 2 - 4, type: "w" });

      return handles;
    },
    [],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid
    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw rectangle
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);

    // Draw rectangle border
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.strokeRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);

    // Draw selection and transform handles if selected
    if (rectangle.selected) {
      // Selection border
      ctx.strokeStyle = "#0066ff";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        rectangle.x - 1,
        rectangle.y - 1,
        rectangle.width + 2,
        rectangle.height + 2,
      );
      ctx.setLineDash([]);

      // Transform handles
      const handles = getTransformHandles(rectangle);
      handles.forEach((handle) => {
        ctx.fillStyle = "#0066ff";
        ctx.fillRect(handle.x, handle.y, 8, 8);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(handle.x, handle.y, 8, 8);
      });
    }
  }, [rectangle, getTransformHandles]);

  const getMousePos = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const hitTestHandle = useCallback(
    (mousePos: { x: number; y: number }) => {
      if (!rectangle.selected) return null;

      const handles = getTransformHandles(rectangle);
      for (const handle of handles) {
        if (
          mousePos.x >= handle.x &&
          mousePos.x <= handle.x + 8 &&
          mousePos.y >= handle.y &&
          mousePos.y <= handle.y + 8
        ) {
          return handle.type;
        }
      }
      return null;
    },
    [rectangle, getTransformHandles],
  );

  const hitTestRectangle = useCallback(
    (mousePos: { x: number; y: number }) => {
      return (
        mousePos.x >= rectangle.x &&
        mousePos.x <= rectangle.x + rectangle.width &&
        mousePos.y >= rectangle.y &&
        mousePos.y <= rectangle.y + rectangle.height
      );
    },
    [rectangle],
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      const mousePos = getMousePos(e);
      const handle = hitTestHandle(mousePos);

      if (handle) {
        setIsResizing(handle);
        setInitialRect({ ...rectangle });
        setDragStart(mousePos);
      } else if (hitTestRectangle(mousePos)) {
        setIsDragging(true);
        setDragStart({
          x: mousePos.x - rectangle.x,
          y: mousePos.y - rectangle.y,
        });
      } else {
        setRectangle((prev) => ({ ...prev, selected: false }));
      }
    },
    [rectangle, getMousePos, hitTestHandle, hitTestRectangle],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const mousePos = getMousePos(e);

      if (isResizing && initialRect) {
        const deltaX = mousePos.x - dragStart.x;
        const deltaY = mousePos.y - dragStart.y;

        let newRect = { ...initialRect };

        switch (isResizing) {
          case "nw":
            newRect.x = initialRect.x + deltaX;
            newRect.y = initialRect.y + deltaY;
            newRect.width = initialRect.width - deltaX;
            newRect.height = initialRect.height - deltaY;
            break;
          case "n":
            newRect.y = initialRect.y + deltaY;
            newRect.height = initialRect.height - deltaY;
            break;
          case "ne":
            newRect.y = initialRect.y + deltaY;
            newRect.width = initialRect.width + deltaX;
            newRect.height = initialRect.height - deltaY;
            break;
          case "e":
            newRect.width = initialRect.width + deltaX;
            break;
          case "se":
            newRect.width = initialRect.width + deltaX;
            newRect.height = initialRect.height + deltaY;
            break;
          case "s":
            newRect.height = initialRect.height + deltaY;
            break;
          case "sw":
            newRect.x = initialRect.x + deltaX;
            newRect.width = initialRect.width - deltaX;
            newRect.height = initialRect.height + deltaY;
            break;
          case "w":
            newRect.x = initialRect.x + deltaX;
            newRect.width = initialRect.width - deltaX;
            break;
        }

        // Minimum size constraints
        if (newRect.width < 20) newRect.width = 20;
        if (newRect.height < 20) newRect.height = 20;

        setRectangle(newRect);
      } else if (isDragging) {
        setRectangle((prev) => ({
          ...prev,
          x: mousePos.x - dragStart.x,
          y: mousePos.y - dragStart.y,
          selected: true,
        }));
      } else {
        // Update cursor based on what's under the mouse
        const handle = hitTestHandle(mousePos);
        if (handle) {
          const cursors = {
            nw: "nw-resize",
            n: "n-resize",
            ne: "ne-resize",
            e: "e-resize",
            se: "se-resize",
            s: "s-resize",
            sw: "sw-resize",
            w: "w-resize",
          };
          canvas.style.cursor = cursors[handle];
        } else if (hitTestRectangle(mousePos)) {
          canvas.style.cursor = "move";
        } else {
          canvas.style.cursor = "default";
        }
      }
    },
    [
      isDragging,
      isResizing,
      dragStart,
      initialRect,
      getMousePos,
      hitTestHandle,
      hitTestRectangle,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
    setInitialRect(null);
  }, []);

  const handleCanvasClick = useCallback(
    (e: MouseEvent) => {
      const mousePos = getMousePos(e);
      if (hitTestRectangle(mousePos)) {
        setRectangle((prev) => ({ ...prev, selected: true }));
      }
    },
    [getMousePos, hitTestRectangle],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("click", handleCanvasClick);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleCanvasClick]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border border-gray-300 bg-white shadow-lg"
      />
    </div>
  );
}
