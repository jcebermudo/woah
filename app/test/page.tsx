"use client";

import { useState, useEffect } from "react";
import { Editor, Frame, } from "@craftjs/core";
import { Container } from "@/app/components/user/Container";
import { Text } from "@/app/components/user/Text";
import { ViewportContext } from "@/app/components/context/ViewportContext";

export default function PublishedSite() {
  const json = {
    ROOT: {
      type: { resolvedName: "Container" },
      isCanvas: true,
      props: {
        responsiveStyles: {
          desktop: { width: 1200, height: 800, bgcolor: "#ffffff" },
          tablet: { width: 768, height: 1024, bgcolor: "#ffffff" },
          mobile: { width: 375, height: 667, bgcolor: "#ffffff" },
        },
      },
      displayName: "Container",
      custom: {},
      hidden: false,
      nodes: ["tp1g-7-EbZ"],
      linkedNodes: {},
    },
    "tp1g-7-EbZ": {
      type: { resolvedName: "Text" },
      isCanvas: false,
      props: {
        text: "Hi world",
        responsiveStyles: {
          desktop: { fontSize: 190, color: "#000000", bgcolor: "none" },
          tablet: { fontSize: 18, color: "#000000", bgcolor: "none" },
          mobile: { fontSize: 16, color: "#000000", bgcolor: "none" },
        },
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
      <Editor enabled={false} resolver={{ Container, Text }}>
        <Frame data={JSON.stringify(json)} />
      </Editor>
    </ViewportContext.Provider>
  );
}
