import { LayerContainer, Shape } from "@/types/canvasElements";

interface PropertiesPanelProps {
  selectedIds: string[];
  shapes: Shape[];
  layers: LayerContainer[];
  handleShapeChange: (index: number, newAttrs: Shape) => void;
  handleLayerChange: (index: number, newAttrs: LayerContainer) => void;
}

export default function PropertiesPanel({
  selectedIds,
  shapes,
  layers,
  handleShapeChange,
  handleLayerChange,
}: PropertiesPanelProps) {
  const selectedShape = shapes.find((shape) => selectedIds.includes(shape.id));
  const selectedLayer = layers.find((layer) => selectedIds.includes(layer.id));

  const selectedType = selectedShape?.type || selectedLayer?.type || "None";
  const displayType = selectedType === "layer" ? "Scene" : selectedType;
  const capitalizedType =
    displayType.charAt(0).toUpperCase() + displayType.slice(1);

  if (!selectedShape && !selectedLayer) {
    return null;
  }

  return (
    <div className="h-screen pt-[60px] overflow-y-auto">
      <div className="select-none flex flex-row justify-start items-center border-y border-[#474747] py-[15px] px-[15px]">
        <span className="text-white font-medium">{capitalizedType}</span>
      </div>
      {selectedLayer && (
        <div className="select-none flex flex-row gap-4 border-b border-[#E0E0E0] py-[15px] px-[15px]">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-600">Width</span>
            <input
              type="number"
              className="border rounded px-2 py-1 w-24"
              value={selectedLayer.width}
              min={1}
              onChange={(e) => {
                const newWidth = Number(e.target.value);
                const index = layers.findIndex(
                  (l) => l.id === selectedLayer.id
                );
                handleLayerChange(index, { ...selectedLayer, width: newWidth });
              }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-600">Height</span>
            <input
              type="number"
              className="border rounded px-2 py-1 w-24"
              value={selectedLayer.height}
              min={1}
              onChange={(e) => {
                const newHeight = Number(e.target.value);
                const index = layers.findIndex(
                  (l) => l.id === selectedLayer.id
                );
                handleLayerChange(index, {
                  ...selectedLayer,
                  height: newHeight,
                });
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
