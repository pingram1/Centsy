export const lightColors = {
  background: "#f4fbfa",
  foreground: "#14212b",
  card: "#ffffff",
  primary: "#0f766e",
  primaryMuted: "#ccfbf1",
  secondary: "#e6f7f4",
  muted: "#5b6b76",
  border: "#d7e5e2",
  success: "#15803d",
  warning: "#b45309",
  danger: "#b91c1c",
  insight: "#1d4ed8",
} as const;

export const darkColors = {
  background: "#0f1f24",
  foreground: "#e8f4f1",
  card: "#152a30",
  primary: "#2dd4bf",
  primaryMuted: "#134e4a",
  secondary: "#1a3339",
  muted: "#8aa4ad",
  border: "#243f47",
  success: "#4ade80",
  warning: "#fbbf24",
  danger: "#f87171",
  insight: "#60a5fa",
} as const;

export type ThemeColors = {
  background: string;
  foreground: string;
  card: string;
  primary: string;
  primaryMuted: string;
  secondary: string;
  muted: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  insight: string;
};

/** @deprecated Prefer useThemeStore().colors — kept for gradual migration */
export const colors: ThemeColors = lightColors;
