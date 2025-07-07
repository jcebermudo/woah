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
        <div className="flex flex-row items-center gap-[10px] h-full w-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="20"
            fill="none"
            viewBox="0 0 24 20"
          >
            <path
              fill="#646464"
              d="M11.34 13.64c-.895 2.936-1.21 6.261-5 6.21-1.683-.027-2.814-.079-3.709-1.663C1.316 15.849-.999 3.354.474 1.25 1.026.47 3.263.366 4.184.34c.63-.026 1.341-.026 1.815.416 1 .935.894 8.105 1.184 9.95.052.415.237 1.376.79 1.402 1.894.078.762-7.715 1.736-9.222.579-.935 2.289-.883 3.21-.571.368.13.762.311 1 .623.973 1.247.026 6.52.736 8.599.105.285.316.779.684.753.316-.026.579-.546.658-.805.868-2.39.368-9.456 1.868-10.937.42-.415.973-.571 1.552-.545.921.052 3.315.363 3.92 1.039.369.415.632.987.658 1.558.132 2.546-2.473 13.04-3.736 15.379-.395.727-.973 1.428-1.789 1.662-1.026.286-2.184.468-3.236.286-2.842-.494-3.368-3.948-3.894-6.286"
            />
          </svg>
          <span className="text-[14px] font-medium text-white cursor-text">
            Untitled
          </span>
        </div>
        <div className="flex flex-row">
          <button
            className={`flex items-center justify-center w-[40px] h-[40px] rounded-[10px] hover:bg-[#383838] duration-200 ${
              isLayerSelected() ? "cursor-pointer" : "cursor-not-allowed"
            }`}
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
          <span className="select-none flex gap-[10px] items-center cursor-pointer text-[14px] font-medium text-white px-[17px] py-[7px] bg-[#29A9FF] rounded-[10px]">
            <Download className="w-[14px] h-[14px] text-white stroke-[2px]" />
            Export
          </span>
        </div>
      </div>
    </div>
  );
}
