import { Stack } from "expo-router";
import { useThemeStore } from "@/stores/theme-store";

export default function ProfileLayout() {
  const colors = useThemeStore((s) => s.colors);
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.foreground, fontWeight: "600" },
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
