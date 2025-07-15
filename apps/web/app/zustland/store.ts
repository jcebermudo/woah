import { create } from "zustand";

type Store = {
  mode: "design" | "animate";
  setMode: (mode: "design" | "animate") => void;
};

export const useStore = create<Store>((set) => ({
  mode: "design",
  setMode: (mode: "design" | "animate") => set({ mode }),
}));