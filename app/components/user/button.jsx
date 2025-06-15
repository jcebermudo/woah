// components/user/Button.js
import React from "react";
import { Button as ShadButton } from "@/components/ui/button";
import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const Button = ({ size, variant, color, text }) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  return (
    <ShadButton
      ref={(ref) => connect(drag(ref))}
      size={size}
      variant={variant}
      color={color}
    >
      {text}
    </ShadButton>
  );
};

const ButtonSettings = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Size</Label>
        <RadioGroup
          defaultValue={props.size}
          onValueChange={(value) => setProp((props) => (props.size = value))}
          className="flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sm" id="size-sm" />
            <Label htmlFor="size-sm">Small</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="default" id="size-default" />
            <Label htmlFor="size-default">Medium</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="lg" id="size-lg" />
            <Label htmlFor="size-lg">Large</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Variant</Label>
        <RadioGroup
          defaultValue={props.variant}
          onValueChange={(value) => setProp((props) => (props.variant = value))}
          className="flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ghost" id="variant-ghost" />
            <Label htmlFor="variant-ghost">Ghost</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="outline" id="variant-outline" />
            <Label htmlFor="variant-outline">Outline</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="default" id="variant-default" />
            <Label htmlFor="variant-default">Default</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <RadioGroup
          defaultValue={props.color}
          onValueChange={(value) => setProp((props) => (props.color = value))}
          className="flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="default" id="color-default" />
            <Label htmlFor="color-default">Default</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="primary" id="color-primary" />
            <Label htmlFor="color-primary">Primary</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="secondary" id="color-secondary" />
            <Label htmlFor="color-secondary">Secondary</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};

Button.craft = {
  props: {
    size: "small",
    variant: "contained",
    color: "primary",
    text: "Click me",
  },
  related: {
    settings: ButtonSettings,
  },
};
