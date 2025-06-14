import React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Topbar = () => {
  return (
    <div className="px-1 py-1 mt-3 mb-1 bg-[#cbe8e7]">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch id="enable" defaultChecked />
          <Label htmlFor="enable">Enable</Label>
        </div>
        <Button variant="outline" size="sm">
          Serialize JSON to console
        </Button>
      </div>
    </div>
  )
};