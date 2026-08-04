import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import Constants from "expo-constants";
import { useThemeStore } from "@/stores/theme-store";

export default function SupportScreen() {
  const colors = useThemeStore((s) => s.colors);
  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "0.1.0";

  return (
    <View style={styles.wrap}>
      <Stack.Screen options={{ title: "Help & version" }} />
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Centsy</Text>
        <Text style={{ color: colors.muted }}>Version {version}</Text>
      </View>
      <Pressable
        style={[styles.btn, { backgroundColor: colors.primary }]}
        onPress={() => Linking.openURL("mailto:support@centsy.app")}
      >
        <Text style={styles.btnText}>Email support</Text>
      </Pressable>
      <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center" }}>
        We never show API hosts, keys, or raw tokens in the customer app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 4 },
  title: { fontSize: 18, fontWeight: "800" },
  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
