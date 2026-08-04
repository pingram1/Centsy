"use client";

import Link from "next/link";
import { AlertTriangle, Lightbulb, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Insight, InsightSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";

const severityMeta: Record<
  InsightSeverity,
  { icon: typeof Sparkles; label: string; className: string }
> = {
  warning: {
    icon: AlertTriangle,
    label: "Watch",
    className: "bg-warning/15 text-warning-foreground border-warning/20",
  },
  opportunity: {
    icon: TrendingUp,
    label: "Grow",
    className: "bg-success/10 text-success border-success/20",
  },
  info: {
    icon: Lightbulb,
    label: "Tip",
    className: "bg-insight/10 text-insight border-insight/20",
  },
};

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <Card className="centsy-animate-in centsy-animate-in-delay-3 border-0 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm ring-1 ring-foreground/10">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-3.5" />
            </span>
            Centsy Insights
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Actionable coaching — not just charts
          </p>
        </div>
        <Link
          href="/ai"
          className="text-xs font-medium text-primary hover:underline"
        >
          Ask Centsy AI
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => {
          const meta = severityMeta[insight.severity];
          const Icon = meta.icon;
          return (
            <article
              key={insight.id}
              className={cn(
                "rounded-xl border border-border/70 bg-background/70 p-3.5 transition-colors hover:bg-background",
                index === 0 && "ring-1 ring-primary/15"
              )}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn("gap-1 border", meta.className)}
                >
                  <Icon className="size-3" />
                  {meta.label}
                </Badge>
                {insight.metric ? (
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {insight.metric}
                  </span>
                ) : null}
              </div>
              <h3 className="text-sm font-semibold tracking-tight">
                {insight.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {insight.body}
              </p>
              {insight.actionLabel ? (
                <Link
                  href={insight.actionHref ?? "/insights"}
                  className="mt-2.5 inline-flex text-xs font-medium text-primary hover:underline"
                >
                  {insight.actionLabel} →
                </Link>
              ) : null}
            </article>
          );
        })}
      </CardContent>
    </Card>
  );
}
