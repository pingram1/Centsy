import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { colors } from "@/theme";

const PRO_FEATURES = [
  "AI categorizes merchants & suggests Personal vs Business",
  "Auto-match Snap receipts to bank charges",
  "Cash runway & “can I afford this?” forecasts",
  "Anomaly alerts for odd or duplicate charges",
];

/** Home teaser for deferred Pro bank intelligence. */
export function BankProTeaser() {
  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Pro</Text>
      </View>
      <Text style={styles.title}>Bank intelligence</Text>
      <Text style={styles.body}>
        Free includes sync, inbox triage, and the cash pulse. These upgrades ship
        with Centsy Pro:
      </Text>
      {PRO_FEATURES.map((line) => (
        <Text key={line} style={styles.bullet}>
          · {line}
        </Text>
      ))}
      <Link href="/profile/billing" asChild>
        <Pressable style={styles.cta}>
          <Text style={styles.ctaText}>See Pro plans</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.foreground,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  title: { fontSize: 15, fontWeight: "800", color: colors.foreground },
  body: { fontSize: 12, color: colors.muted, lineHeight: 17 },
  bullet: { fontSize: 12, color: colors.foreground, lineHeight: 17 },
  cta: {
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
