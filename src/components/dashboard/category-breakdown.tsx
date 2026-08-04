"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { categoryLabel, formatCurrency } from "@/lib/format";
import type { MonthlySummary } from "@/lib/types";

export function CategoryBreakdown({ summary }: { summary: MonthlySummary }) {
  const total = summary.byCategory.reduce((sum, c) => sum + c.amount, 0) || 1;

  return (
    <Card className="centsy-animate-in centsy-animate-in-delay-3 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-base">Spending buckets</CardTitle>
        <p className="text-sm text-muted-foreground">
          Auto-categorized this month
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary.byCategory.map((item) => {
          const pct = Math.round((item.amount / total) * 100);
          return (
            <div key={item.category}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">
                  {categoryLabel(item.category)}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {formatCurrency(item.amount)} · {pct}%
                </span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
