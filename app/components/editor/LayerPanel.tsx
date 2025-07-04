"use client";

import { type Shape, type LayerContainer } from "@/types/canvasElements";
import { ChevronDown, ChevronRight, Circle, Eye, Layers, Square, StarIcon } from "lucide-react";
import Draggable from "../dnd/SortableItem";
import { DndContext } from "@dnd-kit/core";
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
    
    <div className="h-screen pt-[80px] px-[10px] overflow-y-auto">
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
          <div key={layer.id} className="space-y-1">
            {/* Layer header */}
            <div
              className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 ${
                selectedId === layer.id
                  ? "bg-blue-100 border-l-2 border-blue-500"
                  : ""
              }`}
              onClick={() => onSelectLayer(layer.id)}
            >
              <button
                className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerExpansion(layer.id);
                }}
              >
                {layerShapes.length > 0 ? (
                  isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )
                ) : (
                  <div className="w-3 h-3" />
                )}
              </button>
              <Layers className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700 flex-1">
                Layer {layer.id.replace("layer", "")}
              </span>
              <Eye className="w-3 h-3 text-gray-400" />
            </div>

            {/* Layer children */}
            {isExpanded && layerShapes.length > 0 && (
              <div className="ml-6 flex flex-col">
                <DndContext>
                  <SortableContext items={layerShapes.map((shape) => shape.id)}>
                    {layerShapes.map((shape) => (
                      <SortableItem id={shape.id} key={shape.id}>
                        <div
                          key={shape.id}
                          className={`flex flex-row items-center justify-between px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 ${
                            selectedId === shape.id
                              ? "bg-blue-100 border-l-2 border-blue-500"
                              : ""
                          }`}
                          onClick={() => onSelectShape(shape.id)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 flex items-center justify-center text-gray-500">
                              {getShapeIcon(shape)}
                            </div>
                            <span className="text-sm text-gray-700 flex-1">
                              {getShapeName(shape)}
                            </span>
                          </div>
                          <Eye className="w-3 h-3 text-gray-400" />
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
