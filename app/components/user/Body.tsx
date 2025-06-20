// components/user/Container.js
import React from "react";
import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useViewport } from "@/app/components/context/ViewportContext";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useEditor } from "@craftjs/core";

type ViewportStyles = {
  fontSize?: number;
  color?: string;
  bgcolor: string;
  padding?: number;
  maxWidth?: string | number;
  minHeight?: string | number;
};

type ResponsiveStyles = {
  desktop: ViewportStyles;
  tablet: ViewportStyles;
  mobile: ViewportStyles;
};

export const Body = ({
  responsiveStyles,
  children,
}: {
  responsiveStyles: ResponsiveStyles;
  children?: React.ReactNode;
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const { currentViewport } = useViewport();

  const getCurrentStyles = () => {
    return responsiveStyles?.[currentViewport || "desktop"] || {};
  };

  // Mirror the current page styles onto the real <body> element so that this
  // Craft root behaves like the actual body tag.
  useEffect(() => {
    // When the editor is active (enabled), we render the styles directly on the wrapper <div>.
    // Applying them to document.body during edit mode causes the entire editor chrome to shift,
    // so only mirror the styles to <body> when the editor is NOT enabled (i.e. in preview / publish).
    if (enabled) return;

    const styles = getCurrentStyles();

    const prev = {
      backgroundColor: document.body.style.backgroundColor,
      color: document.body.style.color,
      fontSize: document.body.style.fontSize,
      padding: document.body.style.padding,
    };

    if (styles.bgcolor !== undefined) {
      document.body.style.backgroundColor =
        styles.bgcolor === "none" ? "transparent" : styles.bgcolor;
    }
    if (styles.color !== undefined) {
      document.body.style.color = styles.color;
    }
    if (styles.fontSize !== undefined) {
      document.body.style.fontSize = `${styles.fontSize}px`;
    }
    if (styles.padding !== undefined) {
      document.body.style.padding = `${styles.padding}px`;
    }

    // Restore previous body styles on unmount / viewport switch
    return () => {
      document.body.style.backgroundColor = prev.backgroundColor;
      document.body.style.color = prev.color;
      document.body.style.fontSize = prev.fontSize;
      document.body.style.padding = prev.padding;
    };
  }, [enabled, currentViewport, responsiveStyles]);

  return (
    <div
      ref={(ref) => void (ref && connect(drag(ref)))}
      style={
        enabled
          ? {
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
              maxWidth: getCurrentStyles().maxWidth
                ? `${getCurrentStyles().maxWidth}px`
                : undefined,
              width: getCurrentStyles().maxWidth
                ? `${getCurrentStyles().maxWidth}px`
                : undefined,
              minHeight: getCurrentStyles().minHeight
                ? `${getCurrentStyles().minHeight}px`
                : undefined,
              // Add padding/background as needed
            }
          : { display: "contents" }
      }
    >
      {children}
    </div>
  );
};

export const BodySettings = () => {
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
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export const BodyDefaultProps = {
  background: "#fff",
  padding: 0,
};

Body.craft = {
  related: {
    settings: BodySettings,
  },
};
