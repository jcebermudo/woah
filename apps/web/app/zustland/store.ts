import { create } from "zustand";
import Konva from "konva";

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

interface PlaybackState {
  timelinePlayhead: number;
  isTimelinePlaying: boolean;
  timelineDuration: number;

  setTimelinePlayhead: (position: number) => void;
  setIsTimelinePlaying: (playing: boolean) => void;
  setTimelineDuration: (duration: number) => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  timelinePlayhead: 0,
  isTimelinePlaying: false,
  timelineDuration: 100,

  setTimelinePlayhead: (position: number) =>
    set({ timelinePlayhead: position }),
  setIsTimelinePlaying: (playing: boolean) =>
    set({ isTimelinePlaying: playing }),
  setTimelineDuration: (duration: number) =>
    set({ timelineDuration: duration }),
}));