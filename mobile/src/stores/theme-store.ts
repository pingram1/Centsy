import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { darkColors, lightColors, type ThemeColors } from "@/theme";

type Appearance = "light" | "dark";

interface ThemeState {
  appearance: Appearance;
  colors: ThemeColors;
  setAppearance: (appearance: Appearance) => void;
  toggleAppearance: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      appearance: "light",
      colors: lightColors,
      setAppearance: (appearance) =>
        set({
          appearance,
          colors: appearance === "dark" ? darkColors : lightColors,
        }),
      toggleAppearance: () => {
        const next = get().appearance === "dark" ? "light" : "dark";
        get().setAppearance(next);
      },
    }),
    {
      name: "centsy-appearance",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ appearance: s.appearance }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.colors =
          state.appearance === "dark" ? darkColors : lightColors;
      },
    }
  )
);
