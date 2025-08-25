import { LayerContainer, Shape, ShapeAnimation } from "@/types/canvasElements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore, useAnimationStateStore } from "@/app/zustland/store";
import { useState } from "react";
import { ANIMATION_TEMPLATES, AnimationManager } from "@/utils/animations";

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
  const [isAddingAnimation, setIsAddingAnimation] = useState(false);
  const { mode, setMode } = useStore();
  const { selectedAnimationIds, selectedAnimationDetails } =
    useAnimationStateStore();
  const selectedShape = shapes.find((shape) => selectedIds.includes(shape.id));
  const selectedLayer = layers.find((layer) => selectedIds.includes(layer.id));

  const selectedType = selectedShape?.type || selectedLayer?.type || "None";
  const displayType = selectedType === "layer" ? "Scene" : selectedType;
  const capitalizedType =
    displayType.charAt(0).toUpperCase() + displayType.slice(1);

  return (
    <div className="h-screen pt-[60px] overflow-y-auto">
      <Tabs defaultValue="design" className="p-[15px] cursor-pointer">
        <TabsList className="w-full rounded-[10px]">
          <TabsTrigger
            value="design"
            className="rounded-[7px] cursor-pointer"
            onClick={() => setMode("design")}
          >
            Design
          </TabsTrigger>
          <TabsTrigger
            value="animate"
            className="rounded-[7px] cursor-pointer"
            onClick={() => setMode("animate")}
          >
            Animate
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="select-none flex flex-row justify-start items-center border-y border-[#474747] py-[15px] px-[15px]">
        <span className="text-white text-[14px] font-medium">
          {selectedAnimationIds.length === 0 ? capitalizedType : "a"}
        </span>
      </div>
      {mode === "design" && selectedLayer && (
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
      {mode === "animate" && (
        <div>
          {selectedLayer && (
            <div className="select-none flex flex-row gap-4 border-b border-[#474747] py-[15px] px-[15px]">
              <div className="flex flex-col gap-[10px]">
                <span className="text-[14px] font-medium text-white">
                  Duration
                </span>
                <input
                  type="number"
                  className="rounded-[10px] px-[10px] py-[8px] w-24 bg-[#383838] font-medium text-white text-[14px] focus:outline-none"
                  value={selectedLayer.duration}
                  min={1}
                  onChange={(e) => {
                    const newDuration = Number(e.target.value);
                    const index = layers.findIndex(
                      (l) => l.id === selectedLayer.id
                    );
                    handleLayerChange(index, {
                      ...selectedLayer,
                      duration: newDuration,
                    });
                  }}
                />
              </div>
            </div>
          )}
          {selectedAnimationIds.length === 1 && (
            <div className="select-none border-b border-[#474747] py-[15px] px-[15px]">
              <div className="flex flex-col gap-[10px]">
                <span className="text-[14px] font-medium text-white">
                  Current Animation
                </span>
              </div>
            </div>
          )}
          {selectedShape && selectedAnimationIds.length === 0 && (
            <div className="select-none border-b border-[#474747] py-[15px] px-[15px]">
              <button
                onClick={() => setIsAddingAnimation(true)}
                className="cursor-pointer rounded-[10px] w-full px-[10px] py-[8px] bg-[#29A9FF] font-medium text-white text-[14px] focus:outline-none"
              >
                Add animation
              </button>
              {isAddingAnimation && (
                <div className="flex flex-col gap-[10px] absolute w-[280px] h-[300px] translate-x-[-150px] bg-[#232323] rounded-[20px] p-[20px]">
                  <div className="flex items-center justify-between">
                    <Tabs className="w-full" defaultValue="in">
                      <TabsList className="w-full h-[45px] rounded-[10px] p-[5px]">
                        <TabsTrigger value="in">In</TabsTrigger>
                        <TabsTrigger value="out">Out</TabsTrigger>
                      </TabsList>
                      <TabsContent value="in">
                        {ANIMATION_TEMPLATES.map((template) => (
                          <button
                            key={template.type}
                            onClick={() => {
                              const animationManager = new AnimationManager();
                              const newAnimation: ShapeAnimation = {
                                ...template.defaultValues,
                                id: animationManager.generateAnimationId(),
                              } as ShapeAnimation;

                              const index = shapes.findIndex(
                                (s) => s.id === selectedShape.id
                              );
                              const currentAnimations =
                                selectedShape.animations || [];
                              const updatedAnimations = [
                                ...currentAnimations,
                                newAnimation,
                              ];

                              handleShapeChange(index, {
                                ...selectedShape,
                                animations: updatedAnimations,
                              });
                              setIsAddingAnimation(false);
                            }}
                            className="cursor-pointer rounded-[10px] px-[10px] py-[8px] bg-[#232323] border border-[#474747] font-medium text-white text-[12px] hover:bg-[#383838] focus:outline-none"
                          >
                            {template.name}
                          </button>
                        ))}
                      </TabsContent>
                      <TabsContent value="out">
                        <div className="flex flex-col gap-[10px]"></div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      
            {/* Current animations list
          {selectedShape.animations && selectedShape.animations.length > 0 && (
            <div className="mb-4">
              <span className="text-[14px] font-medium text-white mb-2 block">
                Current Animations
              </span>
              <div className="space-y-2">
                {selectedShape.animations.map((animation) => (
                  <div
                    key={animation.id}
                    className="flex items-center justify-between bg-[#232323] rounded-[10px] px-[10px] py-[8px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white text-[12px] font-medium">
                        {animation.type}
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={animation.enabled}
                          onChange={(e) => {
                            const index = shapes.findIndex(
                              (s) => s.id === selectedShape.id,
                            );
                            const updatedAnimations =
                              selectedShape.animations?.map((a) =>
                                a.id === animation.id
                                  ? { ...a, enabled: e.target.checked }
                                  : a,
                              ) || [];
                            handleShapeChange(index, {
                              ...selectedShape,
                              animations: updatedAnimations,
                            });
                          }}
                          className="w-3 h-3"
                        />
                        <span className="text-gray-400 text-[10px]">
                          enabled
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={animation.duration}
                        onChange={(e) => {
                          const index = shapes.findIndex(
                            (s) => s.id === selectedShape.id,
                          );
                          const updatedAnimations =
                            selectedShape.animations?.map((a) =>
                              a.id === animation.id
                                ? { ...a, duration: Number(e.target.value) }
                                : a,
                            ) || [];
                          handleShapeChange(index, {
                            ...selectedShape,
                            animations: updatedAnimations,
                          });
                        }}
                        className="w-16 px-2 py-1 bg-[#383838] text-white text-[12px] rounded"
                        min="0.1"
                        step="0.1"
                      />
                      <button
                        onClick={() => {
                          const index = shapes.findIndex(
                            (s) => s.id === selectedShape.id,
                          );
                          const updatedAnimations =
                            selectedShape.animations?.filter(
                              (a) => a.id !== animation.id,
                            ) || [];
                          handleShapeChange(index, {
                            ...selectedShape,
                            animations: updatedAnimations,
                          });
                        }}
                        className="text-red-400 hover:text-red-300 text-[12px]"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
             */}

      </div>
  );
}
