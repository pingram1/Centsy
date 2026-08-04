import { Pressable, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useThemeStore } from "@/stores/theme-store";

export default function AppearanceScreen() {
  const colors = useThemeStore((s) => s.colors);
  const appearance = useThemeStore((s) => s.appearance);
  const setAppearance = useThemeStore((s) => s.setAppearance);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Appearance" }} />
      {(["light", "dark"] as const).map((option) => {
        const active = appearance === option;
        return (
          <Pressable
            key={option}
            onPress={() => setAppearance(option)}
            style={[
              styles.option,
              {
                backgroundColor: colors.card,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.label, { color: colors.foreground }]}>
              {option === "light" ? "Light" : "Dark"}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              {active ? "Selected" : "Tap to apply"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 10 },
  option: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    gap: 4,
  },
  label: { fontSize: 17, fontWeight: "700" },
});
