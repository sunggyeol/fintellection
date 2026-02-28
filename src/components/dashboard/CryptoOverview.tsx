"use client";

import Link from "next/link";
import { cn, formatPrice, formatPercent, getPriceColorClass } from "@/lib/utils";
import type { CryptoQuote } from "@/types/financial";

interface CryptoOverviewProps {
  cryptos: CryptoQuote[];
  loading?: boolean;
}

function formatTicker(symbol: string): string {
  return symbol.replace("USD", "");
}

export function CryptoOverview({ cryptos, loading }: CryptoOverviewProps) {
  if (loading) {
    return (
      <div className="border border-border bg-card">
        <div className="border-b border-border px-3 py-2">
          <span className="text-[13px] font-medium text-foreground">Crypto</span>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-[68px] animate-shimmer bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (!cryptos.length) return null;

  return (
    <div className="border border-border bg-card">
      <div className="border-b border-border px-3 py-2">
        <span className="text-[13px] font-medium text-foreground">Crypto</span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-5">
        {cryptos.map((crypto) => {
          const colorClass = getPriceColorClass(crypto.changePct);
          return (
            <Link
              key={crypto.symbol}
              href={`/stock/${encodeURIComponent(crypto.symbol)}`}
              className="bg-card px-3 py-2.5 transition-colors hover:bg-elevated"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-foreground">
                  {formatTicker(crypto.symbol)}
                </span>
                <span className={cn("font-financial text-[10px]", colorClass)}>
                  {formatPercent(crypto.changePct)}
                </span>
              </div>
              <div className="mt-1 font-financial text-[14px] font-medium text-foreground">
                {formatPrice(crypto.price)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
