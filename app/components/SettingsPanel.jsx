import React from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export const SettingsPanel = () => {  
  return (    
    <div className="bg-muted/60 mt-2 px-2 py-2">
      <div className="flex flex-col gap-4">
        <div className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Selected</span>
            <Badge variant="default">Selected</Badge>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Prop</label>
          <Slider
            defaultValue={[0]}
            max={50}
            min={7}
            step={1}
            className="w-full"
          />
        </div>

        <Button variant="default">
          Delete
        </Button>
      </div>
    </div>
  ) 
}