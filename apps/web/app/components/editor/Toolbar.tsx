import {
  Frame,
  Type,
  Square,
  Circle,
  StarIcon,
  Image,
  Download,
} from "lucide-react";

interface ToolbarProps {
  addNewLayer: () => void;
  isLayerSelected: () => boolean;
  addShapeToSelectedLayer: (shapeType: "rect" | "circle" | "star") => void;
  stageScale: number;
}

export default function Toolbar({
  addNewLayer,
  isLayerSelected,
  addShapeToSelectedLayer,
  stageScale,
}: ToolbarProps) {
  return (
    <div className="absolute top-0 left-0 w-full bg-[#232323] border-b border-[#474747] z-20 p-[10px]">
      <div className="flex flex-row items-center justify-between h-full w-full gap-[10px]">
        <div className="flex flex-row items-center gap-[10px] h-full w-full pl-[10px]">
          <span className="text-[14px] font-medium text-white cursor-text">
            Untitled
          </span>
        </div>
        <div className="flex flex-row">
          <button
            className="cursor-pointer flex items-center justify-center w-[40px] h-[40px] rounded-[10px] hover:bg-[#383838] duration-200"
            onClick={addNewLayer}
          >
            <Frame className="text-white w-[18px] h-[18px] stroke-[2px]" />
          </button>
          <button
            className={`flex items-center justify-center w-[40px] h-[40px] rounded-[10px] hover:bg-[#383838] duration-200 ${
              isLayerSelected() ? "cursor-pointer" : "cursor-not-allowed"
            }`}
            style={{ opacity: isLayerSelected() ? 1 : 0.5 }}
            disabled={!isLayerSelected()}
          >
            <Type className="text-white w-[18px] h-[18px] stroke-[2px]" />
          </button>
          <button
            className={`flex items-center justify-center w-[40px] h-[40px] rounded-[10px] hover:bg-[#383838] duration-200 ${
              isLayerSelected() ? "cursor-pointer" : "cursor-not-allowed"
            }`}
            style={{ opacity: isLayerSelected() ? 1 : 0.5 }}
            onClick={() => addShapeToSelectedLayer("rect")}
            disabled={!isLayerSelected()}
          >
            <Square className="text-white w-[20px] h-[20px] stroke-[2px]" />
          </button>
          <button
            className={`flex items-center justify-center w-[40px] h-[40px] rounded-[10px] hover:bg-[#383838] duration-200 ${
              isLayerSelected() ? "cursor-pointer" : "cursor-not-allowed"
            }`}
            style={{ opacity: isLayerSelected() ? 1 : 0.5 }}
            onClick={() => addShapeToSelectedLayer("circle")}
            disabled={!isLayerSelected()}
          >
            <Circle className="text-white w-[20px] h-[20px] stroke-[2px]" />
          </button>
          <button
            className={`flex items-center justify-center w-[40px] h-[40px] rounded-[10px] hover:bg-[#383838] duration-200 ${
              isLayerSelected() ? "cursor-pointer" : "cursor-not-allowed"
            }`}
            style={{ opacity: isLayerSelected() ? 1 : 0.5 }}
            onClick={() => addShapeToSelectedLayer("star")}
            disabled={!isLayerSelected()}
          >
            <StarIcon className="text-white w-[20px] h-[20px] stroke-[2px]" />
          </button>
          <button
            className={`flex items-center justify-center w-[40px] h-[40px] rounded-[10px] hover:bg-[#383838] duration-200 ${
              isLayerSelected() ? "cursor-pointer" : "cursor-not-allowed"
            }`}
            style={{ opacity: isLayerSelected() ? 1 : 0.5 }}
            disabled={!isLayerSelected()}
          >
            <Image className="text-white w-[20px] h-[20px] stroke-[2px]" />
          </button>
        </div>
        <div className="flex items-center justify-end h-full w-full gap-[10px]">
          <span className="select-none text-[14px] font-medium text-white px-[17px] py-[7px] bg-[#383838] rounded-[10px]">
            {Math.round(stageScale * 100)}%
          </span>
          <span className="select-none flex gap-[10px] items-center cursor-pointer text-[14px] font-medium text-white px-[17px] py-[7px] bg-[#549EFF] rounded-[10px]">
            <Download className="w-[14px] h-[14px] text-white stroke-[3px]" />
            Export
          </span>
        </div>
      </div>
    </div>
  );
}
