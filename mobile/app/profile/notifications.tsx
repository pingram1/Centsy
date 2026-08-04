import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  Platform,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Stack } from "expo-router";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { api } from "@/lib/api";
import { usePreferencesStore } from "@/stores/preferences-store";
import { useThemeStore } from "@/stores/theme-store";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  return token.data;
}

export default function NotificationsScreen() {
  const colors = useThemeStore((s) => s.colors);
  const weekly = usePreferencesStore((s) => s.weeklyReviewEnabled);
  const overspend = usePreferencesStore((s) => s.overspendAlertsEnabled);
  const setWeekly = usePreferencesStore((s) => s.setWeeklyReviewEnabled);
  const setOverspend = usePreferencesStore((s) => s.setOverspendAlertsEnabled);
  const [registering, setRegistering] = useState(false);

  const enableWeekly = useCallback(async (value: boolean) => {
    setWeekly(value);
    if (!value) return;
    setRegistering(true);
    try {
      const token = await registerForPush();
      if (!token) {
        Alert.alert(
          "Push unavailable",
          "Enable notifications in system settings, or use a physical device."
        );
        return;
      }
      await api("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ expoPushToken: token }),
      });
    } catch (e) {
      Alert.alert(
        "Push",
        e instanceof Error ? e.message : "Could not register push token"
      );
    } finally {
      setRegistering(false);
    }
  }, [setWeekly]);

  async function sendTest() {
    try {
      await api("/api/push/weekly-review", {
        method: "POST",
        body: JSON.stringify({ selfOnly: true }),
      });
      Alert.alert("Sent", "Weekly review push queued for this device.");
    } catch (e) {
      Alert.alert("Push", e instanceof Error ? e.message : "Send failed");
    }
  }

  return (
    <View style={styles.wrap}>
      <Stack.Screen options={{ title: "Notifications" }} />
      <Text style={[styles.copy, { color: colors.muted }]}>
        Weekly review nudges use Expo push. Turning this on registers your
        device token with Centsy.
        {registering ? " Registering…" : ""}
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Weekly review
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Sunday nudge to close the week
            </Text>
          </View>
          <Switch
            value={weekly}
            onValueChange={(v) => void enableWeekly(v)}
            trackColor={{ true: colors.primary }}
          />
        </View>
        <View style={[styles.row, styles.border, { borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Overspend alerts
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Category spikes vs your recent baseline
            </Text>
          </View>
          <Switch
            value={overspend}
            onValueChange={setOverspend}
            trackColor={{ true: colors.primary }}
          />
        </View>
      </View>
      <Pressable
        style={[styles.btn, { borderColor: colors.border }]}
        onPress={() => void sendTest()}
      >
        <Text style={{ color: colors.primary, fontWeight: "700" }}>
          Send test weekly review
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 12 },
  copy: { fontSize: 13, lineHeight: 19 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  border: { borderTopWidth: StyleSheet.hairlineWidth },
  label: { fontSize: 15, fontWeight: "600" },
  btn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
});
