"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useModeStore } from "@/stores/mode-store";
import { api } from "@/lib/client-api";
import {
  categoryLabel,
  formatCurrency,
  formatDate,
  modeLabel,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

export default function TransactionsPage() {
  const mode = useModeStore((s) => s.mode);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ transactions: Transaction[] }>(`/api/transactions?mode=${mode}`)
      .then((d) => setTransactions(d.transactions))
      .catch((e: Error) => setError(e.message));
  }, [mode]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live {modeLabel(mode)} ledger from your database.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">All activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions yet. Snap a receipt to create your first one.
            </p>
          ) : (
            transactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-muted/50"
              >
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl text-xs font-semibold",
                    txn.type === "income"
                      ? "bg-success/10 text-success"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {txn.merchant.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{txn.merchant}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(txn.date)} · {categoryLabel(txn.category)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {txn.type === "income" ? "+" : "-"}
                    {formatCurrency(txn.amount)}
                  </p>
                  <Badge
                    variant={txn.reconciled ? "secondary" : "outline"}
                    className="mt-0.5 text-[10px]"
                  >
                    {txn.reconciled ? "Reconciled" : "Open"}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
