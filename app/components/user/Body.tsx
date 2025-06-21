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
  /* typography & colors */
  fontSize?: number;
  color?: string;
  bgcolor: string;

  /* spacing / sizing */
  padding?: number;
  width?: string | number;
  minHeight?: string | number;

  /* layout */
  layout?: "stack" | "grid"; // default: stack (flex)

  /* stack-specific (flex) */
  direction?: "row" | "column";
  justify?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around"
    | "space-evenly";
  align?: "flex-start" | "center" | "flex-end";
  wrap?: boolean;
  gapX?: number;
  gapY?: number;

  /* grid-specific */
  columns?: number;
  rows?: number;

  columnsMode?: "auto" | "fixed";
  sizeModeX?: "fixed" | "min"; // width
  sizeModeY?: "fixed" | "fill" | "fit"; // height
  justifyItems?: "start" | "center" | "end";
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

  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const { currentViewport } = useViewport();

  const getCurrentStyles = () => {
    return responsiveStyles?.[currentViewport || "desktop"] || {};
  };

  const current = getCurrentStyles();

  /*
   * Build style object for editor (enabled=true). Preview mode continues to use
   * existing inline <body> mirroring – we leave that untouched for now.
   */
  const editorStyles: React.CSSProperties = {
    /* layout */
    // Apply display only when a layout has been selected
    display: current.layout
      ? current.layout === "grid"
        ? "grid"
        : "flex"
      : undefined,
    flexDirection:
      current.layout && current.layout !== "grid"
        ? current.direction === "column"
          ? "column"
          : "row"
        : undefined,
    justifyContent:
      current.layout === "grid"
        ? current.columnsMode !== "fixed"
          ? current.justify || "flex-start"
          : undefined
        : current.layout
          ? current.justify || "flex-start"
          : undefined,
    alignItems:
      current.layout && current.layout !== "grid"
        ? current.align || "flex-start"
        : undefined,
    flexWrap:
      current.layout && current.layout !== "grid"
        ? current.wrap
          ? "wrap"
          : "nowrap"
        : undefined,
    gap:
      current.layout &&
      (current.gapX !== undefined || current.gapY !== undefined)
        ? `${current.gapY ?? 0}px ${current.gapX ?? current.gapY ?? 0}px`
        : undefined,

    // Grid definitions
    gridTemplateColumns:
      current.layout === "grid"
        ? current.columnsMode === "fixed"
          ? `repeat(${current.columns ?? 1}, 1fr)`
          : "repeat(auto-fit,minmax(0,1fr))"
        : undefined,
    gridTemplateRows:
      current.layout === "grid" &&
      current.columnsMode === "fixed" &&
      current.rows
        ? `repeat(${current.rows}, auto)`
        : undefined,

    /* existing */
    backgroundColor:
      current.bgcolor === "none"
        ? "transparent"
        : (current.bgcolor ?? undefined),
    color: current.color,
    fontSize: current.fontSize ? `${current.fontSize}px` : undefined,
    padding: current.padding ? `${current.padding}px` : undefined,

    // Width: simple fixed value (sizeModeX handled elsewhere)
    width: current.width ? `${current.width}px` : undefined,

    // Height handling based on sizeModeY when using grid
    height:
      current.layout === "grid"
        ? current.sizeModeY === "fill"
          ? "100%"
          : current.sizeModeY === "fit"
            ? "fit-content"
            : current.minHeight
              ? `${current.minHeight}px`
              : undefined
        : undefined,

    // minHeight:
    // • For non-grid layouts always honour the value (was lost causing 0-height canvas)
    // • For grid, only when sizeModeY === "fixed" so fill/fit keep working
    minHeight:
      current.layout !== "grid"
        ? current.minHeight !== undefined
          ? `${current.minHeight}px`
          : undefined
        : current.sizeModeY === "fixed" && current.minHeight !== undefined
          ? `${current.minHeight}px`
          : undefined,
  };

  // Mirror the current page styles onto the real <body> element so that this
  // Craft root behaves like the actual body tag.
  useEffect(() => {
    // When the editor is active (enabled), we render the styles directly on the wrapper <div>.
    // Applying them to document.body during edit mode causes the entire editor chrome to shift,
    // so only mirror the styles to <body> when the editor is NOT enabled (i.e. in preview / publish).
    if (enabled) {
      console.log("enabled");
      return;
    }

    const styles = getCurrentStyles();

    const prev = {
      backgroundColor: document.body.style.backgroundColor,
      color: document.body.style.color,
      fontSize: document.body.style.fontSize,
      padding: document.body.style.padding,
      display: document.body.style.display,
      flexDirection: document.body.style.flexDirection,
      justifyContent: document.body.style.justifyContent,
      alignItems: document.body.style.alignItems,
      flexWrap: document.body.style.flexWrap,
      gap: document.body.style.gap,
      gridTemplateColumns: document.body.style.gridTemplateColumns,
      gridTemplateRows: document.body.style.gridTemplateRows,
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

    // Layout
    if (styles.layout) {
      document.body.style.display = styles.layout === "grid" ? "grid" : "flex";
    }
    if (styles.layout !== "grid") {
      if (styles.direction) {
        document.body.style.flexDirection = styles.direction;
      }
      if (styles.justify) {
        document.body.style.justifyContent = styles.justify;
      }
      if (styles.align) {
        document.body.style.alignItems = styles.align;
      }
      if (styles.wrap !== undefined) {
        document.body.style.flexWrap = styles.wrap ? "wrap" : "nowrap";
      }
      if (styles.gapX !== undefined || styles.gapY !== undefined) {
        document.body.style.gap = `${styles.gapY ?? 0}px ${styles.gapX ?? styles.gapY ?? 0}px`;
      }
    } else {
      // grid specific
      if (styles.columns) {
        document.body.style.gridTemplateColumns = `repeat(${styles.columns}, 1fr)`;
      }
      if (styles.columnsMode === "fixed" && styles.rows) {
        document.body.style.gridTemplateRows = `repeat(${styles.rows}, auto)`;
      }
      if (styles.gapX !== undefined || styles.gapY !== undefined) {
        document.body.style.gap = `${styles.gapY ?? 0}px ${styles.gapX ?? styles.gapY ?? 0}px`;
      }
    }

    // Restore previous body styles on unmount / viewport switch
    return () => {
      document.body.style.backgroundColor = prev.backgroundColor;
      document.body.style.color = prev.color;
      document.body.style.fontSize = prev.fontSize;
      document.body.style.padding = prev.padding;
      document.body.style.display = prev.display;
      document.body.style.flexDirection = prev.flexDirection;
      document.body.style.justifyContent = prev.justifyContent;
      document.body.style.alignItems = prev.alignItems;
      document.body.style.flexWrap = prev.flexWrap;
      document.body.style.gap = prev.gap;
      document.body.style.gridTemplateColumns = prev.gridTemplateColumns;
      document.body.style.gridTemplateRows = prev.gridTemplateRows;
    };
  }, [enabled, currentViewport, responsiveStyles]);

  return (
    <div
      ref={(ref) => void (ref && connect(drag(ref)))}
      className="flow-root"
      style={enabled ? editorStyles : { display: "contents" }}
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
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export const BodyDefaultProps = {
  background: "#fff",
};

Body.craft = {
  related: {
    settings: BodySettings,
  },
};
