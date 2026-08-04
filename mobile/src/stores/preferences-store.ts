import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface PreferencesState {
  weeklyReviewEnabled: boolean;
  overspendAlertsEnabled: boolean;
  biometricLockEnabled: boolean;
  setWeeklyReviewEnabled: (v: boolean) => void;
  setOverspendAlertsEnabled: (v: boolean) => void;
  setBiometricLockEnabled: (v: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      weeklyReviewEnabled: true,
      overspendAlertsEnabled: true,
      biometricLockEnabled: false,
      setWeeklyReviewEnabled: (weeklyReviewEnabled) =>
        set({ weeklyReviewEnabled }),
      setOverspendAlertsEnabled: (overspendAlertsEnabled) =>
        set({ overspendAlertsEnabled }),
      setBiometricLockEnabled: (biometricLockEnabled) =>
        set({ biometricLockEnabled }),
    }),
    {
      name: "centsy-preferences",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
