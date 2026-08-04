import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { api } from "@/lib/api";
import { clearToken } from "@/lib/session";
import { useThemeStore } from "@/stores/theme-store";

export default function PrivacyScreen() {
  const colors = useThemeStore((s) => s.colors);

  function deleteAccount() {
    Alert.alert(
      "Delete account permanently?",
      "This removes your profile, sessions, transactions, receipts, mileage, and AI memories. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await api("/api/auth/account", {
                  method: "DELETE",
                  body: JSON.stringify({ confirm: "DELETE" }),
                });
                await clearToken();
                router.replace("/login");
              } catch (e) {
                Alert.alert(
                  "Couldn’t delete",
                  e instanceof Error ? e.message : "Error"
                );
              }
            })();
          },
        },
      ]
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Stack.Screen options={{ title: "Privacy & data" }} />
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Record retention
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
          Centsy stores ledger data to help you substantiate income and
          deductions. Per IRS guidance (Pub. 583 / “How long should I keep
          records?”), keep supporting documents generally at least 3 years after
          filing; longer for employment taxes (4+ years), certain losses, or if
          income was substantially underreported. Digital records are acceptable
          when accurate, complete, and accessible.
        </Text>
      </View>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Security posture
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
          Passwords are hashed (bcrypt). Session tokens are hashed at rest. Bank
          and Stripe secrets stay server-side. Row Level Security blocks public
          Data API access to your tables. Export before deleting if you need an
          archive.
        </Text>
      </View>
      <Pressable
        style={[styles.danger, { borderColor: colors.danger }]}
        onPress={deleteAccount}
      >
        <Text style={{ color: colors.danger, fontWeight: "700" }}>
          Delete my account
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  title: { fontSize: 16, fontWeight: "700" },
  danger: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
});
