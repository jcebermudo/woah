"use client";

import React, { useState } from "react";
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

export default function App() {
  const [currentDevice, setCurrentDevice] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");
  const [zoom, setZoom] = useState(1);

  const getFrameWidth = () => {
    switch (currentDevice) {
      case "desktop":
        return "700px";
      case "tablet":
        return "768px";
      case "mobile":
        return "375px";
      default:
        return "100%";
    }
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
          {/* Topbar: full width at the top */}
          <div className="w-full flex-shrink-0">
            <Topbar />
          </div>
          {/* Main content: 3 columns, fills the rest of the screen */}
          <div className="flex flex-1 min-h-0">
            {/* Toolbox: left, full height */}
            <div className="w-64 bg-card rounded-none shadow-sm flex flex-col h-full">
              <Toolbox />
            </div>
            {/* Center: Preview and controls */}
            <div className="flex-1 flex flex-col h-full min-h-0">
              {/* Controls */}
              <div className="flex flex-col items-center py-4 bg-white z-10">
                <PreviewControls
                  currentDevice={currentDevice}
                  onDeviceChange={setCurrentDevice}
                />
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                  >
                    -
                  </button>
                  <span>{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>
                    +
                  </button>
                </div>
              </div>
              {/* Canvas */}
              <div className="flex-1 flex justify-center items-start overflow-auto bg-neutral-100 min-h-0">
                <div
                  style={{
                    width: 800,
                    minHeight: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: getFrameWidth(),
                      transform: `scale(${zoom})`,
                      transformOrigin: "top center",
                      transition: "width 0.2s, transform 0.2s",
                    }}
                  >
                    <Frame>
                      <Element
                        is={Container}
                        padding={5}
                        background="#eee"
                        canvas
                      >
                        <Card background="#fff" padding={5} />
                        <UserButton
                          size="sm"
                          variant="outline"
                          color="default"
                          text="Click"
                        />
                        <Text
                          text="Hi world!"
                          responsiveStyles={{
                            desktop: {
                              fontSize: 14,
                              color: "black",
                              bgcolor: "none",
                            },
                            tablet: {
                              fontSize: 14,
                              color: "black",
                              bgcolor: "none",
                            },
                            mobile: {
                              fontSize: 14,
                              color: "black",
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
            {/* SettingsPanel: right, full height */}
            <div className="w-80 bg-card rounded-none shadow-sm flex flex-col h-full">
              <SettingsPanel />
            </div>
          </div>
        </ViewportContext.Provider>
      </Editor>
    </div>
  );
}
