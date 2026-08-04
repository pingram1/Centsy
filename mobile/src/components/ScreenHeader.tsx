import { type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandLogo } from "@/components/BrandLogo";
import { ModeToggle } from "@/components/ModeToggle";
import { useThemeStore } from "@/stores/theme-store";

/**
 * Top chrome that clears the iOS status bar / Dynamic Island
 * and keeps the mode toggle in the visible frame.
 */
export function ScreenHeader({
  title,
  subtitle,
  showLogo = false,
  showModeToggle = true,
  trailing,
}: {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  showModeToggle?: boolean;
  trailing?: ReactNode;
}) {
  const colors = useThemeStore((s) => s.colors);
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 44) + 8;
  const right = trailing ?? (showModeToggle ? <ModeToggle /> : null);

  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: topPad, backgroundColor: colors.background },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          {showLogo ? (
            <BrandLogo size="md" />
          ) : (
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
              {title}
            </Text>
          )}
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    minHeight: 44,
  },
  left: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  right: {
    flexShrink: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
  },
});
