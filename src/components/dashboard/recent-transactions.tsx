"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  categoryLabel,
  formatCurrency,
  formatDate,
} from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RecentTransactions({
  transactions,
}: {
  transactions: Transaction[];
}) {
  return (
    <Card className="centsy-animate-in centsy-animate-in-delay-4 bg-card/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Recent activity</CardTitle>
          <p className="text-sm text-muted-foreground">
            Filtered to active mode
          </p>
        </div>
        <Link
          href="/transactions"
          className="text-xs font-medium text-primary hover:underline"
        >
          See all
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {transactions.slice(0, 5).map((txn) => (
          <div
            key={txn.id}
            className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/50"
          >
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold",
                txn.type === "income"
                  ? "bg-success/10 text-success"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {txn.merchant.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{txn.merchant}</p>
              <p className="truncate text-xs text-muted-foreground">
                {formatDate(txn.date)} · {categoryLabel(txn.category)}
              </p>
            </div>
            <div className="text-right">
              <p
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  txn.type === "income" ? "text-success" : "text-foreground"
                )}
              >
                {txn.type === "income" ? "+" : "-"}
                {formatCurrency(txn.amount)}
              </p>
              {!txn.reconciled ? (
                <Badge variant="outline" className="mt-0.5 text-[10px]">
                  Unmatched
                </Badge>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
