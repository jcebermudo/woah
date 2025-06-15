import React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEditor } from "@craftjs/core";

export const Topbar = () => {
  const { actions, query, enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  return (
    <div className="px-1 py-1 mt-3 mb-1 bg-[#cbe8e7]">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="enable"
            checked={enabled}
            onCheckedChange={(checked) =>
              actions.setOptions((options) => (options.enabled = checked))
            }
          />
          <Label htmlFor="enable">Enable</Label>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log(query.serialize());
          }}
        >
          Serialize JSON to console
        </Button>
      </div>
    </div>
  );
};
