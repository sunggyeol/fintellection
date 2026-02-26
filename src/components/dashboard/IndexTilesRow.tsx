"use client";

import { useEffect, useState } from "react";
import { IndexTile } from "./IndexTile";
import type { IndexData } from "@/types/financial";

const INDICES = [
  { symbol: "^GSPC", name: "S&P 500", etf: "SPY" },
  { symbol: "^IXIC", name: "NASDAQ", etf: "QQQ" },
  { symbol: "^DJI", name: "DOW 30", etf: "DIA" },
  { symbol: "^VIX", name: "VIX", etf: "UVXY" },
];

export function IndexTilesRow() {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const symbols = INDICES.map((i) => i.symbol).join(",");
    fetch(`/api/quotes?symbols=${symbols}`)
      .then((r) => r.json())
      .then((data: Record<string, { price: number; change: number; changePct: number }>) => {
        setIndices(
          INDICES.map(({ symbol, name, etf }) => ({
            symbol,
            name,
            etf,
            value: data[symbol]?.price ?? 0,
            change: data[symbol]?.change ?? 0,
            changePct: data[symbol]?.changePct ?? 0,
            sparkline: [],
          }))
        );
      })
      .catch(() => {
        setIndices(
          INDICES.map(({ symbol, name, etf }) => ({
            symbol, name, etf, value: 0, change: 0, changePct: 0, sparkline: [],
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {INDICES.map((idx) => (
          <div
            key={idx.symbol}
            className="h-[72px] animate-shimmer border border-border"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {indices.map((idx) => (
        <IndexTile key={idx.symbol} data={idx} />
      ))}
    </div>
  );
}
