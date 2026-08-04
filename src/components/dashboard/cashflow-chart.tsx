"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { MonthlySummary } from "@/lib/types";

export function CashflowChart({ summary }: { summary: MonthlySummary }) {
  return (
    <Card className="centsy-animate-in centsy-animate-in-delay-2 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-base">Spending vs income</CardTitle>
        <p className="text-sm text-muted-foreground">
          Six-month cashflow for this mode
        </p>
      </CardHeader>
      <CardContent className="h-64 pt-0 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={summary.cashflow}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="oklch(0.9 0.01 200)"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "oklch(0.5 0.02 230)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={48}
              tick={{ fill: "oklch(0.5 0.02 230)", fontSize: 12 }}
              tickFormatter={(v) =>
                new Intl.NumberFormat("en-US", {
                  notation: "compact",
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }).format(v)
              }
            />
            <Tooltip
              cursor={{ fill: "oklch(0.94 0.02 175 / 0.5)" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid oklch(0.91 0.015 200)",
                boxShadow: "0 8px 24px oklch(0.2 0.02 230 / 0.08)",
                fontSize: 12,
              }}
              formatter={(value) => formatCurrency(Number(value ?? 0))}
            />
            <Bar
              dataKey="income"
              name="Income"
              fill="oklch(0.55 0.12 175)"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="expenses"
              name="Expenses"
              fill="oklch(0.72 0.08 230)"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
