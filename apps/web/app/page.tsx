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
import {
  CircleShape,
  LayerContainer,
  RectShape,
  Shape,
  StarShape,
} from "@/types/canvasElements";
import InfiniteCanvas from "./components/editor/InfiniteCanvas";
import PropertiesPanel from "./components/editor/PropertiesPanel";

// Initial layers (renamed from initialGroups)
const initialLayers: LayerContainer[] = [
  {
    id: "Scene 1",
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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

  const [selectionRectangle, setSelectionRectangle] = useState({
    visible: false,
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  });

  // bounding boxes
  const degToRad = (angle: number) => (angle / 180) * Math.PI;

  const getCorner = (
    pivotX: number,
    pivotY: number,
    diffX: number,
    diffY: number,
    angle: number,
  ) => {
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);
    angle += Math.atan2(diffY, diffX);
    const x = pivotX + distance * Math.cos(angle);
    const y = pivotY + distance * Math.sin(angle);
    return { x, y };
  };

  const getClientRect = (element: Shape) => {
    const x = element.x - element.width / 2;
    const y = element.y - element.height / 2;
    const width = element.width;
    const height = element.height;
    const rotation = element.rotation || 0;
    const rad = degToRad(rotation);

    const p1 = getCorner(x, y, 0, 0, rad);
    const p2 = getCorner(x, y, width, 0, rad);
    const p3 = getCorner(x, y, width, height, rad);
    const p4 = getCorner(x, y, 0, height, rad);

    const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  const isSelecting = useRef(false);
  const transformerRef = useRef<Konva.Transformer>(null);
  const rectRefs = useRef(new Map<string, Konva.Rect>());

  const stageRef = useRef<Konva.Stage>(null);

  // Click handler for stage
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // If we are selecting with rect, do nothing
    if (selectionRectangle.visible) {
      return;
    }

    // If click on empty area - remove all selections
    if (e.target === e.target.getStage()) {
      setSelectedIds([]);
      return;
    }

    // Do nothing if clicked NOT on our rectangles
    if (!e.target.hasName(["rect", "circle", "star"])) {
      return;
    }

    const clickedId = e.target.id();

    const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;

    const isSelected = selectedIds.includes(clickedId);

    if (!metaPressed && !isSelected) {
      // If no key pressed and the node is not selected
      // select just one
      setSelectedIds([clickedId]);
    } else if (metaPressed && isSelected) {
      // If we pressed keys and node was selected
      // we need to remove it from selection
      setSelectedIds(selectedIds.filter((id) => id !== clickedId));
    } else if (metaPressed && !isSelected) {
      // Add the node into selection
      setSelectedIds([...selectedIds, clickedId]);
    }
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Find which rectangle(s) were transformed
    const id = e.target.id();
    const node = e.target;
    setShapes((prevShapes) => {
      const newShapes = [...prevShapes];

      // Update each transformed node
      const index = newShapes.findIndex((r) => r.id === id);

      if (index !== -1) {
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Reset scale
        node.scaleX(1);
        node.scaleY(1);

        // Update the state with new values
        newShapes[index] = {
          ...newShapes[index],
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(node.height() * scaleY),
          rotation: node.rotation(),
        };
      }

      return newShapes;
    });
  };

  // Update transformer when selection changes
  useEffect(() => {
    if (selectedIds.length && transformerRef.current) {
      // Get the nodes from the refs Map
      const nodes = selectedIds
        .map((id) => rectRefs.current.get(id))
        .filter((node) => node);

      transformerRef.current.nodes(nodes as Konva.Node[]);
    } else if (transformerRef.current) {
      // Clear selection
      transformerRef.current.nodes([]);
    }
  }, [selectedIds]);

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
      setSelectedIds([]);
    }
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isSpacePressed) {
      setIsDraggingCanvas(true);
      document.body.style.cursor = "grabbing";
      const pos = e.target.getStage()?.getPointerPosition();
      setLastPointerPosition({ x: pos?.x || 0, y: pos?.y || 0 });
      return;
    }
    checkDeselect(e);

    // Do nothing if we mousedown on any shape
    if (e.target !== e.target.getStage()) {
      return;
    }
    // Start selection rectangle
    isSelecting.current = true;
    const pos = e.target.getStage()?.getPointerPosition();
    const posX = ((pos?.x || 0) - stageX) / stageScale;
    const posY = ((pos?.y || 0) - stageY) / stageScale;
    setSelectionRectangle({
      visible: true,
      x1: posX || 0,
      y1: posY || 0,
      x2: posX || 0,
      y2: posY || 0,
    });
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isDraggingCanvas && isSpacePressed) {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();

      const dx = (pos?.x || 0) - lastPointerPosition.x;
      const dy = (pos?.y || 0) - lastPointerPosition.y;

      setStageX(stageX + dx);
      setStageY(stageY + dy);

      setLastPointerPosition({ x: pos?.x || 0, y: pos?.y || 0 });
    }

    // Do nothing if we didn't start selection
    if (!isSelecting.current) {
      return;
    }

    const pos = e.target.getStage()?.getPointerPosition();
    const posX = ((pos?.x || 0) - stageX) / stageScale;
    const posY = ((pos?.y || 0) - stageY) / stageScale;
    setSelectionRectangle({
      ...selectionRectangle,
      x2: posX || 0,
      y2: posY || 0,
    });
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isDraggingCanvas) {
      setIsDraggingCanvas(false);
      if (isSpacePressed) {
        document.body.style.cursor = "grab";
      } else {
        document.body.style.cursor = "default";
      }
    }

    // Do nothing if we didn't start selection
    if (!isSelecting.current) {
      return;
    }
    isSelecting.current = false;

    // Update visibility in timeout, so we can check it in click event
    setTimeout(() => {
      setSelectionRectangle({
        ...selectionRectangle,
        visible: false,
      });
    });

    const selBox = {
      x: Math.min(selectionRectangle.x1, selectionRectangle.x2),
      y: Math.min(selectionRectangle.y1, selectionRectangle.y2),
      width: Math.abs(selectionRectangle.x2 - selectionRectangle.x1),
      height: Math.abs(selectionRectangle.y2 - selectionRectangle.y1),
    };

    const selected = shapes.filter((shape) => {
      // Check if rectangle intersects with selection box
      return Konva.Util.haveIntersection(selBox, getClientRect(shape));
    });

    setSelectedIds(selected.map((shape) => shape.id));
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
    const id = shapeId;
    setShapes((prevShapes) => {
      const newShapes = [...prevShapes];
      const index = newShapes.findIndex((r) => r.id === id);
      if (index !== -1) {
        newShapes[index] = {
          ...newShapes[index],
          x: newShapes[index].x,
          y: newShapes[index].y,
        };
      }
      return newShapes;
    });
  };

  // Helper function to check if a shape is inside a layer
  const getShapeLayer = (shapeId: string): LayerContainer | null => {
    return layers.find((layer) => layer.children.includes(shapeId)) || null;
  };

  // Helper function to check if a layer is currently selected
  const isLayerSelected = (): boolean => {
    if (!selectedIds) return false;
    console.log(selectedIds);
    return layers.some((layer) => selectedIds.includes(layer.id));
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
    if (!selectedIds) return;

    // Check if selected item is a layer
    const selectedLayer = layers.find((layer) =>
      selectedIds.includes(layer.id),
    );
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
    setSelectedIds([newShapeId]);
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
    setSelectedIds([newLayerId]);
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
          selectedIds={selectedIds}
          onSelectLayer={(id) => setSelectedIds([id])}
          onSelectShape={(id) => setSelectedIds([id])}
          getShapeLayer={(id) => getShapeLayer(id)}
        />
      </div>
      <div className="absolute top-0 right-0 w-[250px] h-screen bg-white border-l border-[#E3E3E3] z-10">
        <PropertiesPanel
          selectedIds={selectedIds}
          shapes={shapes}
          layers={layers}
          handleShapeChange={handleShapeChange}
          handleLayerChange={handleLayerChange}
        />
      </div>
      <InfiniteCanvas
        dimensions={dimensions}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        stageRef={stageRef}
        stageScale={stageScale}
        stageX={stageX}
        stageY={stageY}
        layers={layers}
        shapes={shapes}
        selectedIds={selectedIds}
        hoveredId={hoveredId}
        draggingId={draggingId}
        selectShape={(id: string | null) => {
          if (id) {
            setSelectedIds([id]);
          } else {
            setSelectedIds([]);
          }
        }}
        handleLayerChange={handleLayerChange}
        handleShapeChange={handleShapeChange}
        handleShapeHover={handleShapeHover}
        handleDragStart={handleDragStart}
        handleDragEnd={handleDragEnd}
        getShapeLayer={getShapeLayer}
        selectionRectangle={selectionRectangle}
        transformerRef={transformerRef}
        handleStageClick={handleStageClick}
      />
    </div>
  );
};

export default App;
