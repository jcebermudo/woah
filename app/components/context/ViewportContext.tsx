import { createContext, useContext } from "react";

type ViewportType = "desktop" | "tablet" | "mobile";

export const ViewportContext = createContext<{
  currentViewport: ViewportType;
  setCurrentViewport: (v: ViewportType) => void;
  scale?: number;
}>({
  currentViewport: "desktop",
  setCurrentViewport: () => {},
  scale: 1,
});

export const useViewport = () => useContext(ViewportContext);
