import React from "react";

import { Toolbox } from "./components/Toolbox";
import { SettingsPanel } from "./components/SettingsPanel";
import { Topbar } from "./components/Topbar";

import { Container } from "./components/user/Container";
import { Button } from "./components/user/Button";
import { Card } from "./components/user/Card";
import { Text } from "./components/user/Text";

export default function App() {
  return (
    <div className="mx-auto w-[800px]">
      <h1 className="text-xl font-semibold text-center">
        A super simple page editor
      </h1>
      <div className="flex gap-3 pt-3">
        <Topbar />
        <div className="flex-1">
          <Container padding={5} background="#eee">
            <Card background="#fff" padding={5} />
          </Container>
        </div>
        <div className="w-1/4">
          <div className="bg-card rounded-lg shadow-sm">
            <Toolbox />
            <SettingsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
