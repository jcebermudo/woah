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
import { RenderNode } from "./components/RenderNode";

// Canvas state interface
interface CanvasState {
  scale: number;
  translateX: number;
  translateY: number;
}

// Canvas bounds for infinite scrolling
const CANVAS_SIZE = 10000; // Large virtual canvas size
const CANVAS_CENTER = CANVAS_SIZE / 2;

// Scroll sensitivity settings
const SCROLL_SENSITIVITY = 2;
const SMOOTH_SCROLL_FACTOR = 0.1;

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

  // Scroll state
  const [isScrolling, setIsScrolling] = useState(false);
  const [targetTranslate, setTargetTranslate] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Track main content position (center: 0,0 with fit scale)
  const [mainContentScale, setMainContentScale] = useState<number>(1);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const getFrameWidth = () => {
    switch (currentDevice) {
      case "desktop":
        return 1200;
      case "tablet":
        return 768;
      case "mobile":
        return 375;
      default:
        return 1200;
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

  // Smooth animation for canvas movement
  const animateToTarget = useCallback(() => {
    if (!targetTranslate) return;

    const currentX = canvasState.translateX;
    const currentY = canvasState.translateY;
    const targetX = targetTranslate.x;
    const targetY = targetTranslate.y;

    const deltaX = targetX - currentX;
    const deltaY = targetY - currentY;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < 0.5) {
      // Close enough, snap to target
      updateCanvasTransform({
        ...canvasState,
        translateX: targetX,
        translateY: targetY,
      });
      setTargetTranslate(null);
      setIsScrolling(false);
      return;
    }

    // Smooth interpolation
    const newX = currentX + deltaX * SMOOTH_SCROLL_FACTOR;
    const newY = currentY + deltaY * SMOOTH_SCROLL_FACTOR;

    updateCanvasTransform({
      ...canvasState,
      translateX: newX,
      translateY: newY,
    });

    animationFrameRef.current = requestAnimationFrame(animateToTarget);
  }, [canvasState, targetTranslate, updateCanvasTransform]);

  // Start smooth animation
  useEffect(() => {
    if (targetTranslate && !isPanning) {
      setIsScrolling(true);
      animationFrameRef.current = requestAnimationFrame(animateToTarget);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetTranslate, isPanning, animateToTarget]);

  // Handle scroll with smooth animation
  const handleScroll = useCallback(
    (deltaX: number, deltaY: number) => {
      if (isPanning) return; // Don't scroll while panning

      const newTargetX = canvasState.translateX + deltaX * SCROLL_SENSITIVITY;
      const newTargetY = canvasState.translateY + deltaY * SCROLL_SENSITIVITY;

      setTargetTranslate({
        x: newTargetX,
        y: newTargetY,
      });

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set new timeout to stop scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    },
    [canvasState, isPanning]
  );

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
      // Cancel any ongoing smooth scrolling
      setTargetTranslate(null);
      setIsScrolling(false);

      updateCanvasTransform({
        ...canvasState,
        translateX: canvasState.translateX + deltaX,
        translateY: canvasState.translateY + deltaY,
      });
    },
    [canvasState, updateCanvasTransform]
  );

  // Go back to main content (center and fit)
  const goBackToMainContent = useCallback(() => {
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

    setMainContentScale(scale);
  }, [getFrameWidth, getFrameHeight, updateCanvasTransform]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only activate panning if not focused on input, textarea, or contenteditable
      const active = document.activeElement;
      const isInput =
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          (active as HTMLElement).isContentEditable);

      if (e.code === "Space" && !isSpacePressed && !isInput) {
        e.preventDefault();
        // Remove focus from any active button
        if (
          document.activeElement &&
          document.activeElement instanceof HTMLElement
        ) {
          document.activeElement.blur();
        }
        setIsSpacePressed(true);
        if (canvasRef.current) {
          canvasRef.current.style.cursor = "grab";
        }
      }

      // Home key to go back to main content
      if (e.code === "Home" && !isInput) {
        e.preventDefault();
        goBackToMainContent();
      }

      // Arrow keys for navigation
      if (!isInput) {
        const moveDistance = 50;
        switch (e.code) {
          case "ArrowUp":
            e.preventDefault();
            handleScroll(0, moveDistance);
            break;
          case "ArrowDown":
            e.preventDefault();
            handleScroll(0, -moveDistance);
            break;
          case "ArrowLeft":
            e.preventDefault();
            handleScroll(moveDistance, 0);
            break;
          case "ArrowRight":
            e.preventDefault();
            handleScroll(-moveDistance, 0);
            break;
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
  }, [isSpacePressed, handleScroll, goBackToMainContent]);

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

  // Wheel event handler for zoom and scroll
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Zoom functionality
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const centerX = e.clientX - rect.left - rect.width / 2;
        const centerY = e.clientY - rect.top - rect.height / 2;

        handleZoom(-e.deltaY * 0.01, centerX, centerY);
      } else {
        // Scroll functionality
        handleScroll(-e.deltaX, -e.deltaY);
      }
    },
    [handleZoom, handleScroll]
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

    setMainContentScale(scale);
  }, [getFrameWidth, getFrameHeight, updateCanvasTransform]);

  // Initialize canvas position
  useEffect(() => {
    fitToScreen();
  }, [currentDevice]); // Re-fit when device changes

  // Check if user has moved away from main content
  const isAwayFromMainContent = useCallback(() => {
    const threshold = 50; // pixels
    const scaleThreshold = 0.05;

    const translateDistance = Math.sqrt(
      Math.pow(canvasState.translateX, 2) + Math.pow(canvasState.translateY, 2)
    );

    const scaleDistance = Math.abs(canvasState.scale - mainContentScale);

    return translateDistance > threshold || scaleDistance > scaleThreshold;
  }, [canvasState, mainContentScale]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Editor
        resolver={{ Card, UserButton, Text, Container, CardTop, CardBottom }}
        indicator={{
          error: "#ef4444",
          success: "#0055ff",
        }}
        onRender={(props) => (
          <RenderNode {...props} canvasScale={canvasState.scale} />
        )}
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

                {/* Navigation and Zoom controls */}
                <div className="flex items-center gap-4 mt-2">
                  {/* Back to main content button - only show when away */}
                  {isAwayFromMainContent() && (
                    <button
                      onClick={goBackToMainContent}
                      onMouseDown={(e) => e.preventDefault()} // Prevent focus on mouse down
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors focus:outline-none"
                    >
                      ← Back to Main
                    </button>
                  )}

                  {/* Zoom controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={zoomOut}
                      onMouseDown={(e) => e.preventDefault()} // Prevent focus on mouse down
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm focus:outline-none"
                    >
                      −
                    </button>
                    <button
                      onClick={resetZoom}
                      onMouseDown={(e) => e.preventDefault()} // Prevent focus on mouse down
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm min-w-[60px] focus:outline-none"
                    >
                      {Math.round(canvasState.scale * 100)}%
                    </button>
                    <button
                      onClick={zoomIn}
                      onMouseDown={(e) => e.preventDefault()} // Prevent focus on mouse down
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm focus:outline-none"
                    >
                      +
                    </button>
                    <button
                      onClick={fitToScreen}
                      onMouseDown={(e) => e.preventDefault()} // Prevent focus on mouse down
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm ml-2 focus:outline-none"
                    >
                      Fit
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-1 text-center">
                  Scroll to navigate • Hold Space + Drag to pan • Cmd/Ctrl +
                  Scroll to zoom
                  <br />
                  Arrow keys to move • Home key to return to main content
                </div>
              </div>

              {/* Infinite Canvas */}
              <div
                ref={canvasRef}
                className="flex-1 relative bg-gray-50"
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
                  overflow: "hidden", // Hide scrollbars
                  scrollbarWidth: "none", // Firefox
                  msOverflowStyle: "none", // IE/Edge
                }}
              >
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
                    transition:
                      isScrolling && !isPanning
                        ? "transform 0.1s ease-out"
                        : "none",
                  }}
                >
                  {/* Frame */}
                  <div
                    ref={frameRef}
                    style={{
                      background: "white",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <Frame>
                      <Element
                        is={Container}
                        responsiveStyles={{
                          desktop: {
                            width: getFrameWidth(),
                            height: getFrameHeight(),
                            bgcolor: "#ffffff",
                          },
                          tablet: {
                            width: 768,
                            height: 1024,
                            bgcolor: "#ffffff",
                          },
                          mobile: {
                            width: 375,
                            height: 667,
                            bgcolor: "#ffffff",
                          },
                        }}
                        canvas
                      >
                        {/* children go here if needed */}
                      </Element>
                    </Frame>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Panel */}
            <div className="w-80 bg-card rounded-none shadow-sm flex flex-col h-screen overflow-hidden">
              <SettingsPanel />
            </div>
          </div>
        </ViewportContext.Provider>
      </Editor>
    </div>
  );
}
