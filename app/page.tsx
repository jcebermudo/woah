"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Editor, Frame, Element } from "@craftjs/core";

import { Toolbox } from "./components/Toolbox";
import { SettingsPanel } from "./components/SettingsPanel";
import { Topbar } from "./components/Topbar";
import { PreviewControls } from "./components/PreviewControls";

import { Container } from "./components/user/Container";
import { Button as UserButton } from "./components/user/Button";
import { Card, CardTop, CardBottom } from "./components/user/Card";
import { Text } from "./components/user/Text";
import { ViewportContext } from "@/app/components/context/ViewportContext";

// Canvas state interface
interface CanvasState {
  scale: number;
  translateX: number;
  translateY: number;
}

// Canvas bounds for infinite scrolling
const CANVAS_SIZE = 10000; // Large virtual canvas size
const CANVAS_CENTER = CANVAS_SIZE / 2;

export default function App() {
  const [currentDevice, setCurrentDevice] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");

  // Canvas state
  const [canvasState, setCanvasState] = useState<CanvasState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });

  // Interaction state
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getFrameWidth = () => {
    switch (currentDevice) {
      case "desktop":
        return 1440;
      case "tablet":
        return 768;
      case "mobile":
        return 375;
      default:
        return 1440;
    }
  };

  const getFrameHeight = () => {
    switch (currentDevice) {
      case "desktop":
        return 800;
      case "tablet":
        return 1024;
      case "mobile":
        return 667;
      default:
        return 800;
    }
  };

  // Transform canvas coordinates to screen coordinates
  const canvasToScreen = useCallback(
    (canvasX: number, canvasY: number) => {
      return {
        x: (canvasX + canvasState.translateX) * canvasState.scale,
        y: (canvasY + canvasState.translateY) * canvasState.scale,
      };
    },
    [canvasState]
  );

  // Transform screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: screenX / canvasState.scale - canvasState.translateX,
        y: screenY / canvasState.scale - canvasState.translateY,
      };
    },
    [canvasState]
  );

  // Update canvas transform
  const updateCanvasTransform = useCallback((newState: CanvasState) => {
    if (containerRef.current) {
      const transform = `translate(${newState.translateX}px, ${newState.translateY}px) scale(${newState.scale})`;
      containerRef.current.style.transform = transform;
    }
    setCanvasState(newState);
  }, []);

  // Handle zoom
  const handleZoom = useCallback(
    (delta: number, centerX: number, centerY: number) => {
      const scaleFactor = 1 + delta * 0.1;
      const newScale = Math.max(
        0.1,
        Math.min(5, canvasState.scale * scaleFactor)
      );

      if (newScale === canvasState.scale) return;

      // Calculate new translation to zoom around the center point
      const scaleRatio = newScale / canvasState.scale;
      const newTranslateX =
        centerX - (centerX - canvasState.translateX) * scaleRatio;
      const newTranslateY =
        centerY - (centerY - canvasState.translateY) * scaleRatio;

      updateCanvasTransform({
        scale: newScale,
        translateX: newTranslateX,
        translateY: newTranslateY,
      });
    },
    [canvasState, updateCanvasTransform]
  );

  // Handle pan
  const handlePan = useCallback(
    (deltaX: number, deltaY: number) => {
      updateCanvasTransform({
        ...canvasState,
        translateX: canvasState.translateX + deltaX,
        translateY: canvasState.translateY + deltaY,
      });
    },
    [canvasState, updateCanvasTransform]
  );

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
        if (canvasRef.current) {
          canvasRef.current.style.cursor = "grab";
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        setIsPanning(false);
        setLastPanPoint(null);
        if (canvasRef.current) {
          canvasRef.current.style.cursor = "";
        }
      }
    };

    const handleBlur = () => {
      setIsSpacePressed(false);
      setIsPanning(false);
      setLastPanPoint(null);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isSpacePressed]);

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isSpacePressed) {
        e.preventDefault();
        setIsPanning(true);
        setLastPanPoint({ x: e.clientX, y: e.clientY });
        if (canvasRef.current) {
          canvasRef.current.style.cursor = "grabbing";
        }
      }
    },
    [isSpacePressed]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning && lastPanPoint && isSpacePressed) {
        const deltaX = e.clientX - lastPanPoint.x;
        const deltaY = e.clientY - lastPanPoint.y;

        handlePan(deltaX, deltaY);
        setLastPanPoint({ x: e.clientX, y: e.clientY });
      }
    },
    [isPanning, lastPanPoint, isSpacePressed, handlePan]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setLastPanPoint(null);
    if (canvasRef.current && isSpacePressed) {
      canvasRef.current.style.cursor = "grab";
    }
  }, [isSpacePressed]);

  // Wheel event handler for zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const centerX = e.clientX - rect.left - rect.width / 2;
        const centerY = e.clientY - rect.top - rect.height / 2;

        handleZoom(-e.deltaY * 0.01, centerX, centerY);
      }
    },
    [handleZoom]
  );

  // Zoom controls
  const zoomIn = useCallback(() => {
    handleZoom(1, 0, 0);
  }, [handleZoom]);

  const zoomOut = useCallback(() => {
    handleZoom(-1, 0, 0);
  }, [handleZoom]);

  const resetZoom = useCallback(() => {
    updateCanvasTransform({
      scale: 1,
      translateX: 0,
      translateY: 0,
    });
  }, [updateCanvasTransform]);

  const fitToScreen = useCallback(() => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const frameWidth = getFrameWidth();
    const frameHeight = getFrameHeight();

    const scaleX = (rect.width * 0.8) / frameWidth;
    const scaleY = (rect.height * 0.8) / frameHeight;
    const scale = Math.min(scaleX, scaleY);

    updateCanvasTransform({
      scale,
      translateX: 0,
      translateY: 0,
    });
  }, [getFrameWidth, getFrameHeight, updateCanvasTransform]);

  // Initialize canvas position
  useEffect(() => {
    fitToScreen();
  }, [currentDevice]); // Re-fit when device changes

  // Grid visibility state
  const [showGrid, setShowGrid] = useState(false);

  // Render infinite grid background (optional)
  const renderGrid = () => {
    if (!showGrid) return null;

    const gridSize = 20;
    const { scale, translateX, translateY } = canvasState;

    if (!canvasRef.current) return null;

    const rect = canvasRef.current.getBoundingClientRect();
    const startX = Math.floor(-translateX / gridSize) * gridSize;
    const startY = Math.floor(-translateY / gridSize) * gridSize;
    const endX = startX + rect.width / scale + gridSize;
    const endY = startY + rect.height / scale + gridSize;

    const lines = [];

    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={startY}
          x2={x}
          y2={endY}
          stroke="#e5e5e5"
          strokeWidth={1 / scale}
        />
      );
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={startX}
          y1={y}
          x2={endX}
          y2={y}
          stroke="#e5e5e5"
          strokeWidth={1 / scale}
        />
      );
    }

    return (
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {lines}
      </svg>
    );
  };

  return (
    <div className="h-screen flex flex-col">
      <Editor
        resolver={{ Card, UserButton, Text, Container, CardTop, CardBottom }}
      >
        <ViewportContext.Provider
          value={{
            currentViewport: currentDevice,
            setCurrentViewport: setCurrentDevice,
          }}
        >
          {/* Topbar */}
          <div className="w-full flex-shrink-0">
            <Topbar />
          </div>

          {/* Main content */}
          <div className="flex flex-1 min-h-0">
            {/* Toolbox */}
            <div className="w-64 bg-card rounded-none shadow-sm flex flex-col h-full">
              <Toolbox />
            </div>

            {/* Canvas area */}
            <div className="flex-1 flex flex-col h-full min-h-0">
              {/* Controls */}
              <div className="flex flex-col items-center py-4 bg-white z-10 border-b">
                <PreviewControls
                  currentDevice={currentDevice}
                  onDeviceChange={setCurrentDevice}
                />

                {/* Zoom controls */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={zoomOut}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                  >
                    −
                  </button>
                  <button
                    onClick={resetZoom}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm min-w-[60px]"
                  >
                    {Math.round(canvasState.scale * 100)}%
                  </button>
                  <button
                    onClick={zoomIn}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                  >
                    +
                  </button>
                  <button
                    onClick={fitToScreen}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm ml-2"
                  >
                    Fit
                  </button>
                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={`px-3 py-1 rounded text-sm ml-2 ${
                      showGrid
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    Grid
                  </button>
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  Hold Space + Drag to pan • Cmd/Ctrl + Scroll to zoom
                </div>
              </div>

              {/* Infinite Canvas */}
              <div
                ref={canvasRef}
                className="flex-1 relative overflow-hidden bg-gray-50"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                style={{
                  cursor: isSpacePressed
                    ? isPanning
                      ? "grabbing"
                      : "grab"
                    : "default",
                }}
              >
                {/* Grid background */}
                {renderGrid()}

                {/* Canvas container */}
                <div
                  ref={containerRef}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transformOrigin: "0 0",
                    transform: `translate(${canvasState.translateX}px, ${canvasState.translateY}px) scale(${canvasState.scale})`,
                    pointerEvents: isPanning ? "none" : "auto",
                  }}
                >
                  {/* Frame */}
                  <div
                    ref={frameRef}
                    style={{
                      width: getFrameWidth(),
                      height: getFrameHeight(),
                      background: "white",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      overflow: "hidden",
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <Frame>
                      <Element
                        is={Container}
                        padding={20}
                        background="#f8fafc"
                        canvas
                      >
                        <Card background="#fff" padding={20} />
                        <UserButton
                          size="sm"
                          variant="outline"
                          color="default"
                          text="Click me"
                        />
                        <Text
                          text="Welcome to your infinite canvas!"
                          responsiveStyles={{
                            desktop: {
                              fontSize: 18,
                              color: "#1f2937",
                              bgcolor: "none",
                            },
                            tablet: {
                              fontSize: 16,
                              color: "#1f2937",
                              bgcolor: "none",
                            },
                            mobile: {
                              fontSize: 14,
                              color: "#1f2937",
                              bgcolor: "none",
                            },
                          }}
                        />
                      </Element>
                    </Frame>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Panel */}
            <div className="w-80 bg-card rounded-none shadow-sm flex flex-col h-full">
              <SettingsPanel />
            </div>
          </div>
        </ViewportContext.Provider>
      </Editor>
    </div>
  );
}
