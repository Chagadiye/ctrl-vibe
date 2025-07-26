import { create } from "zustand";

interface XPStore {
  xp: number;
  addXP: (amount: number) => void;
}

export const useXPStore = create<XPStore>((set) => ({
  xp: (typeof window !== "undefined" && Number(localStorage.getItem("xp"))) || 0,
  addXP: (amount) =>
    set((state) => {
      const newXP = state.xp + amount;
      localStorage.setItem("xp", newXP.toString());
      return { xp: newXP };
    }),
}));
