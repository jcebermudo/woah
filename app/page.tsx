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
    <div className="mx-auto w-[800px]">
      <h1 className="text-xl font-semibold text-center">
        A super simple page editor
      </h1>
      <Editor
        resolver={{ Card, UserButton, Text, Container, CardTop, CardBottom }}
      >
        <ViewportContext.Provider
          value={{
            currentViewport: currentDevice,
            setCurrentViewport: setCurrentDevice,
          }}
        >
          <Topbar />
          <div className="flex gap-3">
            <div className="w-1/4">
              <div className="bg-card rounded-lg shadow-sm">
                <Toolbox />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-col items-center gap-4">
                <PreviewControls
                  currentDevice={currentDevice}
                  onDeviceChange={setCurrentDevice}
                />
                <div
                  className="transition-all duration-300 ease-in-out"
                  style={{
                    width: getFrameWidth(),
                    margin: "0 auto",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    overflow: "hidden",
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
            <div className="w-1/4">
              <div className="bg-card rounded-lg shadow-sm">
                <SettingsPanel />
              </div>
            </div>
          </div>
        </ViewportContext.Provider>
      </Editor>
    </div>
  );
}
