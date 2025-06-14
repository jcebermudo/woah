// pages/index.js

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
    <div style={{ margin: "0 auto", width: "800px" }}>
      <h1>A super simple page editor</h1>
      <Topbar />
      <Container padding={5} background="#eee">
        <Card background="#fff" padding={5} />
      </Container>
      <div style={{ paddingTop: "10px" }}>
        <div>
          <Container padding={5} background="#eee">
            <Card background="#fff" padding={5}  />
          </Container>
        </div>
        <div>
          <Toolbox />
          <SettingsPanel />
        </div>
      </div>
    </div>
  );
}
