"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SectorPerformance } from "@/types/financial";

interface SectorPerformanceBarsProps {
  sectors: SectorPerformance[];
  loading?: boolean;
}

const SECTOR_ETF: Record<string, string> = {
  "Technology": "XLK",
  "Healthcare": "XLV",
  "Financial Services": "XLF",
  "Financials": "XLF",
  "Consumer Cyclical": "XLY",
  "Consumer Discretionary": "XLY",
  "Communication Services": "XLC",
  "Industrials": "XLI",
  "Consumer Defensive": "XLP",
  "Consumer Staples": "XLP",
  "Energy": "XLE",
  "Utilities": "XLU",
  "Real Estate": "XLRE",
  "Basic Materials": "XLB",
  "Materials": "XLB",
};


export function SectorPerformanceBars({ sectors, loading }: SectorPerformanceBarsProps) {
  if (loading) {
    return (
      <div className="border border-border bg-card">
        <div className="border-b border-border px-3 py-2">
          <span className="text-[13px] font-medium text-foreground">Sector Performance</span>
        </div>
        <div className="space-y-1 p-3">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="h-5 animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!sectors.length) return null;

  const sorted = [...sectors].sort((a, b) => b.changesPercentage - a.changesPercentage);
  const maxAbs = Math.max(...sorted.map((s) => Math.abs(s.changesPercentage)), 0.01);

  return (
    <div className="border border-border bg-card">
      <div className="border-b border-border px-3 py-2">
        <span className="text-[13px] font-medium text-foreground">Sector Performance</span>
      </div>
      <div className="px-3 py-2">
        {sorted.map((sector) => {
          const pct = sector.changesPercentage;
          const barWidth = (Math.abs(pct) / maxAbs) * 50; // max 50% width
          const isPositive = pct >= 0;
          const etf = SECTOR_ETF[sector.sector];

          const content = (
            <div className="group flex items-center gap-2 py-1">
              <span className="w-36 shrink-0 text-[11px] text-muted-foreground group-hover:text-foreground sm:w-40 sm:text-[12px]">
                {sector.sector}
              </span>
              <div className="relative flex h-4 flex-1 items-center">
                {/* Center line */}
                <div className="absolute left-1/2 h-full w-px bg-border" />
                {/* Bar */}
                <div
                  className={cn(
                    "absolute h-3.5 transition-all",
                    isPositive ? "bg-up/30" : "bg-down/30"
                  )}
                  style={{
                    width: `${barWidth}%`,
                    ...(isPositive
                      ? { left: "50%" }
                      : { right: "50%" }),
                  }}
                />
              </div>
              <span
                className={cn(
                  "w-14 shrink-0 text-right font-financial text-[12px]",
                  isPositive ? "text-up" : "text-down"
                )}
              >
                {isPositive ? "+" : ""}{pct.toFixed(2)}%
              </span>
            </div>
          );

          if (etf) {
            return (
              <Link key={sector.sector} href={`/stock/${etf}`} className="block hover:bg-elevated">
                {content}
              </Link>
            );
          }

          return <div key={sector.sector}>{content}</div>;
        })}
      </div>
    </div>
  );
}
