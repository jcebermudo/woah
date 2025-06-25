"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Star,
  Transformer,
  Text,
  Group,
} from "react-konva";
import Konva from "konva";

// Define shape interfaces
interface BaseShape {
  id: string;
  x: number;
  y: number;
  fill: string;
  draggable: boolean;
  rotation?: number;
}

interface RectShape extends BaseShape {
  type: "rect";
  width: number;
  height: number;
}

interface CircleShape extends BaseShape {
  type: "circle";
  radius: number;
}

interface StarShape extends BaseShape {
  type: "star";
  numPoints: number;
  innerRadius: number;
  outerRadius: number;
}

// Define group interface
interface GroupContainer extends BaseShape {
  type: "group";
  width: number;
  height: number;
  children: string[]; // Array of shape IDs contained in this group
  showBorder: boolean;
}

type Shape = RectShape | CircleShape | StarShape;
type Container = GroupContainer;
type CanvasElement = Shape | Container;

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
}

interface GroupComponentProps {
  groupProps: GroupContainer;
  isSelected: boolean;
  isHovered: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onChange: (newAttrs: GroupContainer) => void;
  onHover: (hovered: boolean) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  children: React.ReactNode;
}

// Group Component for containers
const GroupComponent: React.FC<GroupComponentProps> = ({
  groupProps,
  isSelected,
  isHovered,
  isDragging,
  onSelect,
  onChange,
  onHover,
  onDragStart,
  onDragEnd,
  children,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if ((isSelected || isDragging) && trRef.current && groupRef.current) {
      // Attach transformer manually
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isDragging]);

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragStart();
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // The drag is handled by the outer container group
    // e.target is the outer container group, so we get its position
    onChange({
      ...groupProps,
      x: e.target.x(),
      y: e.target.y(),
    });

    // Auto-select the group after dragging (Figma-like behavior)
    onSelect();
    onDragEnd();
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = groupRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1
    node.scaleX(1);
    node.scaleY(1);

    // The inner group (groupRef) handles the transformation
    // but we need to update the outer container position and the dimensions
    const outerGroup = node.getParent();

    // Update group dimensions and keep the outer container position
    const updatedGroup: GroupContainer = {
      ...groupProps,
      x: outerGroup ? outerGroup.x() : groupProps.x, // Get position from outer container
      y: outerGroup ? outerGroup.y() : groupProps.y, // Get position from outer container
      width: Math.max(50, groupProps.width * scaleX),
      height: Math.max(50, groupProps.height * scaleY),
      rotation: outerGroup ? outerGroup.rotation() : groupProps.rotation || 0, // Get rotation from outer container
    };

    onChange(updatedGroup);
  };

  const handleMouseEnter = () => {
    onHover(true);
    document.body.style.cursor = "pointer";
  };

  const handleMouseLeave = () => {
    onHover(false);
    document.body.style.cursor = "default";
  };

  // Determine stroke based on state
  const getStroke = () => {
    if (isSelected) return "#0066ff";
    if (isHovered || isDragging) return "#0066ff";
    if (groupProps.showBorder) return "#ddd";
    return "transparent";
  };

  const getStrokeWidth = () => {
    if (isSelected) return 1.5;
    if (isHovered) return 1.5;
    if (isDragging) return 1.5;
    if (groupProps.showBorder) return 1.5;
    return 0;
  };

  const getDash = () => {
    if (isDragging && !isSelected) return [5, 5];
    if (groupProps.showBorder && !isSelected && !isHovered) return [3, 3];
    return undefined;
  };

  const getFill = () => {
    if (isSelected || isHovered) return "rgba(0, 102, 255, 0.05)";
    return "transparent";
  };

  return (
    <React.Fragment>
      {/* Container Group that moves together but only the inner group gets selected */}
      <Group
        x={groupProps.x}
        y={groupProps.y}
        rotation={groupProps.rotation || 0}
        draggable={groupProps.draggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Group label positioned above the group bounds - not part of selection */}
        <Text
          x={0}
          y={-20}
          text={`Group ${groupProps.id.slice(-1)}`}
          fontSize={12}
          fontFamily="Arial"
          fill={isSelected || isHovered ? "#0066ff" : "#999"}
          fontStyle="bold"
          listening={false} // Prevents this from interfering with selection
        />

        {/* Selectable Group - only this gets the transformer */}
        <Group
          ref={groupRef}
          width={groupProps.width}
          height={groupProps.height}
          onTransformEnd={handleTransformEnd}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={onSelect}
          onTap={onSelect}
        >
          {/* Background rectangle for the group */}
          <Rect
            width={groupProps.width}
            height={groupProps.height}
            fill={getFill()}
            stroke={getStroke()}
            strokeWidth={getStrokeWidth()}
            dash={getDash()}
          />

          {/* Children shapes with clipping */}
          <Group
            clipFunc={(ctx: any) => {
              // Clip children to group bounds
              ctx.rect(0, 0, groupProps.width, groupProps.height);
            }}
          >
            {children}
          </Group>
        </Group>
      </Group>

      {(isSelected || isDragging) && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to minimum size
            if (Math.abs(newBox.width) < 50 || Math.abs(newBox.height) < 50) {
              return oldBox;
            }
            return newBox;
          }}
          // Figma-like styling
          borderStroke="#0066ff"
          borderStrokeWidth={2}
          anchorStroke="#0066ff"
          anchorFill="white"
          anchorStrokeWidth={2}
          anchorSize={isDragging && !isSelected ? 6 : 8}
          anchorCornerRadius={2}
          rotateAnchorOffset={30}
          enabledAnchors={[
            "top-left",
            "top-center",
            "top-right",
            "middle-right",
            "bottom-right",
            "bottom-center",
            "bottom-left",
            "middle-left",
          ]}
        />
      )}
    </React.Fragment>
  );
};

