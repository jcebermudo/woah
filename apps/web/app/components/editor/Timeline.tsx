import { useStore } from "@/app/zustland/store";

export default function Timeline() {
    const { mode } = useStore();

    if (mode === "design") {
        return null;
    }

    return (
        <div className="h-screen pt-[60px] overflow-y-auto">
            <span>Timeline</span>
        </div>
    );
}