import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatCurrency, formatDate } from "@centsy/shared";
import { colors } from "@/theme";

export type InboxItem = {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  pending: boolean;
  mode: "personal" | "business";
  institutionName: string;
  mask: string;
  suggestedCategory: string;
  suggestedLabel?: string;
  suggestedTags?: string[];
  suggestionPrecision?: "high" | "medium" | "low";
  suggestionReason?: string;
  subscriptionHint?: string | null;
  suggestionSource?: string;
  type: "expense" | "income";
};

type Props = {
  items: InboxItem[];
  busyId: string | null;
  onAccept: (id: string) => void;
  onIgnore: (id: string) => void;
};

function tagLabel(tag: string): string {
  if (tag === "delivery_services") return "Delivery Services";
  if (tag === "grocery") return "Grocery";
  if (tag === "subscription_candidate") return "Subscription?";
  return tag.replace(/_/g, " ");
}

export function BankInbox({ items, busyId, onAccept, onIgnore }: Props) {
  if (items.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>Inbox clear</Text>
        <Text style={styles.emptyBody}>
          Charges from banks linked in this workspace land here. Personal and
          Business banks never mix.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {items.slice(0, 8).map((item) => {
        const busy = busyId === item.id;
        const label = item.suggestedLabel ?? item.suggestedCategory;
        const tags = (item.suggestedTags ?? []).filter((t) => t !== "grocery");
        const lowPrecision = item.suggestionPrecision === "low";
        return (
          <View key={item.id} style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.merchant} numberOfLines={1}>
                  {item.merchant}
                </Text>
                <Text style={styles.meta}>
                  {formatDate(item.date)} · {item.institutionName} ···{item.mask}
                  {item.pending ? " · pending" : ""}
                </Text>
                <Text
                  style={[styles.cat, lowPrecision ? styles.catLow : null]}
                >
                  Centsy AI suggests {label}
                  {tags.length > 0
                    ? ` · ${tags.map(tagLabel).join(" · ")}`
                    : ""}
                </Text>
                {item.subscriptionHint ? (
                  <Text style={styles.hint}>{item.subscriptionHint}</Text>
                ) : null}
              </View>
              <Text style={styles.amount}>
                {item.type === "income" ? "+" : "-"}
                {formatCurrency(Math.abs(item.amount))}
              </Text>
            </View>
            <View style={styles.actions}>
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                disabled={busy}
                onPress={() => onIgnore(item.id)}
              >
                <Text style={styles.btnGhostText}>Ignore</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnPrimary]}
                disabled={busy}
                onPress={() => onAccept(item.id)}
              >
                <Text style={styles.btnPrimaryText}>
                  {busy ? "…" : "Accept"}
                </Text>
              </Pressable>
            </View>
          </View>
        );
      })}
      {items.length > 8 ? (
        <Text style={styles.more}>{items.length - 8} more in inbox</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  emptyTitle: { fontWeight: "700", color: colors.foreground },
  emptyBody: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
  },
  row: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  merchant: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  meta: { marginTop: 2, fontSize: 11, color: colors.muted },
  cat: { marginTop: 4, fontSize: 11, color: colors.primary, fontWeight: "600" },
  catLow: { color: "#b45309" },
  hint: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
  },
  amount: { fontSize: 15, fontWeight: "800", color: colors.foreground },
  actions: { flexDirection: "row", gap: 8 },
  btn: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    flex: 1,
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnGhostText: { fontSize: 12, fontWeight: "700", color: colors.muted },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  more: { color: colors.muted, fontSize: 12, textAlign: "center" },
});
