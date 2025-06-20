import React, { useState, useEffect, useRef } from "react";
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

const ScaleHandle = ({
  onMouseDown,
  isVisible,
  canvasScale = 1,
  outlineWidth = 0,
}: {
  onMouseDown: (e: React.MouseEvent) => void;
  isVisible: boolean;
  canvasScale?: number;
  outlineWidth?: number;
}) => {
  if (!isVisible) return null;

  // Calculate inverse scale to maintain consistent handle size
  const handleScale = 1 / Math.max(canvasScale, 0.1); // Prevent division by very small numbers
  const baseSize = 12; // Base handle size in pixels
  const baseBorder = 2; // Base border width in pixels
  
  const handleSize = baseSize * handleScale;
  const borderWidth = baseBorder * handleScale;
  const baseOffset = 8; // Base distance from element
  
  // Account for outline width in positioning
  const offset = (baseOffset + outlineWidth) * handleScale;

  return (
    <div
      style={{
        position: "absolute",
        bottom: `${-offset}px`,
        left: "50%",
        transform: "translateX(-50%)",
        width: `${handleSize}px`,
        height: `${handleSize}px`,
        backgroundColor: "#2563eb",
        border: `${borderWidth}px solid white`,
        borderRadius: "50%",
        cursor: "ns-resize",
        zIndex: 1000,
        // Add box shadow for better visibility
        boxShadow: `0 ${2 * handleScale}px ${4 * handleScale}px rgba(0, 0, 0, 0.2)`,
        // Ensure minimum and maximum sizes for usability
        minWidth: "8px",
        minHeight: "8px",
        maxWidth: "20px",
        maxHeight: "20px",
      }}
      onMouseDown={onMouseDown}
    />
  );
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

  const { query } = useEditor();
  const [editable, setEditable] = useState(false);
  const [isScaling, setIsScaling] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const { currentViewport } = useViewport();
  const containerRef = useRef<HTMLDivElement>(null);
  const startDataRef = useRef<{
    startY: number;
    startFontSize: number;
  }>({ startY: 0, startFontSize: 0 });

  useEffect(() => {
    !hasSelectedNode && setEditable(false);
  }, [hasSelectedNode]);

  // Enhanced canvas scale detection
  useEffect(() => {
    const updateCanvasScale = () => {
      // Method 1: Look for the canvas container with specific ref or class
      let canvasContainer = document.querySelector('[style*="transform"]');
      
      // Method 2: Walk up the DOM tree to find the scaled container
      if (!canvasContainer && containerRef.current) {
        let element = containerRef.current.parentElement;
        while (element && element !== document.body) {
          const transform = window.getComputedStyle(element).transform;
          if (transform && transform !== "none" && transform.includes("scale")) {
            canvasContainer = element;
            break;
          }
          element = element.parentElement;
        }
      }

      // Method 3: Look for common canvas container patterns
      if (!canvasContainer) {
        const possibleContainers = [
          '[ref*="container"]',
          '[class*="canvas"]',
          '[style*="translate"]',
          '.canvas-container',
          '#canvas-container'
        ];

        for (const selector of possibleContainers) {
          const element = document.querySelector(selector);
          if (element) {
            const transform = window.getComputedStyle(element).transform;
            if (transform && transform !== "none") {
              canvasContainer = element;
              break;
            }
          }
        }
      }

      if (canvasContainer) {
        const transform = window.getComputedStyle(canvasContainer).transform;
        if (transform && transform !== "none") {
          try {
            const matrix = new DOMMatrix(transform);
            // Calculate scale from the transformation matrix
            const scaleX = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b);
            const scaleY = Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d);
            const scale = (scaleX + scaleY) / 2; // Average of X and Y scales
            
            if (scale > 0 && isFinite(scale)) {
              setCanvasScale(scale);
            }
          } catch (error) {
            console.warn("Failed to parse transform matrix:", error);
          }
        }
      }
    };

    // Update scale when selected
    if (hasSelectedNode) {
      updateCanvasScale();

      // Set up mutation observer to watch for transform changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            updateCanvasScale();
          }
        });
      });

      // Observe multiple potential containers
      const elementsToObserve = [
        ...document.querySelectorAll('[style*="transform"]'),
        ...document.querySelectorAll('[style*="scale"]'),
      ];

      elementsToObserve.forEach((element) => {
        observer.observe(element, {
          attributes: true,
          attributeFilter: ['style'],
        });
      });

      // Also set up a periodic check as fallback
      const intervalId = setInterval(updateCanvasScale, 100);

      return () => {
        observer.disconnect();
        clearInterval(intervalId);
      };
    }
  }, [hasSelectedNode]);

  const getCurrentStyles = () => {
    return responsiveStyles[currentViewport || "desktop"];
  };

  const handleScaleStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsScaling(true);
    startDataRef.current = {
      startY: e.clientY,
      startFontSize: getCurrentStyles().fontSize,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startDataRef.current.startY;
      // Adjust sensitivity based on canvas scale for consistent feel
      const scaleFactor = (deltaY * 0.5) / Math.max(canvasScale, 0.1);

      const newFontSize = Math.max(
        8,
        Math.min(200, startDataRef.current.startFontSize + scaleFactor)
      );

      setProp((props: { responsiveStyles: ResponsiveStyles }) => {
        props.responsiveStyles[currentViewport || "desktop"].fontSize =
          Math.round(newFontSize);
      });
    };

    const handleMouseUp = () => {
      setIsScaling(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditable(true);
  };

  // Calculate consistent outline width based on canvas scale
  const getOutlineWidth = () => {
    const baseWidth = 2; // Base outline width in pixels
    return Math.max(0.5, baseWidth / Math.max(canvasScale, 0.1));
  };

  const outlineWidth = hasSelectedNode ? getOutlineWidth() : 0;

  return (
    <div
      ref={(ref) => {
        if (ref) {
          containerRef.current = ref;
          connect(drag(ref));
        }
      }}
      onDoubleClick={handleDoubleClick}
      style={{
        position: "relative",
        display: "inline-block",
        outline: hasSelectedNode ? `${getOutlineWidth()}px solid #2563eb` : "none",
        outlineOffset: "0px",
        borderRadius: "0px",
        minWidth: "20px",
        minHeight: "20px",
      }}
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
        tagName="div"
        style={{
          fontSize: `${getCurrentStyles().fontSize}px`,
          color: getCurrentStyles().color,
          backgroundColor:
            getCurrentStyles().bgcolor === "none"
              ? "transparent"
              : getCurrentStyles().bgcolor,
          outline: "none",
          cursor: editable ? "text" : "default",
          userSelect: editable ? "text" : "none",
        }}
      />

      {/* Scale Handle - Only show when selected and not editing */}
      {hasSelectedNode && !editable && (
        <ScaleHandle
          onMouseDown={handleScaleStart}
          isVisible={true}
          canvasScale={canvasScale}
        />
      )}

      {/* Visual feedback during scaling */}
      {isScaling && (
        <div
          style={{
            position: "absolute",
            top: `${-25 / Math.max(canvasScale, 0.1)}px`,
            left: "50%",
            transform: `translateX(-50%) scale(${1 / Math.max(canvasScale, 0.1)})`,
            backgroundColor: "#2563eb",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "bold",
            zIndex: 1001,
            pointerEvents: "none",
            transformOrigin: "center bottom",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            // Ensure tooltip doesn't get too small or large
            minWidth: "30px",
            textAlign: "center",
          }}
        >
          {getCurrentStyles().fontSize}px
        </div>
      )}
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
              <div className="space-y-2">
                <div>
                  <Label htmlFor={`font-size-${viewport}`}>Font size</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`font-size-${viewport}`}
                      type="number"
                      value={responsiveStyles[viewport].fontSize}
                      onChange={(e) =>
                        updateStyle(
                          viewport,
                          "fontSize",
                          parseInt(e.target.value) || 1
                        )
                      }
                    />
                    <span className="text-sm text-muted-foreground">px</span>
                  </div>
                  <div className="mt-2">
                    <Slider
                      value={[responsiveStyles[viewport].fontSize]}
                      onValueChange={([value]) =>
                        updateStyle(viewport, "fontSize", value)
                      }
                      max={200}
                      min={8}
                      step={1}
                      className="w-full"
                    />
                  </div>
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
                          e.target.value === "#ffffff" ? "none" : e.target.value
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