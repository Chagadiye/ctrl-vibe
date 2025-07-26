import { create } from "zustand";

interface XPStore {
  xp: number;
  hasHydrated: boolean;
  addXP: (amount: number) => void;
  loadXP: () => void;
}

export const useXPStore = create<XPStore>((set) => ({
  xp: 0, // Always start with 0
  hasHydrated: false,
  addXP: (amount) =>
    set((state) => {
      const newXP = state.xp + amount;
      if (typeof window !== "undefined") {
        localStorage.setItem("xp", newXP.toString());
      }
      return { xp: newXP };
    }),
  loadXP: () => {
    if (typeof window !== "undefined") {
      const storedXP = Number(localStorage.getItem("xp")) || 0;
      set({ xp: storedXP, hasHydrated: true });
    }
  },
}));
