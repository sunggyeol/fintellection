"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn, formatPrice, formatPercent, getPriceColorClass } from "@/lib/utils";
import type { IndexData } from "@/types/financial";

const FALLBACK_INDICES = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^DJI", name: "DOW 30" },
  { symbol: "^VIX", name: "VIX" },
  { symbol: "^RUT", name: "Russell 2000" },
  { symbol: "^FTSE", name: "FTSE 100" },
  { symbol: "^N225", name: "Nikkei 225" },
  { symbol: "^HSI", name: "Hang Seng" },
  { symbol: "^STOXX50E", name: "Euro STOXX 50" },
  { symbol: "^DAX", name: "DAX" },
];

interface IndexTilesRowProps {
  indices?: IndexData[];
  loading?: boolean;
}

export function IndexTilesRow({ indices: propIndices, loading: propLoading }: IndexTilesRowProps) {
  const [selfIndices, setSelfIndices] = useState<IndexData[]>([]);
  const [selfLoading, setSelfLoading] = useState(true);

  useEffect(() => {
    if (propIndices) return;
    const symbols = FALLBACK_INDICES.map((i) => i.symbol).join(",");
    fetch(`/api/quotes?symbols=${symbols}`)
      .then((r) => r.json())
      .then((data: Record<string, { price: number; change: number; changePct: number }>) => {
        setSelfIndices(
          FALLBACK_INDICES.map(({ symbol, name }) => ({
            symbol,
            name,
            value: data[symbol]?.price ?? 0,
            change: data[symbol]?.change ?? 0,
            changePct: data[symbol]?.changePct ?? 0,
            sparkline: [],
          }))
        );
      })
      .catch(() => {
        setSelfIndices(
          FALLBACK_INDICES.map(({ symbol, name }) => ({
            symbol, name, value: 0, change: 0, changePct: 0, sparkline: [],
          }))
        );
      })
      .finally(() => setSelfLoading(false));
  }, [propIndices]);

  const indices = propIndices ?? selfIndices;
  const loading = propLoading ?? (propIndices ? false : selfLoading);

  if (loading) {
    return (
      <div className="border border-border bg-card">
        <div className="border-b border-border px-3 py-2">
          <span className="text-[13px] font-medium text-foreground">Market Index</span>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-5">
          {FALLBACK_INDICES.map((idx) => (
            <div key={idx.symbol} className="h-[68px] animate-shimmer bg-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card">
      <div className="border-b border-border px-3 py-2">
        <span className="text-[13px] font-medium text-foreground">Market Index</span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-5">
        {indices.map((idx) => {
          const colorClass = getPriceColorClass(idx.changePct);
          return (
            <Link
              key={idx.symbol}
              href={`/stock/${encodeURIComponent(idx.symbol)}`}
              className="bg-card px-3 py-2.5 transition-colors hover:bg-elevated"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-foreground">
                  {idx.name}
                </span>
                <span className={cn("font-financial text-[10px]", colorClass)}>
                  {formatPercent(idx.changePct)}
                </span>
              </div>
              <div className="mt-1 font-financial text-[14px] font-medium text-foreground">
                {formatPrice(idx.value)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
