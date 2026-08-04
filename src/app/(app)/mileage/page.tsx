"use client";

import { useEffect, useState } from "react";
import { Car, Fuel, Route } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useModeStore } from "@/stores/mode-store";
import { api } from "@/lib/client-api";
import { formatCurrency, formatDate, modeLabel } from "@/lib/format";
import type { MileageLog } from "@/lib/types";

export default function MileagePage() {
  const mode = useModeStore((s) => s.mode);
  const [logs, setLogs] = useState<MileageLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ logs: MileageLog[] }>(`/api/mileage?mode=${mode}`)
      .then((d) => setLogs(d.logs))
      .catch((e: Error) => setError(e.message));
  }, [mode]);

  const totalMiles = logs.reduce((sum, l) => sum + l.miles, 0);
  const totalGas = logs.reduce((sum, l) => sum + (l.gasCost ?? 0), 0);
  const reimbursable = logs.reduce(
    (sum, l) => sum + l.miles * l.ratePerMile,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mileage & gas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vehicle costs for {modeLabel(mode)} mode only.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={<Route className="size-4" />} label="Miles logged" value={`${totalMiles.toFixed(0)} mi`} />
        <StatCard icon={<Fuel className="size-4" />} label="Gas spend" value={formatCurrency(totalGas)} />
        <StatCard icon={<Car className="size-4" />} label="Mileage value" value={formatCurrency(reimbursable)} accent />
      </div>

      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base">Trip log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No trips in {modeLabel(mode)} mode yet.
            </p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 px-3 py-3"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <Car className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{log.purpose}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(log.date)}
                    {log.fromLocation && log.toLocation
                      ? ` · ${log.fromLocation} → ${log.toLocation}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-right">
                  <Badge variant="secondary">{log.miles} mi</Badge>
                  {log.gasCost != null ? (
                    <Badge variant="outline">Gas {formatCurrency(log.gasCost)}</Badge>
                  ) : null}
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(log.miles * log.ratePerMile)}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={
        accent
          ? "border-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground ring-0"
          : "bg-card/80"
      }
    >
      <CardContent className="pt-4">
        <div className={accent ? "mb-2 text-primary-foreground/80" : "mb-2 text-muted-foreground"}>
          {icon}
        </div>
        <p className={accent ? "text-xs text-primary-foreground/75" : "text-xs text-muted-foreground"}>
          {label}
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
