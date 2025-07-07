import { LayerContainer, Shape } from "@/types/canvasElements";

interface PropertiesPanelProps {
  selectedId: string | null;
  shapes: Shape[];
  layers: LayerContainer[];
  handleShapeChange: (index: number, newAttrs: Shape) => void;
  handleLayerChange: (index: number, newAttrs: LayerContainer) => void;
}

export default function PropertiesPanel({
  selectedId,
  shapes,
  layers,
  handleShapeChange,
  handleLayerChange,
}: PropertiesPanelProps) {
  const selectedShape = shapes.find((shape) => shape.id === selectedId);
  const selectedLayer = layers.find((layer) => layer.id === selectedId);

  const selectedType = selectedShape?.type || selectedLayer?.type || "None";
  const capitalizedType =
    selectedType.charAt(0).toUpperCase() + selectedType.slice(1);

  if (!selectedShape && !selectedLayer) {
    return null;
  }

  return (
    <div className="h-screen pt-[80px] px-[10px] overflow-y-auto">
      <h1 className="text-black">Selected: {capitalizedType}</h1>
    </div>
  );
}
