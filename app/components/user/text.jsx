import React, { useState, useEffect } from "react";
import ContentEditable from "react-contenteditable";
import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export const Text = ({ text, fontSize }) => {
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
    <div ref={(ref) => connect(drag(ref))} onClick={(e) => setEditable(true)}>
      <ContentEditable
        disabled={!editable}
        html={text}
        onChange={(e) =>
          setProp(
            (props) =>
              (props.text = e.target.value.replace(/<\/?[^>]+(>|$)/g, "")),
          )
        }
        tagName="p"
        style={{ fontSize: `${fontSize}px` }}
      />
      {hasSelectedNode && (
        <div className="mt-4 space-y-2">
          <Label>Font size</Label>
          <Slider
            defaultValue={[fontSize]}
            min={7}
            max={50}
            step={1}
            onValueChange={(value) => {
              setProp(props => props.fontSize = value[0]);
            }}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};