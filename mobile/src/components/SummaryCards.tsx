import { StyleSheet, Text, View } from "react-native";
import {
  changePercent,
  formatCurrency,
  formatPercent,
  type MonthlySummary,
} from "@centsy/shared";
import { colors } from "@/theme";

export function SummaryCards({ summary }: { summary: MonthlySummary }) {
  const expenseChange = changePercent(
    summary.expenses,
    summary.previousExpenses
  );
  const incomeChange = changePercent(summary.income, summary.previousIncome);

  return (
    <View style={styles.row}>
      <Card
        label="Income"
        value={formatCurrency(summary.income)}
        delta={formatPercent(incomeChange)}
        positive={incomeChange >= 0}
      />
      <Card
        label="Spending"
        value={formatCurrency(summary.expenses)}
        delta={formatPercent(expenseChange)}
        positive={expenseChange <= 0}
      />
      <Card
        label="Net"
        value={formatCurrency(summary.net)}
        accent
      />
    </View>
  );
}

function Card({
  label,
  value,
  delta,
  positive,
  accent,
}: {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  accent?: boolean;
}) {
  return (
    <View style={[styles.card, accent && styles.cardAccent]}>
      <Text style={[styles.label, accent && styles.labelAccent]}>{label}</Text>
      <Text style={[styles.value, accent && styles.valueAccent]}>{value}</Text>
      {delta ? (
        <Text
          style={[
            styles.delta,
            { color: positive ? colors.success : colors.danger },
          ]}
        >
          {delta}
        </Text>
      ) : (
        <Text style={styles.deltaAccent}>Available</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    minHeight: 96,
  },
  cardAccent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },
  labelAccent: {
    color: "rgba(255,255,255,0.85)",
  },
  value: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    color: colors.foreground,
  },
  valueAccent: {
    color: "#fff",
  },
  delta: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
  },
  deltaAccent: {
    marginTop: 6,
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
  },
});
