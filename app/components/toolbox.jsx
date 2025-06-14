import React from "react";
import { Button } from "@/components/ui/button";

export const Toolbox = () => {
  return (
    <div className="px-2 py-2">
      <div className="flex flex-col items-center justify-center gap-1">
        <div className="pb-2">
          <p className="text-sm">Drag to add</p>
        </div>
        <div className="flex flex-col w-full">
          <Button variant="default">Button</Button>
        </div>
        <div className="flex flex-col w-full">
          <Button variant="default">Text</Button>
        </div>
        <div className="flex flex-col w-full">
          <Button variant="default">Container</Button>
        </div>
        <div className="flex flex-col w-full">
          <Button variant="default">Card</Button>
        </div>
      </div>
    </div>
  )
};