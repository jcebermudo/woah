import { create } from "zustand";

type Store = {
  mode: "design" | "animate";
  setMode: (mode: "design" | "animate") => void;
  duration: number;
  setDuration: (duration: number) => void;
};

export const useStore = create<Store>((set) => ({
  mode: "design",
  setMode: (mode: "design" | "animate") => set({ mode }),
  duration: 100,
  setDuration: (duration: number) => set({ duration }),
}));