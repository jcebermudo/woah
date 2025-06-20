// components/user/Container.js
import React from "react";
import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useViewport } from "@/app/components/context/ViewportContext";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import ContentEditable from "react-contenteditable";

const defaultViewportStyles = {
  fontSize: 16,
  color: "#000000",
  bgcolor: "#ffffff",
  padding: 0,
  margin: 0,
  width: 100,
  height: 100,
};

type ViewportStyles = {
  fontSize?: number;
  color?: string;
  bgcolor: string;
  padding?: number;
  margin?: number;
  width?: string | number;
  height?: string | number;
};

type ResponsiveStyles = {
  desktop: ViewportStyles;
  tablet: ViewportStyles;
  mobile: ViewportStyles;
};

export const Page = ({
  responsiveStyles,
  children,
}: {
  responsiveStyles: ResponsiveStyles;
  children?: React.ReactNode;
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  const { currentViewport } = useViewport();

  const getCurrentStyles = () => {
    return responsiveStyles?.[currentViewport || "desktop"] || {};
  };

  return (
    <div
      ref={(ref) => void (ref && connect(drag(ref)))}
      style={{
        borderRadius: "0px",
        backgroundColor:
          getCurrentStyles().bgcolor === "none"
            ? "transparent"
            : getCurrentStyles().bgcolor,
        color: getCurrentStyles().color,
        fontSize: getCurrentStyles().fontSize
          ? `${getCurrentStyles().fontSize}px`
          : undefined,

        padding: getCurrentStyles().padding
          ? `${getCurrentStyles().padding}px`
          : undefined,
        margin: getCurrentStyles().margin
          ? `${getCurrentStyles().margin}px`
          : undefined,
        width: getCurrentStyles().width
          ? `${getCurrentStyles().width}px`
          : undefined,
        height: getCurrentStyles().height
          ? `${getCurrentStyles().height}px`
          : undefined,
        // Add padding/background as needed
      }}
    >
      {children}
    </div>
  );
};

export const PageSettings = () => {
  const {
    actions: { setProp },
    responsiveStyles,
  } = useNode((node) => ({
    responsiveStyles: node.data.props.responsiveStyles,
  }));

  const { currentViewport, setCurrentViewport } = useViewport();
  const [tab, setTab] = useState<"desktop" | "tablet" | "mobile">(
    currentViewport
  );

  useEffect(() => {
    setTab(currentViewport);
  }, [currentViewport]);

  const updateStyle = <K extends keyof ViewportStyles>(
    viewport: keyof ResponsiveStyles,
    property: K,
    value: ViewportStyles[K]
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
              {/* Background Color */}
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
                        e.target.value === "#ffffff" ? "none" : e.target.value
                      )
                    }
                  />
                </div>
              </div>
              {/* Padding */}
              <div>
                <Label>Padding (px)</Label>
                <Input
                  type="number"
                  value={responsiveStyles[viewport].padding ?? 0}
                  min={0}
                  max={200}
                  onChange={(e) =>
                    updateStyle(
                      viewport,
                      "padding",
                      parseInt(e.target.value) || 0
                    )
                  }
                />
              </div>
              {/* Margin */}
              <div>
                <Label>Margin (px)</Label>
                <Input
                  type="number"
                  value={responsiveStyles[viewport].margin ?? 0}
                  min={0}
                  max={200}
                  onChange={(e) =>
                    updateStyle(
                      viewport,
                      "margin",
                      parseInt(e.target.value) || 0
                    )
                  }
                />
              </div>
              {/* Width */}
              <div>
                <Label>Width (px or %)</Label>
                <Input
                  type="text"
                  value={responsiveStyles[viewport].width ?? ""}
                  onChange={(e) =>
                    updateStyle(viewport, "width", e.target.value)
                  }
                />
              </div>
              {/* Height */}
              <div>
                <Label>Height (px or %)</Label>
                <Input
                  type="text"
                  value={responsiveStyles[viewport].height ?? ""}
                  onChange={(e) =>
                    updateStyle(viewport, "height", e.target.value)
                  }
                />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export const PageDefaultProps = {
  background: "#fff",
  padding: 0,
};

Page.craft = {
  related: {
    settings: PageSettings,
  },
};
