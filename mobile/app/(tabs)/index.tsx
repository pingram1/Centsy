import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link, useFocusEffect } from "expo-router";
import {
  categoryLabel,
  formatCurrency,
  formatDate,
  modeLabel,
  type Insight,
  type MonthlySummary,
  type Transaction,
} from "@centsy/shared";
import { BrandIcon } from "@/components/BrandLogo";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SummaryCards } from "@/components/SummaryCards";
import {
  BankInbox,
  type InboxItem,
} from "@/components/bank/BankInbox";
import {
  CashPulse,
  type CashPulseData,
} from "@/components/bank/CashPulse";
import { BankProTeaser } from "@/components/bank/BankProTeaser";
import { useModeStore } from "@/stores/mode-store";
import { colors } from "@/theme";
import { api } from "@/lib/api";

export default function HomeScreen() {
  const mode = useModeStore((s) => s.mode);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [pulse, setPulse] = useState<CashPulseData | null>(null);
  const [plan, setPlan] = useState("FREE");
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadBank = useCallback(async (opts?: { autoSync?: boolean }) => {
    const data = await api<{
      plan: string;
      inbox: InboxItem[];
      pulse: CashPulseData;
    }>(`/api/plaid/inbox?mode=${mode}`);
    setInbox(data.inbox);
    setPulse(data.pulse);
    setPlan(data.plan || "FREE");

    const needsSync =
      opts?.autoSync &&
      data.pulse.balances.length > 0 &&
      data.pulse.balances.every((b) => !b.lastSyncedAt);
    if (needsSync) {
      await api("/api/plaid/sync", {
        method: "POST",
        body: JSON.stringify({ mode }),
      });
      const refreshed = await api<{
        plan: string;
        inbox: InboxItem[];
        pulse: CashPulseData;
      }>(`/api/plaid/inbox?mode=${mode}`);
      setInbox(refreshed.inbox);
      setPulse(refreshed.pulse);
      setPlan(refreshed.plan || "FREE");
    }
  }, [mode]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{
        summary: MonthlySummary;
        insights: Insight[];
        transactions: Transaction[];
      }>(`/api/dashboard?mode=${mode}`);
      setSummary(data.summary);
      setInsights(data.insights);
      setTransactions(data.transactions);
      await loadBank({ autoSync: true }).catch(() => {
        setInbox([]);
        setPulse(null);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [mode, loadBank]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function syncBanks() {
    setSyncing(true);
    try {
      await api("/api/plaid/sync", {
        method: "POST",
        body: JSON.stringify({ mode }),
      });
      await loadBank();
      await load();
    } catch {
      /* inbox may still load */
      await loadBank().catch(() => undefined);
    } finally {
      setSyncing(false);
    }
  }

  async function patchInbox(
    id: string,
    body: Record<string, unknown>
  ) {
    setBusyId(id);
    try {
      await api(`/api/plaid/inbox/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await loadBank();
      if (body.action === "accept") {
        const data = await api<{
          summary: MonthlySummary;
          transactions: Transaction[];
        }>(`/api/dashboard?mode=${mode}`);
        setSummary(data.summary);
        setTransactions(data.transactions);
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View style={styles.safe}>
      <ScreenHeader showLogo subtitle={`${modeLabel(mode)} · live`} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading || syncing}
            onRefresh={() => {
              void syncBanks();
            }}
          />
        }
      >
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.hint}>
              Sign in from the Profile tab to sync your live account.
            </Text>
            <Link href="/login" asChild>
              <Pressable style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Sign in</Text>
              </Pressable>
            </Link>
          </View>
        ) : null}

        {loading && !summary ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : null}

        {summary ? (
          <>
            {pulse ? (
              <CashPulse
                pulse={pulse}
                selectedId={selectedAccount}
                onSelect={setSelectedAccount}
                onSync={() => void syncBanks()}
                syncing={syncing}
              />
            ) : null}

            <View style={styles.rowBetween}>
              <Text style={styles.section}>From your bank</Text>
              <Text style={styles.count}>
                {inbox.length} to review
              </Text>
            </View>
            <BankInbox
              items={inbox}
              busyId={busyId}
              onAccept={(id) =>
                void patchInbox(id, {
                  action: "accept",
                  category: inbox.find((i) => i.id === id)?.suggestedCategory,
                })
              }
              onIgnore={(id) => void patchInbox(id, { action: "ignore" })}
            />

            {plan !== "PRO" ? <BankProTeaser /> : null}

            <SummaryCards summary={summary} />

            <View style={styles.rowBetween}>
              <View style={styles.sectionRow}>
                <BrandIcon size="sm" />
                <Text style={styles.section}>Centsy Insights</Text>
              </View>
              <Link href="/ai" asChild>
                <Pressable>
                  <Text style={styles.link}>Ask AI</Text>
                </Pressable>
              </Link>
            </View>
            {insights.map((insight) => (
              <View key={insight.id} style={styles.insight}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightBody}>{insight.body}</Text>
              </View>
            ))}

            <Text style={styles.section}>Recent activity</Text>
            {transactions.length === 0 ? (
              <Text style={styles.empty}>No transactions yet — use Snap or Accept from your bank inbox.</Text>
            ) : (
              transactions.map((txn) => (
                <View key={txn.id} style={styles.txn}>
                  <View style={styles.txnMeta}>
                    <Text style={styles.txnMerchant} numberOfLines={1}>
                      {txn.merchant}
                    </Text>
                    <Text style={styles.txnSub}>
                      {formatDate(txn.date)} · {categoryLabel(txn.category)}
                      {txn.reconciled ? " · matched" : ""}
                    </Text>
                  </View>
                  <Text style={styles.txnAmount}>
                    {txn.type === "income" ? "+" : "-"}
                    {formatCurrency(txn.amount)}
                  </Text>
                </View>
              ))
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingTop: 8, paddingBottom: 32, gap: 12 },
  section: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.foreground,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  count: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  link: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  insight: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  insightTitle: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  insightBody: { fontSize: 13, lineHeight: 19, color: colors.muted },
  txn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  txnMeta: { flex: 1 },
  txnMerchant: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  txnSub: { marginTop: 2, fontSize: 12, color: colors.muted },
  txnAmount: { fontSize: 14, fontWeight: "700", color: colors.foreground },
  empty: { color: colors.muted, fontSize: 13 },
  errorBox: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  errorText: { color: colors.danger, fontWeight: "600" },
  hint: { color: colors.muted, fontSize: 12 },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
});