// Generic Shape Component that handles all shape types
const ShapeComponent: React.FC<ShapeComponentProps> = ({
  shapeProps,
  isSelected,
  isHovered,
  isDragging,
  onSelect,
  onChange,
  onHover,
  onDragStart,
  onDragEnd,
}) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<Konva.Transformer>(null);

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
      updatedShape = {
        ...shapeProps,
        x: node.x(),
        y: node.y(),
        radius: Math.max(
          5,
          (shapeProps as CircleShape).radius * Math.max(scaleX, scaleY)
        ),
        rotation: node.rotation(),
      } as CircleShape;
    } else if (shapeProps.type === "star") {
      const starShape = shapeProps as StarShape;
      updatedShape = {
        ...shapeProps,
        x: node.x(),
        y: node.y(),
        innerRadius: Math.max(
          5,
          starShape.innerRadius * Math.max(scaleX, scaleY)
        ),
        outerRadius: Math.max(
          10,
          starShape.outerRadius * Math.max(scaleX, scaleY)
        ),
        rotation: node.rotation(),
      } as StarShape;
    } else {
      updatedShape = shapeProps;
    }

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

  // Determine stroke based on state
  const getStroke = () => {
    if (isSelected) return "#0066ff";
    if (isHovered || isDragging) return "#0066ff";
    return "transparent";
  };

  const getStrokeWidth = () => {
    if (isSelected) return 2;
    if (isHovered) return 1.5;
    if (isDragging) return 2;
    return 0;
  };

  const getDash = () => {
    if (isDragging && !isSelected) return [5, 5];
    return undefined;
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
      onDragEnd: handleDragEnd,
      onTransformEnd: handleTransformEnd,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      stroke: getStroke(),
      strokeWidth: getStrokeWidth(),
      dash: getDash(),
    };

    switch (shapeProps.type) {
      case "rect":
        const rectShape = shapeProps as RectShape;
        return (
          <Rect
            {...commonProps}
            width={rectShape.width}
            height={rectShape.height}
            cornerRadius={5}
          />
        );

      case "circle":
        const circleShape = shapeProps as CircleShape;
        return <Circle {...commonProps} radius={circleShape.radius} />;

      case "star":
        const starShape = shapeProps as StarShape;
        return (
          <Star
            {...commonProps}
            numPoints={starShape.numPoints}
            innerRadius={starShape.innerRadius}
            outerRadius={starShape.outerRadius}
          />
        );

      default:
        return null;
    }
  };

  return (
    <React.Fragment>
      {renderShape()}
      {(isSelected || isDragging) && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to minimum size
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
          // Figma-like styling
          borderStroke="#0066ff"
          borderStrokeWidth={2}
          anchorStroke="#0066ff"
          anchorFill="white"
          anchorStrokeWidth={2}
          anchorSize={isDragging && !isSelected ? 6 : 8}
          anchorCornerRadius={2}
          rotateAnchorOffset={30}
          enabledAnchors={[
            "top-left",
            "top-center",
            "top-right",
            "middle-right",
            "bottom-right",
            "bottom-center",
            "bottom-left",
            "middle-left",
          ]}
        />
      )}
    </React.Fragment>
  );
};

