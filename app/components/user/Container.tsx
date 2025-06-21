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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Plus, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

// Default per-viewport styles, mirroring Body’s schema
const defaultViewportStyles = {
  /* typography & colors */
  fontSize: 16,
  color: "#000000",
  bgcolor: "#ffffff",

  /* spacing */
  padding: 0,

  /* sizing */
  width: 500, // visible on drop
  minHeight: 300,

  /* layout */
  layout: undefined, // disabled by default; user can enable via settings
  direction: "column" as const,
  wrap: false,
  gapX: 0,
  gapY: 0,

  /* grid specifics */
  columnsMode: "auto" as const,
  sizeModeX: "fixed" as const,
  sizeModeY: "fixed" as const,
};

const defaultResponsiveStyles: ResponsiveStyles = {
  desktop: { ...defaultViewportStyles },
  tablet: { ...defaultViewportStyles },
  mobile: { ...defaultViewportStyles },
};

// Align with Body’s ViewportStyles so we can re-use BodySettings
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
  layout?: "stack" | "grid";

  /* stack-specific */
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
  sizeModeX?: "fixed" | "min";
  sizeModeY?: "fixed" | "fill" | "fit";
  justifyItems?: "start" | "center" | "end";
};

type ResponsiveStyles = {
  desktop: ViewportStyles;
  tablet: ViewportStyles;
  mobile: ViewportStyles;
};

export const Container = ({
  responsiveStyles = defaultResponsiveStyles,
  children,
}: {
  responsiveStyles?: ResponsiveStyles;
  children?: React.ReactNode;
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  const { currentViewport } = useViewport();

  const getCurrentStyles = () => {
    return (
      (responsiveStyles || defaultResponsiveStyles)[
        currentViewport || "desktop"
      ] || {}
    );
  };

  const current = getCurrentStyles();

  return (
    <div
      ref={(ref) => void (ref && connect(drag(ref)))}
      style={{
        borderRadius: "0px",

        /* layout */
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

        /* grid definitions */
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
        justifyItems:
          current.layout === "grid" && current.columnsMode === "fixed"
            ? current.justifyItems || "start"
            : undefined,

        /* visuals */
        backgroundColor:
          current.bgcolor === "none" ? "transparent" : current.bgcolor,
        color: current.color,
        fontSize: current.fontSize ? `${current.fontSize}px` : undefined,
        padding: current.padding ? `${current.padding}px` : undefined,

        /* sizing */
        width: current.width
          ? typeof current.width === "number"
            ? `${current.width}px`
            : current.width
          : undefined,
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
        minHeight:
          current.layout !== "grid"
            ? current.minHeight !== undefined
              ? `${current.minHeight}px`
              : undefined
            : current.sizeModeY === "fixed" && current.minHeight !== undefined
              ? `${current.minHeight}px`
              : undefined,
        maxHeight: "100%",
      }}
    >
      {children}
    </div>
  );
};

// NEW ContainerSettings (copied from BodySettings to allow further customization)
export const ContainerSettings = () => {
  const {
    actions: { setProp },
    responsiveStyles,
  } = useNode((node) => ({
    responsiveStyles: node.data.props.responsiveStyles,
  }));

  // Ensure responsiveStyles exists
  useEffect(() => {
    if (!responsiveStyles) {
      setProp((props: { responsiveStyles: ResponsiveStyles }) => {
        props.responsiveStyles = { ...defaultResponsiveStyles };
      });
    }
  }, [responsiveStyles, setProp]);

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
                        : (responsiveStyles[viewport].bgcolor as string)
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
                          e.target.value as any
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
                            parseInt(e.target.value) || 0
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
                            parseInt(e.target.value) || 0
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
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                    )}
                  </div>

                  {/* Rows (only when fixed columns) */}
                  {responsiveStyles[viewport].columnsMode === "fixed" && (
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
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                    </div>
                  )}

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
                            parseInt(e.target.value) || 0
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
                            parseInt(e.target.value) || 0
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
                          disabled={false}
                          onChange={(e) =>
                            updateStyle(
                              viewport,
                              "width",
                              parseInt(e.target.value) || 0
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
                              e.target.value as any
                            )
                          }
                          className="border rounded-md bg-background px-2"
                        >
                          <option value="fixed">Fixed</option>
                          <option value="min">Min</option>
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
                              parseInt(e.target.value) || 0
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
                              e.target.value as any
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

                  {/* Horizontal alignment inside grid cell (hidden when width mode is min) */}
                  {/* In auto-columns mode, align maps to justify (container). In fixed mode, align maps to justifyItems (cell) */}
                  {responsiveStyles[viewport].sizeModeX !== "min" && (
                    <div className="space-y-1">
                      <Label>Align</Label>
                      <ToggleGroup
                        type="single"
                        value={
                          responsiveStyles[viewport].columnsMode === "fixed"
                            ? responsiveStyles[viewport].justifyItems || "start"
                            : (responsiveStyles[viewport].justify as any) ||
                              "flex-start"
                        }
                        onValueChange={(v) =>
                          updateStyle(
                            viewport,
                            responsiveStyles[viewport].columnsMode === "fixed"
                              ? "justifyItems"
                              : "justify",
                            (v ||
                              (responsiveStyles[viewport].columnsMode ===
                              "fixed"
                                ? "start"
                                : "flex-start")) as any
                          )
                        }
                        className="w-full"
                      >
                        <ToggleGroupItem value="start" className="flex-1">
                          <AlignLeft size={14} />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="center" className="flex-1">
                          <AlignCenter size={14} />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="flex-end" className="flex-1">
                          <AlignRight size={14} />
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  )}
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

Container.craft = {
  related: {
    settings: ContainerSettings,
  },
  props: {
    responsiveStyles: defaultResponsiveStyles,
  },
};

export const ContainerDefaultProps = {
  background: "#fff",
  padding: 0,
};
