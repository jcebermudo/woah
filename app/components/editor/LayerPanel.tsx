"use client";

import { type Shape, type LayerContainer } from "@/types/canvasElements";
import {
  ChevronDown,
  ChevronRight,
  Circle,
  Frame,
  Layers,
  Square,
  StarIcon,
} from "lucide-react";
import Draggable from "../dnd/SortableItem";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";

import { useState } from "react";
import SortableItem from "../dnd/SortableItem";

interface LayerPanelProps {
  layers: LayerContainer[];
  shapes: Shape[];
  selectedId: string | null;
  onSelectLayer: (id: string) => void;
  onSelectShape: (id: string) => void;
  getShapeLayer: (shapeId: string) => LayerContainer | null;
}

export default function LayerPanel({
  layers,
  shapes,
  selectedId,
  onSelectLayer,
  onSelectShape,
  getShapeLayer,
}: LayerPanelProps) {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  )

  const toggleLayerExpansion = (layerId: string) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId);
    } else {
      newExpanded.add(layerId);
    }
    setExpandedLayers(newExpanded);
  };

  const getShapeIcon = (shape: Shape) => {
    switch (shape.type) {
      case "rect":
        return <Square className="w-4 h-4" />;
      case "circle":
        return <Circle className="w-4 h-4" />;
      case "star":
        return <StarIcon className="w-4 h-4" />;
      default:
        return <Square className="w-4 h-4" />;
    }
  };

  const getShapeName = (shape: Shape) => {
    switch (shape.type) {
      case "rect":
        return "Rectangle";
      case "circle":
        return "Circle";
      case "star":
        return "Star";
      default:
        return "Shape";
    }
  };

  return (
    <div className="select-none h-screen pt-[70px] px-[10px] overflow-y-auto">
      {/* Render layers */}

      {layers.map((layer) => {
        const isExpanded = expandedLayers.has(layer.id);
        const layerShapes = shapes
          .filter((shape) => layer.children.includes(shape.id))
          .sort((a, b) => {
            // Sort by the order in the layer.children array, but reverse it
            // so the last added (topmost) shapes appear first in the layer panel
            const indexA = layer.children.indexOf(a.id);
            const indexB = layer.children.indexOf(b.id);
            return indexB - indexA; // Reverse order: later items first
          });

        return (
          <div key={layer.id} className="">
            {/* Layer header */}
            <div
              className={`flex items-center justify-start gap-[10px] p-[10px] rounded-[10px] cursor-pointer hover:bg-[#383838] duration-200 group ${
                selectedId === layer.id ? "bg-[#383838]" : ""
              }`}
              onClick={() => onSelectLayer(layer.id)}
            >
              <button
                className="cursor-pointer w-4 h-4 flex items-center justify-center text-white hover:text-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerExpansion(layer.id);
                }}
              >
                {layerShapes.length > 0 ? (
                  isExpanded ? (
                    <ChevronDown className="hover:text-white duration-200 w-[16px] h-[16px] text-[#808080] stroke-[2px]" />
                  ) : (
                    <ChevronRight className="hover:text-white duration-200 w-[16px] h-[16px] text-[#808080] stroke-[2px]" />
                  )
                ) : (
                  <ChevronRight className="hover:text-white duration-200 w-[16px] h-[16px] text-[#808080] stroke-[2px]" />
                )}
              </button>
              <Frame
                className={`w-[16px] h-[16px] stroke-[2px] duration-200 ${
                  selectedId === layer.id ||
                  // Add hover effect by using group-hover if possible
                  ""
                } ${
                  selectedId === layer.id ? "text-white" : "text-[#808080]"
                } group-hover:text-white`}
              />
              <span className="text-[14px] text-white flex-1 mt-[1px]">
                Layer {layer.id.replace("layer", "")}
              </span>
            </div>

            {/* Layer children */}
            {isExpanded && layerShapes.length > 0 && (
              <div className="ml-[25px] flex flex-col">
                <DndContext sensors={sensors}>
                  <SortableContext items={layerShapes.map((shape) => shape.id)}>
                    {layerShapes.map((shape) => (
                      <SortableItem
                        id={shape.id}
                        key={shape.id}
                        
                      >
                        <div
                          key={shape.id}
                          className={`flex flex-row items-center justify-between p-[10px] rounded-[10px] cursor-pointer hover:bg-[#383838] duration-200 ${
                            selectedId === shape.id ? "bg-[#383838]" : ""
                          }`}
                          onClick={() => onSelectShape(shape.id)}
                        >
                          <div className="flex items-center gap-[10px]">
                            <div className="w-4 h-4 flex items-center justify-center text-[#808080] group-hover:text-white duration-200">
                              {getShapeIcon(shape)}
                            </div>
                            <span className="text-[14px] text-white flex-1 mt-[1px]">
                              {getShapeName(shape)}
                            </span>
                          </div>
                        </div>
                      </SortableItem>
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
