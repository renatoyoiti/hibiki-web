import { create } from "zustand";

interface SoundState {
  activeSounds: Record<string, { isPlaying: boolean; volume: number }>;
  togglePlay: (file: string) => void;
  setVolume: (file: string, volume: number) => void;
  playAll: () => void;
  pauseAll: () => void;
  loadState: (files: string[]) => void;
}

export const useSoundStore = create<SoundState>((set, get) => ({
  activeSounds: {},

  togglePlay: (file) =>
    set((state) => {
      const prev = state.activeSounds[file] || { isPlaying: false, volume: 0.5 };
      const updated = { ...state.activeSounds, [file]: { ...prev, isPlaying: !prev.isPlaying } };
      localStorage.setItem("soundState", JSON.stringify(updated));
      return { activeSounds: updated };
    }),

  setVolume: (file, volume) =>
    set((state) => {
      const prev = state.activeSounds[file] || { isPlaying: false, volume: 0.5 };
      const updated = { ...state.activeSounds, [file]: { ...prev, volume } };
      localStorage.setItem("soundState", JSON.stringify(updated));
      return { activeSounds: updated };
    }),

  playAll: () =>
    set((state) => {
      const updated: Record<string, { isPlaying: boolean; volume: number }> = {};
      for (const key in state.activeSounds) {
        updated[key] = { ...state.activeSounds[key], isPlaying: true };
      }
      localStorage.setItem("soundState", JSON.stringify(updated));
      return { activeSounds: updated };
    }),

  pauseAll: () =>
    set((state) => {
      const updated: Record<string, { isPlaying: boolean; volume: number }> = {};
      for (const key in state.activeSounds) {
        updated[key] = { ...state.activeSounds[key], isPlaying: false };
      }
      localStorage.setItem("soundState", JSON.stringify(updated));
      return { activeSounds: updated };
    }),

  loadState: (files) =>
    set(() => {
      const saved = localStorage.getItem("soundState");
      if (saved) return { activeSounds: JSON.parse(saved) };

      const initial: Record<string, { isPlaying: boolean; volume: number }> = {};
      files.forEach((f) => (initial[f] = { isPlaying: false, volume: 0.5 }));
      return { activeSounds: initial };
    }),
}));
