"use client";

import { useState, useEffect } from "react";
import { Editor, Frame } from "@craftjs/core";
import { Container } from "@/app/components/user/Container";
import { Text } from "@/app/components/user/Text";
import { Page } from "@/app/components/user/Page";
import { ViewportContext } from "@/app/components/context/ViewportContext";

export default function PublishedSite() {
  const json = {
    ROOT: {
      type: { resolvedName: "Page" },
      isCanvas: true,
      props: {
        responsiveStyles: {
          desktop: { width: 1200, minHeight: 800, bgcolor: "#ff0000" },
          tablet: { width: 768, minHeight: 800, bgcolor: "#ffffff" },
          mobile: { width: 375, minHeight: 800, bgcolor: "#ffffff" },
        },
      },
      displayName: "Page",
      custom: {},
      hidden: false,
      nodes: ["Qqw7eFIah4"],
      linkedNodes: {},
    },
    Qqw7eFIah4: {
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
        resolver={{ Container, Text, Page }}
        enabled={false}
      >
        <Frame data={JSON.stringify(json)} />
      </Editor>
    </ViewportContext.Provider>
  );
}
