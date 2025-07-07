"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Rect,
  Ellipse,
  Star,
  Transformer,
  Text,
  Group,
} from "react-konva";
import Konva from "konva";

import LayerPanel from "@/app/components/editor/LayerPanel";
import Toolbar from "@/app/components/editor/Toolbar";
import LayerComponent from "./components/canvas elements/layerComponent";
import ShapeComponent from "./components/canvas elements/shapeComponent";
import { CircleShape, LayerContainer, RectShape, Shape, StarShape } from "@/types/canvasElements";
import InfiniteCanvas from "./components/editor/InfiniteCanvas";
import PropertiesPanel from "./components/editor/PropertiesPanel";


// Initial layers (renamed from initialGroups)
const initialLayers: LayerContainer[] = [
  {
    id: "layer1",
    type: "layer",
    x: 400,
    y: 300,
    width: 600,
    height: 400,
    fill: "#ffffff",
    draggable: true,
    children: [], // No initial children
    showBorder: true,
  },
];

const App: React.FC = () => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [layers, setLayers] = useState<LayerContainer[]>(initialLayers);
  const [selectedId, selectShape] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({
    width: 800, // Default width
    height: 600, // Default height
  });

  // Infinite canvas state
  const [stageScale, setStageScale] = useState(1);
  const [stageX, setStageX] = useState(0);
  const [stageY, setStageY] = useState(0);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [lastPointerPosition, setLastPointerPosition] = useState({
    x: 0,
    y: 0,
  });

  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    // Update dimensions when component mounts
    setDimensions({ 
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Handle window resize
    function handleResize() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Handle keyboard events for space key
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" && !isSpacePressed) {
        setIsSpacePressed(true);
        document.body.style.cursor = "grab";
        e.preventDefault();
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        setIsDraggingCanvas(false);
        document.body.style.cursor = "default";
        e.preventDefault();
      }
    }

    // Handle zoom with wheel
    function handleWheel(e: WheelEvent) {
      // Check if Cmd (Mac) or Ctrl (Windows/Linux) is pressed for zoom
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();

        const stage = stageRef.current;
        if (!stage) return;

        const oldScale = stageScale;
        const pointer = stage.getPointerPosition();

        if (!pointer) return;

        const mousePointTo = {
          x: (pointer.x - stageX) / oldScale,
          y: (pointer.y - stageY) / oldScale,
        };

        // Determine zoom direction and amount
        const direction = e.deltaY > 0 ? -1 : 1;
        const zoomFactor = 1.1;
        const newScale =
          direction > 0 ? oldScale * zoomFactor : oldScale / zoomFactor;

        // Clamp scale between reasonable limits
        const clampedScale = Math.max(0.1, Math.min(5, newScale));

        const newPos = {
          x: pointer.x - mousePointTo.x * clampedScale,
          y: pointer.y - mousePointTo.y * clampedScale,
        };

        setStageScale(clampedScale);
        setStageX(newPos.x);
        setStageY(newPos.y);
      } else {
        // Regular scrolling for panning up/down and left/right
        e.preventDefault();

        const scrollSpeed = 1; // Adjust scroll sensitivity
        const deltaX = e.deltaX * scrollSpeed;
        const deltaY = e.deltaY * scrollSpeed;

        // Update stage position for scrolling
        setStageX(stageX - deltaX);
        setStageY(stageY - deltaY);
      }
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("wheel", handleWheel, { passive: false });

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [stageScale, stageX, stageY, isSpacePressed]);

  const checkDeselect = (e: any) => {
    // Don't deselect when panning
    if (isDraggingCanvas) return;

    // Deselect when clicked on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  const handleStageMouseDown = (e: any) => {
    if (isSpacePressed) {
      setIsDraggingCanvas(true);
      document.body.style.cursor = "grabbing";
      const pos = e.target.getStage().getPointerPosition();
      setLastPointerPosition({ x: pos.x, y: pos.y });
      return;
    }
    checkDeselect(e);
  };

  const handleStageMouseMove = (e: any) => {
    if (isDraggingCanvas && isSpacePressed) {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();

      const dx = pos.x - lastPointerPosition.x;
      const dy = pos.y - lastPointerPosition.y;

      setStageX(stageX + dx);
      setStageY(stageY + dy);

      setLastPointerPosition({ x: pos.x, y: pos.y });
    }
  };

  const handleStageMouseUp = () => {
    if (isDraggingCanvas) {
      setIsDraggingCanvas(false);
      if (isSpacePressed) {
        document.body.style.cursor = "grab";
      } else {
        document.body.style.cursor = "default";
      }
    }
  };

  const handleShapeChange = (index: number, newAttrs: Shape) => {
    const newShapes = shapes.slice();
    newShapes[index] = newAttrs;
    setShapes(newShapes);
  };

  const handleLayerChange = (index: number, newAttrs: LayerContainer) => {
    const newLayers = layers.slice();
    newLayers[index] = newAttrs;
    setLayers(newLayers);
  };

  const handleShapeHover = (shapeId: string, hovered: boolean) => {
    setHoveredId(hovered ? shapeId : null);
  };

  const handleDragStart = (shapeId: string) => {
    setDraggingId(shapeId);
  };

  const handleDragEnd = (shapeId: string) => {
    setDraggingId(null);
  };

  // Helper function to check if a shape is inside a layer
  const getShapeLayer = (shapeId: string): LayerContainer | null => {
    return layers.find((layer) => layer.children.includes(shapeId)) || null;
  };

  // Helper function to check if a layer is currently selected
  const isLayerSelected = (): boolean => {
    if (!selectedId) return false;
    console.log(selectedId);
    return layers.some((layer) => layer.id === selectedId);
  };

  // Function to add a shape to a layer
  const addShapeToLayer = (shapeId: string, layerId: string) => {
    const newLayers = layers.map((layer) => {
      if (layer.id === layerId) {
        return {
          ...layer,
          children: [...layer.children.filter((id) => id !== shapeId), shapeId],
        };
      }
      // Remove from other layers
      return {
        ...layer,
        children: layer.children.filter((id) => id !== shapeId),
      };
    });
    setLayers(newLayers);
  };

  const addShapeToSelectedLayer = (shapeType: "rect" | "circle" | "star") => {
    if (!selectedId) return;

    // Check if selected item is a layer
    const selectedLayer = layers.find((layer) => layer.id === selectedId);
    if (!selectedLayer) return;

    // Create new shape ID
    const newShapeId = `${shapeType}_${Date.now()}`;

    let newShape: Shape;

    // Create shape based on type
    switch (shapeType) {
      case "rect":
        newShape = {
          id: newShapeId,
          type: "rect",
          x: selectedLayer.x,
          y: selectedLayer.y,
          width: 100,
          height: 80,
          fill: "#4F46E5",
          draggable: true,
        } as RectShape;
        break;

      case "circle":
        newShape = {
          id: newShapeId,
          type: "circle",
          x: selectedLayer.x,
          y: selectedLayer.y,
          width: 100,
          height: 100,
          fill: "#EF4444",
          draggable: true,
        } as CircleShape;
        break;

      case "star":
        newShape = {
          id: newShapeId,
          type: "star",
          x: selectedLayer.x,
          y: selectedLayer.y,
          width: 100,
          height: 100,
          numPoints: 5,
          innerRadius: 17,
          outerRadius: 40,
          fill: "#F59E0B",
          draggable: true,
        } as StarShape;
        break;
    }

    // Add shape to shapes array
    setShapes([...shapes, newShape]);

    // Add shape to layer's children
    addShapeToLayer(newShapeId, selectedLayer.id);

    // Select the newly created shape
    selectShape(newShapeId);
  };

  const addNewLayer = () => {
    // Find the rightmost position of existing layers
    let rightmostX = 0;
    if (layers.length > 0) {
      rightmostX = Math.max(
        ...layers.map((layer) => layer.x + layer.width / 2),
      );
    }

    // Create new layer ID
    const newLayerId = `layer${layers.length + 1}`;

    // Position the new layer 50px to the right of the rightmost layer
    const newX = rightmostX + 50 + 1920 / 2; // Add half width to center the layer

    const newLayer: LayerContainer = {
      id: newLayerId,
      type: "layer",
      x: newX,
      y: 300, // Default y position
      width: 1920,
      height: 1080,
      fill: "#ffffff",
      draggable: true,
      children: [],
      showBorder: true,
    };

    // Add the new layer to the layers array
    setLayers([...layers, newLayer]);

    // Select the newly created layer
    selectShape(newLayerId);
  };

  return (
    <div className="bg-[#323232] h-screen overflow-hidden">
      {/* Toolbar */}
      <Toolbar
        addNewLayer={addNewLayer}
        isLayerSelected={isLayerSelected}
        addShapeToSelectedLayer={addShapeToSelectedLayer}
        stageScale={stageScale}
      />
      {/* Sidebar */}
      <div className="absolute top-0 left-0 w-[250px] h-screen bg-[#232323] border-r border-[#474747] z-10">
        <LayerPanel
          layers={layers}
          shapes={shapes}
          selectedId={selectedId}
          onSelectLayer={(id) => selectShape(id)}
          onSelectShape={(id) => selectShape(id)}
          getShapeLayer={(id) => getShapeLayer(id)}
        />
      </div>
      <div className="absolute top-0 right-0 w-[250px] h-screen bg-white border-l border-[#E3E3E3] z-10">
        <PropertiesPanel
          selectedId={selectedId}
          shapes={shapes}
          layers={layers}
          handleShapeChange={handleShapeChange}
          handleLayerChange={handleLayerChange}
        />
      </div>
      <InfiniteCanvas
        dimensions={dimensions}
        handleStageMouseDown={handleStageMouseDown}
        handleStageMouseMove={handleStageMouseMove}
        handleStageMouseUp={handleStageMouseUp}
        stageRef={stageRef}
        stageScale={stageScale}
        stageX={stageX}
        stageY={stageY}
        layers={layers}
        shapes={shapes}
        selectedId={selectedId}
        hoveredId={hoveredId}
        draggingId={draggingId}
        selectShape={selectShape}
        handleLayerChange={handleLayerChange}
        handleShapeChange={handleShapeChange}
        handleShapeHover={handleShapeHover}
        handleDragStart={handleDragStart}
        handleDragEnd={handleDragEnd}
        getShapeLayer={getShapeLayer}
      />
    </div>
  );
};

export default App;
