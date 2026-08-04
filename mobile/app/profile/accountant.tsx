import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { api } from "@/lib/api";
import { useThemeStore } from "@/stores/theme-store";

type Invite = {
  id: string;
  email: string;
  status: string;
  inviteUrl: string;
  createdAt: string;
};

export default function AccountantScreen() {
  const colors = useThemeStore((s) => s.colors);
  const [email, setEmail] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ invites: Invite[] }>("/api/accountant/invites");
      setInvites(data.invites);
    } catch {
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function sendInvite() {
    if (!email.trim()) {
      Alert.alert("Email required");
      return;
    }
    setSending(true);
    try {
      const res = await api<{ invite: Invite }>("/api/accountant/invites", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          workspace: "business",
        }),
      });
      setEmail("");
      await load();
      Alert.alert(
        "Invite created",
        `Share this read-only link:\n\n${res.invite.inviteUrl}`
      );
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Invite failed");
    } finally {
      setSending(false);
    }
  }

  async function revoke(id: string) {
    try {
      await api(`/api/accountant/invites/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Revoke failed");
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.wrap}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => void load()} />
      }
    >
      <Stack.Screen options={{ title: "Accountant access" }} />
      <Text style={[styles.copy, { color: colors.muted }]}>
        Invite a CPA or bookkeeper with read-only access to your Business
        workspace—receipts, mileage, and exports without edit rights.
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: colors.border,
            backgroundColor: colors.card,
            color: colors.foreground,
          },
        ]}
        placeholder="accountant@firm.com"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Pressable
        style={[styles.btn, { backgroundColor: colors.primary }]}
        onPress={() => void sendInvite()}
        disabled={sending}
      >
        <Text style={styles.btnText}>
          {sending ? "Creating…" : "Send invite"}
        </Text>
      </Pressable>

      {invites.map((inv) => (
        <View
          key={inv.id}
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>
            {inv.email}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {inv.status} · {new Date(inv.createdAt).toLocaleDateString()}
          </Text>
          {inv.status !== "REVOKED" ? (
            <View style={styles.actions}>
              <Pressable
                onPress={() => Alert.alert("Invite link", inv.inviteUrl)}
              >
                <Text style={{ color: colors.primary, fontWeight: "700" }}>
                  View link
                </Text>
              </Pressable>
              <Pressable onPress={() => void revoke(inv.id)}>
                <Text style={{ color: "#c0392b", fontWeight: "600" }}>
                  Revoke
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  copy: { fontSize: 13, lineHeight: 19 },
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
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 6 },
  title: { fontSize: 15, fontWeight: "700" },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
});
