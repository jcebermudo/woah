import React from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useEditor } from "@craftjs/core";

export const SettingsPanel = () => {
  const { actions, selected } = useEditor((state, query) => {
    const [currentNodeId] = state.events.selected;
    let selected;

    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.name,
        settings:
          state.nodes[currentNodeId].related &&
          state.nodes[currentNodeId].related.settings,
        isDeletable: query.node(currentNodeId).isDeletable(),
      };
    }

    return {
      selected,
    };
  });

  return selected ? (
    <div className="bg-muted/60 mt-2 px-2 py-2">
      <div className="flex flex-col gap-4">
        <div className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Selected</span>
            <Badge variant="default">{selected.name}</Badge>
          </div>
        </div>

        {selected.settings && React.createElement(selected.settings)}

        {selected.isDeletable && (
          <Button
            variant="default"
            onClick={() => {
              actions.delete(selected.id);
            }}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  ) : null;
};
