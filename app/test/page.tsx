"use client";

import { useState, useEffect } from "react";
import { Editor, Frame } from "@craftjs/core";
import { Container } from "@/app/components/user/Container";
import { Text } from "@/app/components/user/Text";
import { Body } from "@/app/components/user/Body";
import { ViewportContext } from "@/app/components/context/ViewportContext";
import { Card, CardBottom, CardTop } from "@/app/components/user/Card";
import { Button as UserButton } from "@/app/components/user/Button";

export default function PublishedSite() {
  const json = {
    ROOT: {
      type: { resolvedName: "Body" },
      isCanvas: true,
      props: {
        responsiveStyles: {
          desktop: {
            maxWidth: 1200,
            minHeight: 800,
            bgcolor: "#ffffff",
            padding: 90,
          },
          tablet: { maxWidth: 1200, minHeight: 800, bgcolor: "#ffffff" },
          mobile: { maxWidth: 1200, minHeight: 800, bgcolor: "#ffffff" },
        },
      },
      displayName: "Body",
      custom: {},
      hidden: false,
      nodes: ["fpUO3PdkT0"],
      linkedNodes: {},
    },
    fpUO3PdkT0: {
      type: { resolvedName: "Text" },
      isCanvas: false,
      props: {
        fontSize: "15",
        textAlign: "left",
        fontWeight: "500",
        color: { r: "92", g: "90", b: "90", a: "1" },
        margin: ["0", "0", "0", "0"],
        shadow: 0,
        text: "Hi world",
      },
      displayName: "Text",
      custom: {},
      parent: "ROOT",
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
  };

  // Responsive viewport detection
  const [currentViewport, setCurrentViewport] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");

  useEffect(() => {
    function updateViewport() {
      const width = window.innerWidth;
      if (width < 600) setCurrentViewport("mobile");
      else if (width < 1024) setCurrentViewport("tablet");
      else setCurrentViewport("desktop");
    }
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  return (
    <ViewportContext.Provider value={{ currentViewport, setCurrentViewport }}>
      <Editor
        resolver={{
          Container,
          Text,
          Body,
          Card,
          CardTop,
          CardBottom,
          UserButton,
        }}
        enabled={false}
      >
        <Frame data={JSON.stringify(json)} />
      </Editor>
    </ViewportContext.Provider>
  );
}
