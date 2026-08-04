import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatCurrency } from "@centsy/shared";
import { colors } from "@/theme";

export type PulseBalance = {
  id: string;
  label: string;
  balance: number;
  type: string;
  lastSyncedAt?: string | null;
};

export type CashPulseData = {
  weekTotal: number;
  weekMatched: number;
  weekOpen: number;
  matchPercent: number;
  balances: PulseBalance[];
  totalCash: number;
};

type Props = {
  pulse: CashPulseData;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onSync: () => void;
  syncing?: boolean;
};

/** Interactive cash diagram — tap a bar to focus an account. */
export function CashPulse({
  pulse,
  selectedId,
  onSelect,
  onSync,
  syncing,
}: Props) {
  const maxBal = Math.max(
    1,
    ...pulse.balances.map((b) => Math.abs(b.balance))
  );
  const selected = pulse.balances.find((b) => b.id === selectedId);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Cash pulse</Text>
          <Text style={styles.total}>{formatCurrency(pulse.totalCash)}</Text>
          <Text style={styles.sub}>Spendable across checking & savings</Text>
        </View>
        <Pressable style={styles.syncBtn} onPress={onSync} disabled={syncing}>
          <Text style={styles.syncText}>{syncing ? "Syncing…" : "Sync"}</Text>
        </Pressable>
      </View>

      {pulse.balances.length === 0 ? (
        <Text style={styles.empty}>
          Connect a bank for this workspace in Profile to power this diagram.
          Personal and Business banks stay separate.
        </Text>
      ) : (
        <View style={styles.bars}>
          {pulse.balances.map((b) => {
            const height = Math.max(8, (Math.abs(b.balance) / maxBal) * 88);
            const active = selectedId === b.id;
            return (
              <Pressable
                key={b.id}
                style={styles.barCol}
                onPress={() => onSelect(active ? null : b.id)}
              >
                <Text style={styles.barValue} numberOfLines={1}>
                  {formatCurrency(b.balance)}
                </Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: active
                        ? colors.primary
                        : b.type === "credit"
                          ? colors.warning
                          : colors.primaryMuted,
                    },
                  ]}
                />
                <Text style={styles.barLabel} numberOfLines={2}>
                  {b.label.replace(" ···", "\n···")}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {selected ? (
        <View style={styles.focus}>
          <Text style={styles.focusTitle}>{selected.label}</Text>
          <Text style={styles.focusBody}>
            {selected.type === "credit" ? "Card balance" : "Available"}{" "}
            {formatCurrency(selected.balance)}
          </Text>
        </View>
      ) : null}

      <View style={styles.weekRow}>
        <View style={styles.weekMeta}>
          <Text style={styles.weekLabel}>This week matched</Text>
          <Text style={styles.weekPct}>{pulse.matchPercent}%</Text>
          <Text style={styles.sub}>
            {pulse.weekMatched} of {pulse.weekTotal} bank charges in the ledger
            {pulse.weekOpen > 0 ? ` · ${pulse.weekOpen} open` : ""}
          </Text>
        </View>
        <View style={styles.ring}>
          <View
            style={[
              styles.ringFill,
              {
                height: (56 * Math.min(100, pulse.matchPercent)) / 100,
              },
            ]}
          />
          <Text style={styles.ringText}>{pulse.matchPercent}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  total: { fontSize: 26, fontWeight: "800", color: colors.foreground },
  sub: { fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 16 },
  syncBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  syncText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  empty: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    minHeight: 130,
    paddingTop: 4,
  },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  barValue: { fontSize: 9, color: colors.muted, fontWeight: "600" },
  bar: {
    width: "72%",
    borderRadius: 10,
    minHeight: 8,
  },
  barLabel: {
    fontSize: 10,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 13,
  },
  focus: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  focusTitle: { fontWeight: "700", color: colors.foreground, fontSize: 13 },
  focusBody: { color: colors.muted, fontSize: 12 },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  weekMeta: { flex: 1 },
  weekLabel: { fontSize: 12, fontWeight: "600", color: colors.muted },
  weekPct: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.foreground,
    marginTop: 2,
  },
  ring: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: colors.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: colors.secondary,
  },
  ringFill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primaryMuted,
  },
  ringText: {
    fontWeight: "800",
    color: colors.foreground,
    fontSize: 13,
    marginBottom: 16,
    zIndex: 1,
  },
});
