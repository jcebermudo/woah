import { createContext, useContext } from "react";

type ViewportType = "desktop" | "tablet" | "mobile";

export const ViewportContext = createContext<{
  currentViewport: ViewportType;
  setCurrentViewport: (v: ViewportType) => void;
}>({
  currentViewport: "desktop",
  setCurrentViewport: () => {},
});

export const useViewport = () => useContext(ViewportContext);
