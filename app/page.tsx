"use client";

import React from "react";

import { Toolbox } from "./components/Toolbox";
import { SettingsPanel } from "./components/SettingsPanel";
import { Topbar } from "./components/Topbar";

import { Container } from "./components/user/Container";
import { Button } from "./components/user/Button";
import { Card } from "./components/user/Card";
import { Text } from "./components/user/Text";

import { Editor, Frame, Element } from "@craftjs/core";

export default function App() {
  return (
    <div className="mx-auto w-[800px]">
      <h1 className="text-xl font-semibold text-center">
        A super simple page editor
      </h1>
      <Editor resolver={{ Card, Button, Text, Container }}>
        <div className="flex gap-3">
          <div className="flex-1">
            <Frame>
              <Element is={Container} padding={5} background="#eee" canvas>
                <Container padding={5} background="#eee">
                  <Element is={Container} padding={5} background="#eee" canvas>
                    <Card background="#fff" padding={5} />
                  </Element>
                  <Element is={Container} padding={5} background="#eee" canvas>
                    <Button size="sm" variant="outline" color="default">
                      Click
                    </Button>
                  </Element>
                  <Element is={Container} padding={5} background="#eee" canvas>
                    <Text text="Hi world!" fontSize="14px" />
                  </Element>
                  <Element is={Container} padding={6} background="#999" canvas>
                    <Text text="It's me again!" fontSize="14px" />
                  </Element>
                </Container>
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
