"use client";

import { formatRatio } from "@/lib/utils";

interface Metric {
  label: string;
  value: string;
}

interface MetricsRowProps {
  metrics: Metric[];
}

export function MetricsRow({ metrics }: MetricsRowProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="border border-border bg-card p-3"
        >
          <div className="text-xs text-muted-foreground">{m.label}</div>
          <div className="mt-1 font-financial text-sm font-medium text-foreground">
            {m.value}
          </div>
        </div>
      ))}
    </div>
  );
}
