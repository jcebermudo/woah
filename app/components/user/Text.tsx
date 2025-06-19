import React, { useState, useEffect } from "react";
import ContentEditable from "react-contenteditable";
import { useNode, useEditor } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useViewport } from "@/app/components/context/ViewportContext";

type ViewportStyles = {
  fontSize: number;
  color: string;
  bgcolor: string;
};

type ResponsiveStyles = {
  desktop: ViewportStyles;
  tablet: ViewportStyles;
  mobile: ViewportStyles;
};

export const Text = ({
  text,
  responsiveStyles,
}: {
  text: string;
  responsiveStyles: ResponsiveStyles;
}) => {
  const {
    connectors: { connect, drag },
    hasSelectedNode,
    actions: { setProp },
  } = useNode((state) => ({
    hasSelectedNode: state.events.selected,
  }));

  const [editable, setEditable] = useState(false);
  const { currentViewport } = useViewport();

  useEffect(() => {
    !hasSelectedNode && setEditable(false);
  }, [hasSelectedNode]);

  const getCurrentStyles = () => {
    return responsiveStyles[currentViewport || "desktop"];
  };

  return (
    <div
      ref={(ref) => void (ref && connect(drag(ref)))}
      onClick={(e) => setEditable(true)}
      style={{
        outline: hasSelectedNode ? "2px solid #2563eb" : "none",
        outlineOffset: "0px",
        borderRadius: "0px",
      }}
    >
      <ContentEditable
        disabled={!editable}
        html={text}
        onChange={(e) =>
          setProp(
            (props: { text: string }) =>
              (props.text = e.target.value.replace(/<\/?[^>]+(>|$)/g, "")),
          )
        }
        tagName="div"
        style={{
          fontSize: `${getCurrentStyles().fontSize}px`,
          color: getCurrentStyles().color,
          backgroundColor:
            getCurrentStyles().bgcolor === "none"
              ? "transparent"
              : getCurrentStyles().bgcolor,
          outline: "none",
        }}
      />
    </div>
  );
};

const TextSettings = () => {
  const {
    actions: { setProp },
    responsiveStyles,
  } = useNode((node) => ({
    responsiveStyles: node.data.props.responsiveStyles,
  }));

  const { currentViewport, setCurrentViewport } = useViewport();
  const [tab, setTab] = useState<"desktop" | "tablet" | "mobile">(
    currentViewport,
  );

  useEffect(() => {
    setTab(currentViewport);
  }, [currentViewport]);

  const updateStyle = <K extends keyof ViewportStyles>(
    viewport: keyof ResponsiveStyles,
    property: K,
    value: ViewportStyles[K],
  ) => {
    setProp((props: { responsiveStyles: ResponsiveStyles }) => {
      props.responsiveStyles[viewport][property] = value;
    });
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as "desktop" | "tablet" | "mobile");
          setCurrentViewport(v as "desktop" | "tablet" | "mobile");
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="desktop">Desktop</TabsTrigger>
          <TabsTrigger value="tablet">Tablet</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
        </TabsList>

        {(["desktop", "tablet", "mobile"] as const).map((viewport) => (
          <TabsContent key={viewport} value={viewport}>
            <div className="space-y-4">
              <div className="space-y-2">
                <div>
                  <Label htmlFor={`font-size-${viewport}`}>Font size</Label>
                  <Input
                    id={`font-size-${viewport}`}
                    type="number"
                    value={responsiveStyles[viewport].fontSize}
                    onChange={(e) =>
                      updateStyle(
                        viewport,
                        "fontSize",
                        parseInt(e.target.value) || 1,
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Text Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={responsiveStyles[viewport].color}
                      onChange={(e) =>
                        updateStyle(viewport, "color", e.target.value)
                      }
                      className="h-8 w-8 rounded-md border border-input bg-background p-1"
                    />
                    <Input
                      value={responsiveStyles[viewport].color}
                      onChange={(e) =>
                        updateStyle(viewport, "color", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Background Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={
                        responsiveStyles[viewport].bgcolor === "none"
                          ? "#ffffff"
                          : responsiveStyles[viewport].bgcolor
                      }
                      onChange={(e) =>
                        updateStyle(viewport, "bgcolor", e.target.value)
                      }
                      className="h-8 w-8 rounded-md border border-input bg-background p-1"
                    />
                    <Input
                      value={responsiveStyles[viewport].bgcolor}
                      onChange={(e) =>
                        updateStyle(
                          viewport,
                          "bgcolor",
                          e.target.value === "#ffffff"
                            ? "none"
                            : e.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

Text.craft = {
  props: {
    text: "Hi",
    responsiveStyles: {
      desktop: {
        fontSize: 20,
        color: "#000000",
        bgcolor: "none",
      },
      tablet: {
        fontSize: 18,
        color: "#000000",
        bgcolor: "none",
      },
      mobile: {
        fontSize: 16,
        color: "#000000",
        bgcolor: "none",
      },
    },
  },
  related: {
    settings: TextSettings,
  },
};
