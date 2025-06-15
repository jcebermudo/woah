import React, { useState, useEffect } from "react";
import ContentEditable from "react-contenteditable";
import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

export const Text = ({
  text,
  fontSize,
  tag,
  color,
  bgcolor,
}: {
  text: string;
  fontSize: number;
  tag: string;
  color: string;
  bgcolor: string;
}) => {
  const {
    connectors: { connect, drag },
    hasSelectedNode,
    hasDraggedNode,
    actions: { setProp },
  } = useNode((state) => ({
    hasSelectedNode: state.events.selected,
    hasDraggedNode: state.events.dragged,
  }));

  const [editable, setEditable] = useState(false);

  useEffect(() => {
    !hasSelectedNode && setEditable(false);
  }, [hasSelectedNode]);

  return (
    <div
      ref={(ref) => void (ref && connect(drag(ref)))}
      onClick={(e) => setEditable(true)}
    >

      <ContentEditable
        disabled={!editable}
        html={text}
        onChange={(e) =>
          setProp(
            (props: { text: string }) =>
              (props.text = e.target.value.replace(/<\/?[^>]+(>|$)/g, ""))
          )
        }
        tagName={tag}
        style={{
          fontSize: `${fontSize}px`,
          color: color,
          backgroundColor: bgcolor === "none" ? "transparent" : bgcolor,
        }}
      />

    </div>
  );
};

const TextSettings = () => {
  const {
    actions: { setProp },
    fontSize,
    color,
    bgcolor,
  } = useNode((node) => ({
    fontSize: node.data.props.fontSize,
    color: node.data.props.color,
    bgcolor: node.data.props.bgcolor,
  }));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div>
          <Label htmlFor="font-size">Font size</Label>
          <Input
            id="font-size"
            value={fontSize}
            onChange={(e) =>
              setProp((props: { fontSize: number }) => {
                const parsedValue = parseInt(e.target.value);
                // If the input is empty or results in NaN, set fontSize to 1, otherwise use the parsed value.
                props.fontSize = isNaN(parsedValue) ? 1 : parsedValue;
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            value={color}
            onChange={(e) =>
              setProp(
                (props: { color: string }) => (props.color = e.target.value)
              )
            }
          />
        </div>
        <div>
          <Label htmlFor="bgcolor">Background Color</Label>
          <Input
            id="bgcolor"
            value={bgcolor}
            onChange={(e) =>
              setProp(
                (props: { bgcolor: string }) => (props.bgcolor = e.target.value)
              )
            }
          />
        </div>
      </div>
    </div>
  );
};

Text.craft = {
  props: {
    text: "Hi",
    fontSize: 20,
    color: "black",
    bgcolor: "none",
  },
  related: {
    settings: TextSettings,
  },
};
