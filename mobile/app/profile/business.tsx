import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack } from "expo-router";
import { api } from "@/lib/api";
import { useThemeStore } from "@/stores/theme-store";

function formatCents(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default function BusinessScreen() {
  const colors = useThemeStore((s) => s.colors);
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessEin, setBusinessEin] = useState("");
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [kpis, setKpis] = useState<{
    availableCents: number;
    pendingCents: number;
    recentGrossCents: number;
    recentChargeCount: number;
    currency: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const load = useCallback(async () => {
    const me = await api<{
      user: {
        businessName: string | null;
        businessEmail: string | null;
        businessEin: string | null;
        stripeAccountId: string | null;
      };
    }>("/api/auth/me");
    setBusinessName(me.user.businessName ?? "");
    setBusinessEmail(me.user.businessEmail ?? "");
    setBusinessEin(me.user.businessEin ?? "");
    setStripeAccountId(me.user.stripeAccountId);

    if (me.user.stripeAccountId) {
      const kpi = await api<{
        connected: boolean;
        kpis: typeof kpis;
      }>("/api/stripe/connect").catch(() => null);
      if (kpi?.connected) setKpis(kpi.kpis);
    }
  }, []);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function save() {
    setSaving(true);
    try {
      await api("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          businessName: businessName.trim() || null,
          businessEmail: businessEmail.trim() || null,
          businessEin: businessEin.trim() || null,
        }),
      });
      Alert.alert("Saved", "Business profile updated.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function connectStripe() {
    setConnecting(true);
    try {
      const res = await api<{ url: string; accountId: string }>(
        "/api/stripe/connect",
        {
          method: "POST",
          body: JSON.stringify({ workspace: "business" }),
        }
      );
      setStripeAccountId(res.accountId);
      if (res.url) {
        await Linking.openURL(res.url);
      }
    } catch (e) {
      Alert.alert("Stripe", e instanceof Error ? e.message : "Connect failed");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Stack.Screen options={{ title: "Business details" }} />
      <Text style={[styles.copy, { color: colors.muted }]}>
        Business is its own realm—ledger, banks, EIN, and exports stay separate
        from Personal. Stripe Connect is only available here.
      </Text>
      <Text style={[styles.label, { color: colors.muted }]}>Business name</Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: colors.border,
            backgroundColor: colors.card,
            color: colors.foreground,
          },
        ]}
        placeholder="DBA or legal trade name"
        placeholderTextColor={colors.muted}
        value={businessName}
        onChangeText={setBusinessName}
      />
      <Text style={[styles.label, { color: colors.muted }]}>Business email</Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: colors.border,
            backgroundColor: colors.card,
            color: colors.foreground,
          },
        ]}
        placeholder="billing@yourbusiness.com"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={businessEmail}
        onChangeText={setBusinessEmail}
      />
      <Text style={[styles.label, { color: colors.muted }]}>EIN</Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: colors.border,
            backgroundColor: colors.card,
            color: colors.foreground,
          },
        ]}
        placeholder="XX-XXXXXXX"
        placeholderTextColor={colors.muted}
        keyboardType="numbers-and-punctuation"
        autoCapitalize="none"
        value={businessEin}
        onChangeText={setBusinessEin}
      />
      <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 15 }}>
        Included on Business CSV exports for tax / bookkeeping handoff.
      </Text>
      <Pressable
        style={[styles.btn, { backgroundColor: colors.primary }]}
        onPress={() => void save()}
        disabled={saving}
      >
        <Text style={styles.btnText}>{saving ? "Saving…" : "Save"}</Text>
      </Pressable>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Stripe Connect
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>
          Link Stripe to surface business KPIs (gross volume, available,
          pending)—never store card numbers in-app.
        </Text>
        <View style={styles.row}>
          <Text style={{ color: colors.foreground, fontWeight: "600" }}>
            {stripeAccountId ? "Connected" : "Not connected"}
          </Text>
          <Switch value={Boolean(stripeAccountId)} disabled />
        </View>
        {kpis ? (
          <View style={{ gap: 4 }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Available {formatCents(kpis.availableCents, kpis.currency)} ·
              Pending {formatCents(kpis.pendingCents, kpis.currency)}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Recent gross {formatCents(kpis.recentGrossCents, kpis.currency)} (
              {kpis.recentChargeCount} charges)
            </Text>
          </View>
        ) : null}
        <Pressable
          style={[styles.btnOutline, { borderColor: colors.border }]}
          onPress={() => void connectStripe()}
          disabled={connecting}
        >
          <Text style={{ color: colors.primary, fontWeight: "700" }}>
            {connecting
              ? "Opening…"
              : stripeAccountId
                ? "Manage Stripe"
                : "Connect Stripe"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 10 },
  copy: { fontSize: 13, lineHeight: 19, marginBottom: 4 },
  label: { fontSize: 12, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10, marginTop: 8 },
  title: { fontSize: 16, fontWeight: "700" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  btnOutline: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
});
