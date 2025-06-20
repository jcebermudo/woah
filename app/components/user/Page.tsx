// components/user/Container.js
import React from "react";
import { useNode, Node } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useViewport } from "@/app/components/context/ViewportContext";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

const defaultViewportStyles = {
  fontSize: 16,
  color: "#000000",
  bgcolor: "#ffffff",
  padding: 0,
  margin: 0,
  width: 100,
  height: "100vh",
  minHeight: "800px",
};

type ViewportStyles = {
  fontSize?: number;
  color?: string;
  bgcolor: string;
  padding?: number;
  margin?: number;
  height?: string | number;
  width?: string | number;
  minHeight: string | number;
};

type ResponsiveStyles = {
  desktop: ViewportStyles;
  tablet: ViewportStyles;
  mobile: ViewportStyles;
};

interface PageProps extends Omit<React.HTMLAttributes<HTMLElement>, "is"> {
  responsiveStyles: ResponsiveStyles;
  children?: React.ReactNode;
  is?: React.ElementType;
  canvas?: boolean;
  style?: React.CSSProperties;
}

// Move PageSettings to the top to fix hoisting issue
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
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

// Define the Page component with Craft.js types
const Page = ({
  responsiveStyles,
  children,
  is: Component = "div",
  canvas = false,
  style,
  ...props
}: PageProps) => {
  const {
    connectors: { connect, drag },
  } = useNode((node: Node) => ({
    isActive: node.events.selected,
  }));

  const { currentViewport } = useViewport();

  const getCurrentStyles = () => {
    return responsiveStyles?.[currentViewport || "desktop"] || {};
  };

  const currentStyles = getCurrentStyles();

  // Base styles that apply to both canvas and non-canvas modes
  const baseStyle: React.CSSProperties = {
    width: "100vw",
    minHeight: "100vh",
    backgroundColor:
      currentStyles.bgcolor === "none" ? "transparent" : currentStyles.bgcolor,
    color: currentStyles.color,
    fontSize: currentStyles.fontSize
      ? `${currentStyles.fontSize}px`
      : undefined,
    padding: currentStyles.padding ? `${currentStyles.padding}px` : undefined,
    margin: 0,
  };

  // Canvas-specific styles
  const canvasStyle: React.CSSProperties = canvas
    ? {
        position: "relative",
        margin: "0 auto",
        width: currentStyles.width ? `${currentStyles.width}px` : "100%",
        minHeight: currentStyles.minHeight
          ? `${currentStyles.minHeight}px`
          : "100vh",
        boxSizing: "border-box",
        overflow: "visible",
        height: "auto",
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
      }
    : {};

  // Content container styles for canvas mode
  const contentStyle: React.CSSProperties = canvas
    ? {
        width: "100%",
        minHeight: currentStyles.minHeight
          ? `${currentStyles.minHeight}px`
          : "100%",
        flexGrow: 1,
        position: "relative",
      }
    : {};

  // Combine all styles
  const combinedStyle = {
    ...baseStyle,
    ...(canvas ? canvasStyle : {}),
  };

  const componentProps = {
    ...props,
    style: {
      ...combinedStyle,
      ...(style || {}),
    },
    ...(canvas ? { ref: (ref: HTMLElement) => ref && connect(drag(ref)) } : {}),
  };

  return (
    <Component {...componentProps}>
      {canvas ? <div style={contentStyle}>{children}</div> : children}
    </Component>
  );
};

// Add Craft.js specific properties to the Page component
const PageWithCraft = Object.assign(Page, {
  craft: {
    displayName: "Page",
    props: {
      responsiveStyles: {
        desktop: { width: 1200, minHeight: 800, bgcolor: "#ffffff" },
        tablet: { width: 768, minHeight: 1024, bgcolor: "#ffffff" },
        mobile: { width: 375, minHeight: 667, bgcolor: "#ffffff" },
      },
    },
    related: {
      settings: PageSettings,
    },
  },
});

export { PageWithCraft as Page };

export const PageDefaultProps = {
  background: "#fff",
  padding: 0,
};

Page.craft = {
  related: {
    settings: PageSettings,
  },
};
