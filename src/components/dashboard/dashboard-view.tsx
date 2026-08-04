"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useModeStore } from "@/stores/mode-store";
import { api } from "@/lib/client-api";
import { modeLabel } from "@/lib/format";
import { SpendingSummary } from "@/components/dashboard/spending-summary";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Button } from "@/components/ui/button";
import type { Insight, MonthlySummary, Transaction } from "@/lib/types";

interface DashboardPayload {
  summary: MonthlySummary;
  transactions: Transaction[];
  insights: Insight[];
}

export function DashboardView() {
  const mode = useModeStore((s) => s.mode);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api<DashboardPayload>(`/api/dashboard?mode=${mode}`)
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(
            err.message === "Unauthorized"
              ? "Sign in to load your live dashboard."
              : err.message
          );
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-border bg-card/80 p-8 text-center">
        <h1 className="text-xl font-semibold">Your live dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ?? "No data yet."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button render={<Link href="/login" />}>Sign in</Button>
          <Button variant="outline" render={<Link href="/signup" />}>
            Create account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="centsy-animate-in flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {modeLabel(mode)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live from your database · Tap Snap to capture a receipt
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/ai" />}
          className="gap-1.5"
        >
          Ask Centsy AI
        </Button>
      </div>

      <SpendingSummary summary={data.summary} />

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <CashflowChart summary={data.summary} />
          <RecentTransactions transactions={data.transactions} />
        </div>
        <div className="space-y-4 xl:col-span-2">
          <InsightsPanel insights={data.insights} />
          <CategoryBreakdown summary={data.summary} />
        </div>
      </div>
    </div>
  );
}
