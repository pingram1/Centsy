import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/stores/theme-store";

const STEPS = [
  {
    id: "snap",
    label: "Capture stray receipts",
    href: "/snap",
  },
  {
    id: "activity",
    label: "Review & categorize activity",
    href: "/(tabs)/activity",
  },
  {
    id: "insights",
    label: "Read Centsy Insights / Ask AI",
    href: "/ai",
  },
  {
    id: "export",
    label: "Export CSV for your archive",
    href: "/profile/export",
  },
] as const;

export default function CloseMonthScreen() {
  const colors = useThemeStore((s) => s.colors);
  const [done, setDone] = useState<Record<string, boolean>>({});

  return (
    <View style={styles.wrap}>
      <Stack.Screen options={{ title: "Close the month" }} />
      <Text style={[styles.copy, { color: colors.muted }]}>
        A short ritual to keep Personal and Business ledgers audit-ready.
      </Text>
      {STEPS.map((step) => {
        const checked = Boolean(done[step.id]);
        return (
          <Pressable
            key={step.id}
            style={[
              styles.row,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => {
              setDone((prev) => ({ ...prev, [step.id]: !prev[step.id] }));
              router.push(step.href as never);
            }}
          >
            <Ionicons
              name={checked ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color={checked ? colors.success : colors.muted}
            />
            <Text style={[styles.label, { color: colors.foreground }]}>
              {step.label}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 10 },
  copy: { fontSize: 13, lineHeight: 19, marginBottom: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  label: { flex: 1, fontSize: 15, fontWeight: "600" },
});
