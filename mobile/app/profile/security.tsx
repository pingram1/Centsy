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
import * as LocalAuthentication from "expo-local-authentication";
import { api } from "@/lib/api";
import { usePreferencesStore } from "@/stores/preferences-store";
import { useThemeStore } from "@/stores/theme-store";

export default function SecurityScreen() {
  const colors = useThemeStore((s) => s.colors);
  const biometric = usePreferencesStore((s) => s.biometricLockEnabled);
  const setBiometric = usePreferencesStore((s) => s.setBiometricLockEnabled);
  const [sessions, setSessions] = useState<
    { id: string; createdAt: string; updatedAt: string; expiresAt: string }[]
  >([]);
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(null);

  useEffect(() => {
    api<{
      sessions: typeof sessions;
      lastLoginAt: string | null;
    }>("/api/auth/sessions")
      .then((d) => {
        setSessions(d.sessions);
        setLastLoginAt(d.lastLoginAt);
      })
      .catch(() => undefined);
  }, []);

  async function toggleBiometric(next: boolean) {
    if (!next) {
      setBiometric(false);
      return;
    }
    const hw = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hw || !enrolled) {
      Alert.alert(
        "Biometrics unavailable",
        "Set up Face ID / Touch ID in iOS Settings first."
      );
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Enable Centsy app lock",
    });
    if (result.success) setBiometric(true);
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Stack.Screen options={{ title: "Security" }} />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>App lock</Text>
        <View style={styles.row}>
          <Text style={{ color: colors.foreground, flex: 1, fontWeight: "600" }}>
            Biometric unlock
          </Text>
          <Switch
            value={biometric}
            onValueChange={(v) => void toggleBiometric(v)}
            trackColor={{ true: colors.primary }}
          />
        </View>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
          Require Face ID / Touch ID when opening Centsy on this device.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Sign-in activity</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 10 }}>
          Last sign-in:{" "}
          {lastLoginAt ? new Date(lastLoginAt).toLocaleString() : "—"}
        </Text>
        {sessions.map((s) => (
          <View key={s.id} style={[styles.session, { borderColor: colors.border }]}>
            <Text style={{ color: colors.foreground, fontWeight: "600" }}>
              Active session
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Started {new Date(s.createdAt).toLocaleString()}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Expires {new Date(s.expiresAt).toLocaleDateString()}
            </Text>
          </View>
        ))}
        {sessions.length === 0 ? (
          <Text style={{ color: colors.muted }}>No active sessions found.</Text>
        ) : null}
      </View>

      <Pressable
        onPress={() =>
          Alert.alert(
            "Coming soon",
            "Remote sign-out of other devices will land with multi-device session management."
          )
        }
      >
        <Text style={{ color: colors.primary, fontWeight: "600", textAlign: "center" }}>
          Sign out other devices
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  session: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    gap: 2,
  },
});
