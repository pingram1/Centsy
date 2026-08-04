import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Stack } from "expo-router";
import { api } from "@/lib/api";
import { useThemeStore } from "@/stores/theme-store";

export default function BackupScreen() {
  const colors = useThemeStore((s) => s.colors);
  const [cloud, setCloud] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ user: { receiptCloudBackup: boolean } }>("/api/auth/me")
      .then((d) => setCloud(d.user.receiptCloudBackup))
      .catch(() => undefined);
  }, []);

  async function persist(next: boolean) {
    setCloud(next);
    setSaving(true);
    try {
      await api("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ receiptCloudBackup: next }),
      });
    } catch (e) {
      setCloud(!next);
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Stack.Screen options={{ title: "Receipt backup" }} />
      <View style={styles.row}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Cloud backup
        </Text>
        <Switch
          value={cloud}
          disabled={saving}
          onValueChange={(v) => void persist(v)}
          trackColor={{ true: colors.primary }}
        />
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.heading, { color: colors.success }]}>
          Pros of cloud backup
        </Text>
        {[
          "Survives phone loss or resets",
          "IRS accepts accurate digital records (Pub. 583)",
          "Easier accountant / CPA handoff",
          "Cross-device access with your Centsy login",
        ].map((item) => (
          <Text key={item} style={{ color: colors.muted, fontSize: 13 }}>
            • {item}
          </Text>
        ))}
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.heading, { color: colors.warning }]}>
          Tradeoffs
        </Text>
        {[
          "Receipt images leave the device (encrypted in transit)",
          "Requires an account & network to restore",
          "You should still export annually for your own archive",
        ].map((item) => (
          <Text key={item} style={{ color: colors.muted, fontSize: 13 }}>
            • {item}
          </Text>
        ))}
      </View>

      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>
        Recommendation: keep cloud backup on for Business, and export CSV at
        least yearly. Retain supporting records generally 3+ years after filing
        (longer for employment taxes, assets, or special cases).
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontWeight: "700" },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 6 },
  heading: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
});