// Initial shapes with different types
const initialShapes: Shape[] = [
  {
    id: "rect1",
    type: "rect",
    x: 50,
    y: 50,
    width: 100,
    height: 100,
    fill: "red",
    draggable: true,
  },
  {
    id: "circle1",
    type: "circle",
    x: 200,
    y: 100,
    radius: 50,
    fill: "green",
    draggable: true,
  },
  {
    id: "star1",
    type: "star",
    x: 350,
    y: 100,
    numPoints: 5,
    innerRadius: 20,
    outerRadius: 40,
    fill: "blue",
    draggable: true,
  },
];

// Initial groups
const initialGroups: GroupContainer[] = [
  {
    id: "group1",
    type: "group",
    x: 100,
    y: 250,
    width: 200,
    height: 150,
    fill: "transparent",
    draggable: true,
    children: [],
    showBorder: true,
  },
  {
    id: "group2",
    type: "group",
    x: 350,
    y: 250,
    width: 180,
    height: 120,
    fill: "transparent",
    draggable: true,
    children: [],
    showBorder: true,
  },
];

const App: React.FC = () => {
  const [shapes, setShapes] = useState<Shape[]>(initialShapes);
  const [groups, setGroups] = useState<GroupContainer[]>(initialGroups);
  const [selectedId, selectShape] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({
    width: 800, // Default width
    height: 600, // Default height
  });

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

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const checkDeselect = (e: any) => {
    // Deselect when clicked on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  const handleShapeChange = (index: number, newAttrs: Shape) => {
    const newShapes = shapes.slice();
    newShapes[index] = newAttrs;
    setShapes(newShapes);
  };

  const handleGroupChange = (index: number, newAttrs: GroupContainer) => {
    const newGroups = groups.slice();
    newGroups[index] = newAttrs;
    setGroups(newGroups);
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

  // Helper function to check if a shape is inside a group
  const getShapeGroup = (shapeId: string): GroupContainer | null => {
    return groups.find((group) => group.children.includes(shapeId)) || null;
  };

  // Function to add a shape to a group
  const addShapeToGroup = (shapeId: string, groupId: string) => {
    const newGroups = groups.map((group) => {
      if (group.id === groupId) {
        return {
          ...group,
          children: [...group.children.filter((id) => id !== shapeId), shapeId],
        };
      }
      // Remove from other groups
      return {
        ...group,
        children: group.children.filter((id) => id !== shapeId),
      };
    });
    setGroups(newGroups);
  };

  return (
    <div className="bg-white min-h-screen">
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={checkDeselect}
        onTouchStart={checkDeselect}
      >
        <Layer>
          {/* Render groups first (as background containers) */}
          {groups.map((group, i) => (
            <GroupComponent
              key={group.id}
              groupProps={group}
              isSelected={group.id === selectedId}
              isHovered={group.id === hoveredId}
              isDragging={group.id === draggingId}
              onSelect={() => {
                selectShape(group.id);
              }}
              onChange={(newAttrs) => handleGroupChange(i, newAttrs)}
              onHover={(hovered) => handleShapeHover(group.id, hovered)}
              onDragStart={() => handleDragStart(group.id)}
              onDragEnd={() => handleDragEnd(group.id)}
            >
              {/* Render shapes that belong to this group */}
              {shapes
                .filter((shape, shapeIndex) => {
                  const currentGroup = getShapeGroup(shape.id);
                  return currentGroup?.id === group.id;
                })
                .map((shape, shapeIndex) => {
                  const originalIndex = shapes.findIndex(
                    (s) => s.id === shape.id
                  );
                  return (
                    <ShapeComponent
                      key={shape.id}
                      shapeProps={{
                        ...shape,
                        // Adjust position relative to group
                        x: shape.x - group.x,
                        y: shape.y - group.y,
                      }}
                      isSelected={shape.id === selectedId}
                      isHovered={shape.id === hoveredId}
                      isDragging={shape.id === draggingId}
                      onSelect={() => {
                        selectShape(shape.id);
                      }}
                      onChange={(newAttrs) => {
                        // Adjust position back to world coordinates
                        const worldAttrs = {
                          ...newAttrs,
                          x: newAttrs.x + group.x,
                          y: newAttrs.y + group.y,
                        };
                        handleShapeChange(originalIndex, worldAttrs);
                      }}
                      onHover={(hovered) => handleShapeHover(shape.id, hovered)}
                      onDragStart={() => handleDragStart(shape.id)}
                      onDragEnd={() => handleDragEnd(shape.id)}
                    />
                  );
                })}
            </GroupComponent>
          ))}

          {/* Render ungrouped shapes */}
          {shapes
            .filter((shape) => !getShapeGroup(shape.id))
            .map((shape, i) => {
              const originalIndex = shapes.findIndex((s) => s.id === shape.id);
              return (
                <ShapeComponent
                  key={shape.id}
                  shapeProps={shape}
                  isSelected={shape.id === selectedId}
                  isHovered={shape.id === hoveredId}
                  isDragging={shape.id === draggingId}
                  onSelect={() => {
                    selectShape(shape.id);
                  }}
                  onChange={(newAttrs) =>
                    handleShapeChange(originalIndex, newAttrs)
                  }
                  onHover={(hovered) => handleShapeHover(shape.id, hovered)}
                  onDragStart={() => handleDragStart(shape.id)}
                  onDragEnd={() => handleDragEnd(shape.id)}
                />
              );
            })}

          {/* Instructions */}
          <Rect
            x={10}
            y={10}
            width={500}
            height={140}
            fill="rgba(255, 255, 255, 0.9)"
            stroke="#ccc"
            strokeWidth={1}
            cornerRadius={5}
          />

          {/* Title */}
          <Text
            x={20}
            y={30}
            text="Multi-Shape Transformer with Groups Demo"
            fontSize={16}
            fontFamily="Arial"
            fill="#333"
            fontStyle="bold"
          />

          {/* Instructions */}
          <Text
            x={20}
            y={50}
            text="Hover to see blue outline • Click to select • Drag to move with boundary"
            fontSize={12}
            fontFamily="Arial"
            fill="#666"
          />

          <Text
            x={20}
            y={70}
            text="Use handles to resize/rotate • Red Rectangle • Green Circle • Blue Star"
            fontSize={12}
            fontFamily="Arial"
            fill="#666"
          />

          <Text
            x={20}
            y={90}
            text="Groups act as containers with clipping • Drag shapes into groups to organize"
            fontSize={12}
            fontFamily="Arial"
            fill="#666"
          />

          <Text
            x={20}
            y={110}
            text="Notice: Groups show dashed borders • Shapes inside groups are clipped to boundaries"
            fontSize={11}
            fontFamily="Arial"
            fill="#888"
          />

          <Text
            x={20}
            y={130}
            text="Try selecting and transforming both individual shapes and entire groups"
            fontSize={11}
            fontFamily="Arial"
            fill="#888"
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default App;
