"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { Button } from "@/components/ui/button";
import { useModeStore } from "@/stores/mode-store";
import { api } from "@/lib/client-api";
import { modeLabel } from "@/lib/format";
import type { Insight } from "@/lib/types";

export default function InsightsPage() {
  const mode = useModeStore((s) => s.mode);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    api<{ insights: Insight[] }>(`/api/dashboard?mode=${mode}`)
      .then((d) => setInsights(d.insights))
      .catch(() => setInsights([]));
  }, [mode]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Centsy Insights
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Derived from your live {modeLabel(mode)} activity.
          </p>
        </div>
        <Button size="sm" render={<Link href="/ai" />}>
          Chat with Centsy AI
        </Button>
      </div>
      <InsightsPanel insights={insights} />
    </div>
  );
}
