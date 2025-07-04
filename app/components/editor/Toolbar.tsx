import { Frame, Type, Square, Circle, StarIcon, Image, Download } from "lucide-react";

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
    return (<div className="absolute top-0 left-0 w-full bg-white border-b border-[#E3E3E3] z-20 p-[15px]">
        <div className="flex flex-row items-center justify-between h-full w-full gap-[10px]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="31"
            height="26"
            fill="none"
            viewBox="0 0 31 26"
          >
            <path
              fill="#000"
              d="M14.647 17.733c-1.155 3.816-1.563 8.138-6.457 8.07-2.175-.033-3.636-.1-4.791-2.16-1.7-3.04-4.69-19.283-2.787-22.018C1.326.61 4.214.476 5.404.443c.815-.034 1.733-.034 2.345.54C9.04 2.199 8.904 11.519 9.278 13.917c.068.54.306 1.79 1.02 1.823 2.446.102.985-10.03 2.242-11.988.748-1.216 2.957-1.148 4.146-.743.476.169.986.405 1.292.81 1.257 1.622.034 8.477.951 11.179.136.371.408 1.013.884.979.408-.034.748-.71.85-1.047 1.121-3.107.475-12.292 2.413-14.217.543-.54 1.257-.743 2.005-.71 1.189.068 4.282.473 5.063 1.351.476.54.816 1.284.85 2.027.17 3.31-3.195 16.952-4.826 19.992-.51.945-1.257 1.857-2.31 2.16-1.326.372-2.822.609-4.181.372-3.67-.641-4.35-5.133-5.03-8.172"
            />
          </svg>
          <div className="flex items-center justify-start h-full w-full gap-[50px]">
            <span className="text-[16px] font-semibold text-black">
              Untitled
            </span>
            <div className="flex flex-row gap-[5px]">
              <button
                className="cursor-pointer flex items-center justify-center w-[40px] h-[40px] rounded-[12px] bg-[#F2F1F3]"
                onClick={addNewLayer}
              >
                <Frame className="text-[#6A6A6A] w-[20px] h-[20px] stroke-[2.5px]" />
              </button>
              <button className="cursor-pointer flex items-center justify-center w-[40px] h-[40px] rounded-[12px] bg-[#F2F1F3]">
                <Type className="text-[#6A6A6A] w-[20px] h-[20px] stroke-[2.5px]" />
              </button>
              <button
                className={`flex items-center justify-center w-[40px] h-[40px] rounded-[12px] bg-[#F2F1F3] ${
                  isLayerSelected() ? "cursor-pointer" : "cursor-not-allowed"
                }`}
                style={{ opacity: isLayerSelected() ? 1 : 0.5 }}
                onClick={() => addShapeToSelectedLayer("rect")}
                disabled={!isLayerSelected()}
              >
                <Square className="text-[#6A6A6A] w-[20px] h-[20px] stroke-[2.5px]" />
              </button>
              <button
                className={`flex items-center justify-center w-[40px] h-[40px] rounded-[12px] bg-[#F2F1F3] ${
                  isLayerSelected() ? "cursor-pointer" : "cursor-not-allowed"
                }`}
                style={{ opacity: isLayerSelected() ? 1 : 0.5 }}
                onClick={() => addShapeToSelectedLayer("circle")}
                disabled={!isLayerSelected()}
              >
                <Circle className="text-[#6A6A6A] w-[20px] h-[20px] stroke-[2.5px]" />
              </button>
              <button
                className={`flex items-center justify-center w-[40px] h-[40px] rounded-[12px] bg-[#F2F1F3] ${
                  isLayerSelected() ? "cursor-pointer" : "cursor-not-allowed"
                }`}
                style={{ opacity: isLayerSelected() ? 1 : 0.5 }}
                onClick={() => addShapeToSelectedLayer("star")}
                disabled={!isLayerSelected()}
              >
                <StarIcon className="text-[#6A6A6A] w-[20px] h-[20px] stroke-[2.5px]" />
              </button>
              <button className="cursor-pointer flex items-center justify-center w-[40px] h-[40px] rounded-[12px] bg-[#F2F1F3]">
                <Image className="text-[#6A6A6A] w-[20px] h-[20px] stroke-[2.5px]" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-end h-full w-full gap-[10px]">
            <span className="text-[16px] font-semibold text-black px-[17px] py-[7px] bg-[#F2F1F3] rounded-[12px]">
              {Math.round(stageScale * 100)}%
            </span>
            <span className="flex gap-[10px] items-center cursor-pointer text-[16px] font-semibold text-white px-[17px] py-[7px] bg-[#29A9FF] rounded-[12px]">
              <Download className="w-[16px] h-[16px] text-white stroke-[2.5px]" />
              Export
            </span>
          </div>
        </div>
      </div>
  );
}