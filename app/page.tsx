"use client";

import React from "react";
import { Editor, Frame, Element } from "@craftjs/core";

import { Toolbox } from "./components/Toolbox";
import { SettingsPanel } from "./components/SettingsPanel";
import { Topbar } from "./components/Topbar";

import { Container } from "./components/user/Container";
import { Button as UserButton } from "./components/user/Button";
import { Card, CardTop, CardBottom } from "./components/user/Card";
import { Text } from "./components/user/Text";

export default function App() {
  return (
    <div className="mx-auto w-[800px]">
      <h1 className="text-xl font-semibold text-center">
        A super simple page editor
      </h1>
      <Editor
        resolver={{ Card, UserButton, Text, Container, CardTop, CardBottom }}
      >
        <Topbar />
        <div className="flex gap-3">
          <div className="flex-1">
            <Frame>
              <Element is={Container} padding={5} background="#eee" canvas>
                <Card background="#fff" padding={5} />
                <UserButton
                  size="sm"
                  variant="outline"
                  color="default"
                  text="Click"
                />
                <Text text="Hi world!" fontSize={14} tag="p" color="black" bgcolor="none" />
              </Element>
            </Frame>
          </div>
          <div className="w-1/4">
            <div className="bg-card rounded-lg shadow-sm">
              <Toolbox />
              <SettingsPanel />
            </div>
          </div>
        </div>
      </Editor>
    </div>
  );
}
