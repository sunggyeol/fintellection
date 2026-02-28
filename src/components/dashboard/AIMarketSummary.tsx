"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { DashboardPayload } from "@/types/financial";

interface MarketSummary {
  summary: string | null;
  sentiment: "bullish" | "bearish" | "neutral";
  generatedAt: string;
}

interface AIMarketSummaryProps {
  dashboard: DashboardPayload | null;
}

const sentimentConfig = {
  bullish: { label: "Bullish", className: "bg-up/15 text-up" },
  bearish: { label: "Bearish", className: "bg-down/15 text-down" },
  neutral: { label: "Neutral", className: "bg-muted text-muted-foreground" },
};

export function AIMarketSummary({ dashboard }: AIMarketSummaryProps) {
  const [data, setData] = useState<MarketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!dashboard || !dashboard.indices.length || fetched) return;

    setFetched(true);

    fetch("/api/market-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        indices: dashboard.indices,
        gainers: dashboard.gainers,
        losers: dashboard.losers,
        sectors: dashboard.sectors,
        news: dashboard.news,
      }),
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [dashboard, fetched]);

  // Always show the card with "AI Summary" header
  // Only shimmer the sentiment badge and text while loading
  const config = data?.sentiment ? sentimentConfig[data.sentiment] : null;

  return (
    <div className="border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Market Summary
        </span>
        {loading ? (
          <div className="h-4 w-14 animate-shimmer" />
        ) : config ? (
          <span className={cn("px-1.5 py-0.5 text-[10px] font-semibold uppercase", config.className)}>
            {config.label}
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-1.5">
          <div className="h-3 w-full animate-shimmer" />
          <div className="h-3 w-4/5 animate-shimmer" />
        </div>
      ) : data?.summary ? (
        <p className="text-[13px] leading-relaxed text-foreground">
          {data.summary}
        </p>
      ) : (
        <p className="text-[13px] text-muted-foreground">
          Unable to generate summary.
        </p>
      )}
    </div>
  );
}
