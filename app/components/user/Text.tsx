import { useNode, useEditor } from "@craftjs/core";
import React from "react";
import ContentEditable from "react-contenteditable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Palette,
  Move,
  Square,
} from "lucide-react";

export type TextProps = {
  fontSize: string;
  textAlign: string;
  fontWeight: string;
  color: Record<"r" | "g" | "b" | "a", string>;
  shadow: number;
  text: string;
  margin: [string, string, string, string];
};

// Utility functions
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const weightDescription = (weight: number) => {
  switch (weight) {
    case 400:
      return "Regular";
    case 500:
      return "Medium";
    case 700:
      return "Bold";
    default:
      return "Regular";
  }
};

// Toolbar Components
const ToolbarSection = ({
  title,
  children,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <Card className="mb-4">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">{children}</CardContent>
  </Card>
);

const ToolbarItem = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const ToolbarRadio = ({
  value,
  label,
  currentValue,
  onChange,
}: {
  value: string;
  label: string;
  currentValue: string;
  onChange: (value: string) => void;
}) => (
  <Button
    variant={currentValue === value ? "default" : "outline"}
    size="sm"
    onClick={() => onChange(value)}
    className="h-8"
  >
    {label}
  </Button>
);

const ColorPicker = ({
  color,
  onChange,
}: {
  color: Record<"r" | "g" | "b" | "a", string>;
  onChange: (color: Record<"r" | "g" | "b" | "a", string>) => void;
}) => {
  const rgbToHex = (r: number, g: number, b: number) => {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rgb = hexToRgb(e.target.value);
    if (rgb) {
      onChange({
        r: rgb.r.toString(),
        g: rgb.g.toString(),
        b: rgb.b.toString(),
        a: color.a,
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={rgbToHex(
          parseInt(color.r),
          parseInt(color.g),
          parseInt(color.b),
        )}
        onChange={handleColorChange}
        className="w-10 h-8 rounded border border-input cursor-pointer"
      />
      <div
        className="w-6 h-6 rounded border border-input"
        style={{
          backgroundColor: `rgba(${Object.values(color).join(", ")})`,
        }}
      />
    </div>
  );
};

// Text Settings Component
export const TextSettings = () => {
  const { fontSize, fontWeight, textAlign, margin, color, shadow } = useNode(
    (node) => node.data.props,
  );

  const { setProp } = useNode();

  return (
    <div className="w-80 p-4 bg-background border-l">
      <ToolbarSection title="Typography" icon={Type}>
        <ToolbarItem label="Font Size">
          <div className="px-3">
            <Slider
              value={[parseInt(fontSize)]}
              onValueChange={([value]) =>
                setProp((props: Record<string, any>) => {
                  props.fontSize = value.toString();
                })
              }
              max={72}
              min={8}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>8px</span>
              <span>{fontSize}px</span>
              <span>72px</span>
            </div>
          </div>
        </ToolbarItem>

        <ToolbarItem label="Align">
          <div className="flex gap-1">
            <Button
              variant={textAlign === "left" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setProp((props: Record<string, any>) => {
                  props.textAlign = "left";
                })
              }
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={textAlign === "center" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setProp((props: Record<string, any>) => {
                  props.textAlign = "center";
                })
              }
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant={textAlign === "right" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setProp((props: Record<string, any>) => {
                  props.textAlign = "right";
                })
              }
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
        </ToolbarItem>

        <ToolbarItem label="Weight">
          <div className="flex gap-1">
            <ToolbarRadio
              value="400"
              label="Regular"
              currentValue={fontWeight}
              onChange={(value) =>
                setProp((props: Record<string, any>) => {
                  props.fontWeight = value;
                })
              }
            />
            <ToolbarRadio
              value="500"
              label="Medium"
              currentValue={fontWeight}
              onChange={(value) =>
                setProp((props: Record<string, any>) => {
                  props.fontWeight = value;
                })
              }
            />
            <ToolbarRadio
              value="700"
              label="Bold"
              currentValue={fontWeight}
              onChange={(value) =>
                setProp((props: Record<string, any>) => {
                  props.fontWeight = value;
                })
              }
            />
          </div>
        </ToolbarItem>
      </ToolbarSection>

      <ToolbarSection title="Margin" icon={Move}>
        {["Top", "Right", "Bottom", "Left"].map((direction, index) => (
          <ToolbarItem key={direction} label={direction}>
            <div className="px-3">
              <Slider
                value={[parseInt(margin[index])]}
                onValueChange={([value]) =>
                  setProp((props: Record<string, any>) => {
                    const newMargin = [...props.margin];
                    newMargin[index] = value.toString();
                    props.margin = newMargin as [
                      string,
                      string,
                      string,
                      string,
                    ];
                  })
                }
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0px</span>
                <span>{margin[index]}px</span>
                <span>100px</span>
              </div>
            </div>
          </ToolbarItem>
        ))}
      </ToolbarSection>

      <ToolbarSection title="Appearance" icon={Palette}>
        <ToolbarItem label="Text Color">
          <ColorPicker
            color={color}
            onChange={(newColor) =>
              setProp((props: Record<string, any>) => {
                props.color = newColor;
              })
            }
          />
        </ToolbarItem>

        <ToolbarItem label="Shadow">
          <div className="px-3">
            <Slider
              value={[shadow]}
              onValueChange={([value]) =>
                setProp((props: Record<string, any>) => {
                  props.shadow = value;
                })
              }
              max={100}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span>{shadow}%</span>
              <span>100%</span>
            </div>
          </div>
        </ToolbarItem>
      </ToolbarSection>
    </div>
  );
};

// Main Text Component
export const Text = ({
  fontSize = "15",
  textAlign = "left",
  fontWeight = "500",
  color = { r: "92", g: "90", b: "90", a: "1" },
  shadow = 0,
  text = "Text",
  margin = ["0", "0", "0", "0"],
}: Partial<TextProps>) => {
  const {
    connectors: { connect },
    setProp,
  } = useNode();

  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  return (
    <ContentEditable
      innerRef={connect}
      html={text}
      disabled={!enabled}
      onChange={(e) => {
        setProp((props: Record<string, any>) => {
          props.text = e.target.value;
        }, 500);
      }}
      tagName="h2"
      className="outline-none w-fit flex-none inline-block"
      style={{
        margin: `${margin[0]}px ${margin[1]}px ${margin[2]}px ${margin[3]}px`,
        color: `rgba(${Object.values(color).join(", ")})`,
        fontSize: `${fontSize}px`,
        textShadow: `0px 0px 2px rgba(0,0,0,${(shadow || 0) / 100})`,
        fontWeight,
        textAlign: textAlign as any,
        width: "fit-content",
        height: "fit-content",
      }}
    />
  );
};

Text.craft = {
  displayName: "Text",
  props: {
    fontSize: "15",
    textAlign: "left",
    fontWeight: "500",
    color: { r: "92", g: "90", b: "90", a: "1" },
    margin: ["0", "0", "0", "0"],
    shadow: 0,
    text: "Text",
  },
  related: {
    settings: TextSettings,
  },
};
