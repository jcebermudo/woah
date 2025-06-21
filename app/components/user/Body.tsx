// components/user/Container.js
import React from "react";
import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useViewport } from "@/app/components/context/ViewportContext";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useEditor } from "@craftjs/core";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
  sizeModeX?: "fixed" | "fill" | "fit"; // width
  sizeModeY?: "fixed" | "fill" | "fit"; // height
  justifyItems?: "start" | "center" | "end";
  alignItems?: "start" | "center" | "end";
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
      current.layout && current.layout !== "grid"
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
    gridTemplateColumns:
      current.layout === "grid" && current.columns
        ? `repeat(${current.columns}, 1fr)`
        : undefined,
    gridTemplateRows:
      current.layout === "grid" && current.rows
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
    width: current.width ? `${current.width}px` : undefined,
    minHeight: current.minHeight ? `${current.minHeight}px` : undefined,
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
      if (styles.rows) {
        document.body.style.gridTemplateRows = `repeat(${styles.rows}, auto)`;
      }
      if (styles.gapX !== undefined || styles.gapY !== undefined) {
        document.body.style.gap = `${styles.gapY ?? 0}px ${styles.gapX ?? styles.gapY ?? 0}px`;
      }
    }

    /* grid options */
    if (current.layout === "grid") {
      editorStyles.gridTemplateColumns =
        current.columnsMode === "fixed"
          ? `repeat(${current.columns ?? 1}, 1fr)`
          : "repeat(auto-fit,minmax(0,1fr))";

      // width / height modes
      editorStyles.width =
        current.sizeModeX === "fill"
          ? "100%"
          : current.sizeModeX === "fit"
            ? "fit-content"
            : current.width
              ? `${current.width}px`
              : undefined;

      editorStyles.height =
        current.sizeModeY === "fill"
          ? "100%"
          : current.sizeModeY === "fit"
            ? "fit-content"
            : current.minHeight
              ? `${current.minHeight}px`
              : undefined;

      editorStyles.justifyItems = current.justifyItems ?? undefined;
      editorStyles.alignItems = current.alignItems ?? undefined;
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

  const disableLayout = (viewport: keyof ResponsiveStyles) => {
    setProp((props: { responsiveStyles: ResponsiveStyles }) => {
      props.responsiveStyles[viewport].layout = undefined;
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
                        e.target.value === "#ffffff" ? "none" : e.target.value,
                      )
                    }
                  />
                </div>
              </div>

              {/* Layout */}
              {!responsiveStyles[viewport].layout ? (
                <div className="my-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => updateStyle(viewport, "layout", "stack")}
                  >
                    Layout <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Layout</Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => disableLayout(viewport)}
                    >
                      <Plus className="w-4 h-4 rotate-45" />
                    </Button>
                  </div>
                  <Tabs
                    value={responsiveStyles[viewport].layout || "stack"}
                    onValueChange={(v) =>
                      updateStyle(viewport, "layout", v as any)
                    }
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="stack" className="w-full">
                        Stack
                      </TabsTrigger>
                      <TabsTrigger value="grid" className="w-full">
                        Grid
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}

              {/* Stack-specific controls */}
              {responsiveStyles[viewport].layout === "stack" && (
                <div className="space-y-2">
                  <div>
                    <Label>Direction</Label>
                    <select
                      value={responsiveStyles[viewport].direction || "row"}
                      onChange={(e) =>
                        updateStyle(
                          viewport,
                          "direction",
                          e.target.value as any,
                        )
                      }
                      className="w-full border rounded-md px-2 py-1 bg-background"
                    >
                      <option value="row">Horizontal</option>
                      <option value="column">Vertical</option>
                    </select>
                  </div>
                  <div>
                    <Label>Distribute</Label>
                    <select
                      value={responsiveStyles[viewport].justify || "flex-start"}
                      onChange={(e) =>
                        updateStyle(viewport, "justify", e.target.value as any)
                      }
                      className="w-full border rounded-md px-2 py-1 bg-background"
                    >
                      <option value="flex-start">Start</option>
                      <option value="center">Center</option>
                      <option value="flex-end">End</option>
                      <option value="space-between">Space Between</option>
                      <option value="space-around">Space Around</option>
                      <option value="space-evenly">Space Evenly</option>
                    </select>
                  </div>
                  <div>
                    <Label>Align</Label>
                    <select
                      value={responsiveStyles[viewport].align || "flex-start"}
                      onChange={(e) =>
                        updateStyle(viewport, "align", e.target.value as any)
                      }
                      className="w-full border rounded-md px-2 py-1 bg-background"
                    >
                      <option value="flex-start">Start</option>
                      <option value="center">Center</option>
                      <option value="flex-end">End</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Wrap</Label>
                    <Switch
                      checked={!!responsiveStyles[viewport].wrap}
                      onCheckedChange={(checked) =>
                        updateStyle(viewport, "wrap", checked)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Gap X</Label>
                      <Input
                        type="number"
                        value={responsiveStyles[viewport].gapX ?? 0}
                        min={0}
                        max={200}
                        onChange={(e) =>
                          updateStyle(
                            viewport,
                            "gapX",
                            parseInt(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label>Gap Y</Label>
                      <Input
                        type="number"
                        value={responsiveStyles[viewport].gapY ?? 0}
                        min={0}
                        max={200}
                        onChange={(e) =>
                          updateStyle(
                            viewport,
                            "gapY",
                            parseInt(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Grid-specific controls */}
              {responsiveStyles[viewport].layout === "grid" && (
                <div className="space-y-4">
                  {/* Columns mode (Auto vs Fixed) */}
                  <div className="space-y-2">
                    <Label>Columns</Label>
                    <Tabs
                      value={responsiveStyles[viewport].columnsMode || "auto"}
                      onValueChange={(v) =>
                        updateStyle(viewport, "columnsMode", v as any)
                      }
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="auto">Auto</TabsTrigger>
                        <TabsTrigger value="fixed">Fixed</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    {responsiveStyles[viewport].columnsMode === "fixed" && (
                      <Input
                        type="number"
                        value={responsiveStyles[viewport].columns ?? 1}
                        min={1}
                        max={12}
                        onChange={(e) =>
                          updateStyle(
                            viewport,
                            "columns",
                            parseInt(e.target.value) || 1,
                          )
                        }
                      />
                    )}
                  </div>

                  {/* Rows */}
                  <div>
                    <Label>Rows</Label>
                    <Input
                      type="number"
                      value={responsiveStyles[viewport].rows ?? 1}
                      min={1}
                      max={12}
                      onChange={(e) =>
                        updateStyle(
                          viewport,
                          "rows",
                          parseInt(e.target.value) || 1,
                        )
                      }
                    />
                  </div>

                  {/* Gap */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Gap X</Label>
                      <Input
                        type="number"
                        value={responsiveStyles[viewport].gapX ?? 0}
                        min={0}
                        max={200}
                        onChange={(e) =>
                          updateStyle(
                            viewport,
                            "gapX",
                            parseInt(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label>Gap Y</Label>
                      <Input
                        type="number"
                        value={responsiveStyles[viewport].gapY ?? 0}
                        min={0}
                        max={200}
                        onChange={(e) =>
                          updateStyle(
                            viewport,
                            "gapY",
                            parseInt(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Size modes */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Width</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={responsiveStyles[viewport].width ?? 200}
                          disabled={
                            responsiveStyles[viewport].sizeModeX !== "fixed"
                          }
                          onChange={(e) =>
                            updateStyle(
                              viewport,
                              "width",
                              parseInt(e.target.value) || 0,
                            )
                          }
                        />
                        <select
                          value={
                            responsiveStyles[viewport].sizeModeX || "fixed"
                          }
                          onChange={(e) =>
                            updateStyle(
                              viewport,
                              "sizeModeX",
                              e.target.value as any,
                            )
                          }
                          className="border rounded-md bg-background px-2"
                        >
                          <option value="fixed">Fixed</option>
                          <option value="fill">Fill</option>
                          <option value="fit">Fit</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label>Height</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={responsiveStyles[viewport].minHeight ?? 200}
                          disabled={
                            responsiveStyles[viewport].sizeModeY !== "fixed"
                          }
                          onChange={(e) =>
                            updateStyle(
                              viewport,
                              "minHeight",
                              parseInt(e.target.value) || 0,
                            )
                          }
                        />
                        <select
                          value={
                            responsiveStyles[viewport].sizeModeY || "fixed"
                          }
                          onChange={(e) =>
                            updateStyle(
                              viewport,
                              "sizeModeY",
                              e.target.value as any,
                            )
                          }
                          className="border rounded-md bg-background px-2"
                        >
                          <option value="fixed">Fixed</option>
                          <option value="fill">Fill</option>
                          <option value="fit">Fit</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Alignment inside grid cell */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Justify Items</Label>
                      <select
                        value={
                          responsiveStyles[viewport].justifyItems || "start"
                        }
                        onChange={(e) =>
                          updateStyle(
                            viewport,
                            "justifyItems",
                            e.target.value as any,
                          )
                        }
                        className="w-full border rounded-md px-2 py-1 bg-background"
                      >
                        <option value="start">Start</option>
                        <option value="center">Center</option>
                        <option value="end">End</option>
                      </select>
                    </div>
                    <div>
                      <Label>Align Items</Label>
                      <select
                        value={responsiveStyles[viewport].alignItems || "start"}
                        onChange={(e) =>
                          updateStyle(
                            viewport,
                            "alignItems",
                            e.target.value as any,
                          )
                        }
                        className="w-full border rounded-md px-2 py-1 bg-background"
                      >
                        <option value="start">Start</option>
                        <option value="center">Center</option>
                        <option value="end">End</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

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
                      parseInt(e.target.value) || 0,
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
