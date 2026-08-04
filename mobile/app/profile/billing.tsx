import { useCallback, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { api } from "@/lib/api";
import { useThemeStore } from "@/stores/theme-store";

export default function BillingScreen() {
  const colors = useThemeStore((s) => s.colors);
  const [plan, setPlan] = useState("FREE");
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api<{ user: { plan: string } }>("/api/auth/me")
        .then((d) => setPlan(d.user.plan || "FREE"))
        .catch(() => undefined);
    }, [])
  );

  const isPro = plan === "PRO";

  async function upgrade() {
    setBusy(true);
    try {
      const res = await api<{ url: string | null }>("/api/stripe/checkout", {
        method: "POST",
      });
      if (!res.url) throw new Error("No checkout URL returned");
      await Linking.openURL(res.url);
    } catch (e) {
      Alert.alert("Billing", e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  async function manage() {
    setBusy(true);
    try {
      const res = await api<{ url: string }>("/api/stripe/portal", {
        method: "POST",
      });
      await Linking.openURL(res.url);
    } catch (e) {
      Alert.alert("Billing", e instanceof Error ? e.message : "Portal failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Stack.Screen options={{ title: "Plan & billing" }} />
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: isPro ? colors.border : colors.primary,
          },
        ]}
      >
        <Text style={[styles.plan, { color: colors.foreground }]}>Free</Text>
        <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>
          Live Personal + Business ledgers, Snap, mileage, and Centsy AI.
        </Text>
        {!isPro ? (
          <Text style={{ color: colors.primary, fontWeight: "700", marginTop: 4 }}>
            Current plan
          </Text>
        ) : null}
      </View>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: isPro ? colors.primary : colors.border,
          },
        ]}
      >
        <Text style={[styles.plan, { color: colors.foreground }]}>Pro</Text>
        <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>
          Priority AI, accountant seats, advanced exports, Stripe business KPIs,
          and higher receipt retention.
        </Text>
        {isPro ? (
          <>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>
              Current plan
            </Text>
            <Pressable
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={() => void manage()}
              disabled={busy}
            >
              <Text style={styles.btnText}>
                {busy ? "Opening…" : "Manage billing"}
              </Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => void upgrade()}
            disabled={busy}
          >
            <Text style={styles.btnText}>
              {busy ? "Opening…" : "Upgrade with Stripe"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 12 },
  card: { borderRadius: 16, borderWidth: 2, padding: 16, gap: 8 },
  plan: { fontSize: 20, fontWeight: "800" },
  btn: {
    marginTop: 6,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
