import { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ExpoLinking from "expo-linking";
import { Stack, useFocusEffect } from "expo-router";
import { modeLabel } from "@centsy/shared";
import { API_BASE_URL, api } from "@/lib/api";
import { useModeStore } from "@/stores/mode-store";
import { useThemeStore } from "@/stores/theme-store";

type Bank = {
  id: string;
  institutionName: string;
  accountName: string;
  mask: string;
  type: string;
  balance: string;
};

export default function BanksScreen() {
  const colors = useThemeStore((s) => s.colors);
  const mode = useModeStore((s) => s.mode);
  const [accounts, setAccounts] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ accounts: Bank[] }>(
        `/api/plaid/exchange?mode=${mode}`
      );
      setAccounts(data.accounts);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function connectLink() {
    setConnecting(true);
    try {
      const link = await api<{ link_token: string; env: string }>(
        "/api/plaid/link",
        { method: "POST" }
      );
      // Encode workspace on return URL so exchange stays in this realm.
      const returnUrl = ExpoLinking.createURL("plaid", {
        queryParams: { mode },
      });
      const url = `${API_BASE_URL}/plaid/link?link_token=${encodeURIComponent(
        link.link_token
      )}&return_url=${encodeURIComponent(returnUrl)}&env=${encodeURIComponent(
        link.env || "sandbox"
      )}`;
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert("Plaid", e instanceof Error ? e.message : "Link failed");
    } finally {
      setConnecting(false);
    }
  }

  async function remove(id: string) {
    if (removingId) return;
    setRemovingId(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    try {
      await api(`/api/plaid/accounts/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      await load();
      Alert.alert("Error", e instanceof Error ? e.message : "Remove failed");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.wrap}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => void load()} />
      }
    >
      <Stack.Screen options={{ title: `${modeLabel(mode)} banks` }} />
      <Text style={[styles.copy, { color: colors.muted }]}>
        Banks in this list belong only to your {modeLabel(mode)} workspace.
        Personal checking never appears in Business—connect a business account
        here when you need one.
      </Text>

      {accounts.length === 0 ? (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>
            No {modeLabel(mode).toLowerCase()} banks
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>
            {mode === "business"
              ? "Link a business checking or operating account. Your personal banks stay in Personal."
              : "Link personal checking/savings. Business operating accounts belong in Business."}
          </Text>
          <Pressable
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => void connectLink()}
            disabled={connecting}
          >
            <Text style={styles.btnText}>
              {connecting
                ? "Connecting…"
                : mode === "business"
                  ? "Connect business bank"
                  : "Connect personal bank"}
            </Text>
          </Pressable>
        </View>
      ) : (
        accounts.map((a) => (
          <View
            key={a.id}
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.title, { color: colors.foreground }]}>
              {a.institutionName}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              {a.accountName} ···{a.mask} · {a.type}
            </Text>
            <Text style={{ color: colors.foreground, fontWeight: "600" }}>
              ${Number(a.balance).toFixed(2)}
            </Text>
            <Pressable
              onPress={() => void remove(a.id)}
              disabled={removingId === a.id}
            >
              <Text style={{ color: "#c0392b", fontWeight: "600" }}>
                {removingId === a.id ? "Disconnecting…" : "Disconnect"}
              </Text>
            </Pressable>
          </View>
        ))
      )}

      {accounts.length > 0 ? (
        <Pressable
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => void connectLink()}
          disabled={connecting}
        >
          <Text style={styles.btnText}>
            {connecting ? "Connecting…" : "Connect another bank"}
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  copy: { fontSize: 13, lineHeight: 19 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  title: { fontSize: 16, fontWeight: "700" },
  btn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
