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
  formatCurrency,
  formatDate,
  modeLabel,
  type MileageLog,
} from "@centsy/shared";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useModeStore } from "@/stores/mode-store";
import { api } from "@/lib/api";
import { colors } from "@/theme";

export default function MileageScreen() {
  const mode = useModeStore((s) => s.mode);
  const [logs, setLogs] = useState<MileageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ logs: MileageLog[] }>(`/api/mileage?mode=${mode}`);
      setLogs(data.logs);
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

  const totalMiles = logs.reduce((sum, l) => sum + l.miles, 0);
  const totalGas = logs.reduce((sum, l) => sum + (l.gasCost ?? 0), 0);

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title="Mileage & gas"
        subtitle={`${modeLabel(mode)} · live`}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void load()} />
        }
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Miles</Text>
            <Text style={styles.statValue}>{totalMiles}</Text>
          </View>
          <View style={[styles.stat, styles.statAccent]}>
            <Text style={styles.statLabelAccent}>Gas</Text>
            <Text style={styles.statValueAccent}>
              {formatCurrency(totalGas)}
            </Text>
          </View>
        </View>
        {loading && logs.length === 0 ? (
          <ActivityIndicator color={colors.primary} />
        ) : null}
        {logs.length === 0 && !loading ? (
          <Text style={styles.empty}>No trips yet.</Text>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.card}>
              <Text style={styles.purpose}>{log.purpose}</Text>
              <Text style={styles.meta}>
                {formatDate(log.date)} · {log.miles} mi
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
  stats: { flexDirection: "row", gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  statAccent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: "500" },
  statLabelAccent: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  statValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: "700",
    color: colors.foreground,
  },
  statValueAccent: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  purpose: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  meta: { marginTop: 4, fontSize: 12, color: colors.muted },
  empty: { color: colors.muted, textAlign: "center", marginTop: 24 },
  error: { color: colors.danger },
});
