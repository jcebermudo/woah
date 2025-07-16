import { useStore } from "@/app/zustland/store";

export default function Timeline() {
    const { mode } = useStore();

    if (mode === "design") {
        return null;
    }

    return (
      <div className="h-screen w-full">
        <div className="flex flex-row h-full w-full">
          <div className="bg-[#232323] border-r border-[#474747] h-full w-[350px]">
            <div className="bg-[#232323] h-[50px] border-b border-[#474747] w-full flex flex-row items-center justify-center">
                <div className="flex flex-row gap-[5px]">
                    
                </div>
            </div>
          </div>
          <div className="bg-[#232323] h-full w-full"></div>
        </div>
      </div>
    );
}