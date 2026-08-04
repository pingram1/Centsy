import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FinanceMode } from "@centsy/shared";

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
    {
      name: "centsy-finance-mode",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
