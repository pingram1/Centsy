import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useModeStore } from "@/stores/mode-store";
import { useThemeStore } from "@/stores/theme-store";
import type { FinanceMode } from "@centsy/shared";

export function ModeToggle({
  style,
  onChange,
}: {
  style?: StyleProp<ViewStyle>;
  onChange?: (mode: FinanceMode) => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const mode = useModeStore((s) => s.mode);
  const setMode = useModeStore((s) => s.setMode);

  function select(next: FinanceMode) {
    setMode(next);
    onChange?.(next);
  }

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
      accessibilityRole="tablist"
    >
      <ModeChip
        label="Personal"
        active={mode === "personal"}
        mode="personal"
        onPress={() => select("personal")}
      />
      <ModeChip
        label="Business"
        active={mode === "business"}
        mode="business"
        onPress={() => select("business")}
      />
    </View>
  );
}

function ModeChip({
  label,
  active,
  mode,
  onPress,
}: {
  label: string;
  active: boolean;
  mode: FinanceMode;
  onPress: () => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={[
        styles.chip,
        active && {
          backgroundColor:
            mode === "business" ? colors.foreground : colors.primary,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? "#fff" : colors.muted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    padding: 3,
    gap: 2,
    flexShrink: 0,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
