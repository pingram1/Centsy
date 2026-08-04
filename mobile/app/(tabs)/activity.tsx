import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import {
  categoryLabel,
  formatCurrency,
  formatDate,
  modeLabel,
  type Transaction,
} from "@centsy/shared";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useModeStore } from "@/stores/mode-store";
import { api } from "@/lib/api";
import { colors } from "@/theme";

export default function ActivityScreen() {
  const mode = useModeStore((s) => s.mode);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ transactions: Transaction[] }>(
        `/api/transactions?mode=${mode}`
      );
      setTransactions(data.transactions);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <View style={styles.safe}>
      <ScreenHeader title="Activity" subtitle={`${modeLabel(mode)} · live`} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void load()} />
        }
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading && transactions.length === 0 ? (
          <ActivityIndicator color={colors.primary} />
        ) : null}
        {transactions.length === 0 && !loading ? (
          <Text style={styles.empty}>No transactions yet.</Text>
        ) : (
          transactions.map((txn) => (
            <View key={txn.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.merchant}>{txn.merchant}</Text>
                <Text style={styles.meta}>
                  {formatDate(txn.date)} · {categoryLabel(txn.category)}
                </Text>
              </View>
              <Text style={styles.amount}>
                {txn.type === "income" ? "+" : "-"}
                {formatCurrency(txn.amount)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingTop: 8, gap: 10, paddingBottom: 32 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  merchant: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  meta: { marginTop: 3, fontSize: 12, color: colors.muted },
  amount: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  empty: { color: colors.muted, textAlign: "center", marginTop: 24 },
  error: { color: colors.danger, fontSize: 13 },
});
