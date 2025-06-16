import React from "react";
import { Button } from "@/components/ui/button";
import { Monitor, Tablet, Smartphone } from "lucide-react";

type DeviceType = "desktop" | "tablet" | "mobile";

interface PreviewControlsProps {
  currentDevice: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
}

export const PreviewControls = ({
  currentDevice,
  onDeviceChange,
}: PreviewControlsProps) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/60 rounded-lg">
      <Button
        variant={currentDevice === "desktop" ? "default" : "ghost"}
        size="sm"
        onClick={() => onDeviceChange("desktop")}
        className="flex items-center gap-2"
      >
        <Monitor className="w-4 h-4" />
        <span className="hidden sm:inline">Desktop</span>
      </Button>
      <Button
        variant={currentDevice === "tablet" ? "default" : "ghost"}
        size="sm"
        onClick={() => onDeviceChange("tablet")}
        className="flex items-center gap-2"
      >
        <Tablet className="w-4 h-4" />
        <span className="hidden sm:inline">Tablet</span>
      </Button>
      <Button
        variant={currentDevice === "mobile" ? "default" : "ghost"}
        size="sm"
        onClick={() => onDeviceChange("mobile")}
        className="flex items-center gap-2"
      >
        <Smartphone className="w-4 h-4" />
        <span className="hidden sm:inline">Mobile</span>
      </Button>
    </div>
  );
};
