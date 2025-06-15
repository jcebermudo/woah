// components/user/Container.js
import React from "react";
import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export const Container = ({ background, padding = 0, children }) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  return (
    <div
      ref={(ref) => connect(drag(ref))}
      style={{ margin: "5px 0", background, padding: `${padding}px` }}
    >
      {children}
    </div>
  );
};

export const ContainerSettings = () => {
  const {
    background,
    padding,
    actions: { setProp },
  } = useNode((node) => ({
    background: node.data.props.background,
    padding: node.data.props.padding,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Background</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={background || "#000000"}
            onChange={(e) =>
              setProp((props) => (props.background = e.target.value))
            }
            className="h-8 w-8 rounded-md border border-input bg-background p-1"
          />
          <span className="text-sm text-muted-foreground">
            {background || "#000000"}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Padding</Label>
        <Slider
          defaultValue={[padding || 0]}
          min={0}
          max={50}
          step={1}
          onValueChange={(value) =>
            setProp((props) => (props.padding = value[0]))
          }
          className="w-full"
        />
      </div>
    </div>
  );
};

Container.craft = {
  related: {
    settings: ContainerSettings,
  },
};
