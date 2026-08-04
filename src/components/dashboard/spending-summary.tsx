"use client";

import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  changePercent,
  formatCurrency,
  formatPercent,
  modeLabel,
} from "@/lib/format";
import type { MonthlySummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SpendingSummary({ summary }: { summary: MonthlySummary }) {
  const expenseChange = changePercent(
    summary.expenses,
    summary.previousExpenses
  );
  const incomeChange = changePercent(summary.income, summary.previousIncome);
  const expenseDown = expenseChange <= 0;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <SummaryCard
        label="Income"
        value={formatCurrency(summary.income)}
        delta={formatPercent(incomeChange)}
        positive={incomeChange >= 0}
        className="centsy-animate-in"
        hint={`vs last month · ${modeLabel(summary.mode)}`}
      />
      <SummaryCard
        label="Spending"
        value={formatCurrency(summary.expenses)}
        delta={formatPercent(expenseChange)}
        positive={expenseDown}
        invertDeltaColor
        className="centsy-animate-in centsy-animate-in-delay-1"
        hint="Month to date"
      />
      <Card className="centsy-animate-in centsy-animate-in-delay-2 border-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 ring-0">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-primary-foreground/85">
            <Wallet className="size-4" />
            Net cashflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
            {formatCurrency(summary.net)}
          </p>
          <p className="mt-1 text-xs text-primary-foreground/75">
            Available to save or invest
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  delta,
  positive,
  invertDeltaColor,
  hint,
  className,
}: {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  invertDeltaColor?: boolean;
  hint: string;
  className?: string;
}) {
  const good = invertDeltaColor ? positive : positive;
  return (
    <Card className={cn("bg-card/80 backdrop-blur-sm", className)}>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
              good
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {positive ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {delta}
          </span>
          <span className="text-muted-foreground">{hint}</span>
        </div>
      </CardContent>
    </Card>
  );
}
