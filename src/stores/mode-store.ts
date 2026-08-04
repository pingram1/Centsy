"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FinanceMode } from "@/lib/types";

interface ModeState {
  mode: FinanceMode;
  setMode: (mode: FinanceMode) => void;
  toggleMode: () => void;
}

export const useModeStore = create<ModeState>()(
  persist(
    (set, get) => ({
      mode: "personal",
      setMode: (mode) => set({ mode }),
      toggleMode: () =>
        set({ mode: get().mode === "personal" ? "business" : "personal" }),
    }),
    { name: "centsy-finance-mode" }
  )
);
