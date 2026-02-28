"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { cn, formatPrice, formatPercent, getPriceColorClass } from "@/lib/utils";
import type { StockQuote } from "@/types/financial";

export function WatchlistDashboardWidget() {
  const { watchlist, loading: wlLoading, remove } = useWatchlist();
  const [quotes, setQuotes] = useState<Map<string, StockQuote>>(new Map());

  useEffect(() => {
    if (!watchlist?.symbols.length) return;

    fetch(`/api/quotes?symbols=${watchlist.symbols.join(",")}`)
      .then((r) => r.json())
      .then((data: Record<string, StockQuote>) => {
        const map = new Map<string, StockQuote>();
        Object.entries(data).forEach(([sym, q]) => map.set(sym, q));
        setQuotes(map);
      })
      .catch(() => setQuotes(new Map()));
  }, [watchlist?.symbols]);

  if (wlLoading) {
    return (
      <div className="border border-border bg-card">
        <div className="p-3 space-y-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-shimmer h-7" />
          ))}
        </div>
      </div>
    );
  }

  const symbols = watchlist?.symbols ?? [];

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Eye className="size-3 text-muted-foreground" />
          <span className="text-[13px] font-medium text-foreground">
            {watchlist?.name ?? "Watchlist"}
          </span>
        </div>
        <Link
          href="/dashboard/watchlists"
          className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          {symbols.length} stocks &rsaquo;
        </Link>
      </div>

      {symbols.length === 0 ? (
        <div className="px-3 py-5 text-center text-[13px] text-muted-foreground">
          Press{" "}
          <kbd className="bg-elevated px-1 py-0.5 font-mono text-[10px] text-foreground">
            ⌘K
          </kbd>{" "}
          to search and add stocks
        </div>
      ) : (
        <div className="py-0.5">
          {symbols.map((symbol) => {
            const quote = quotes.get(symbol);
            const colorClass = getPriceColorClass(quote?.changePct ?? 0);

            return (
              <div key={symbol} className="group flex min-w-0 items-center">
                <Link
                  href={`/stock/${symbol}`}
                  className="flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5 transition-colors hover:bg-elevated sm:gap-3"
                >
                  <span className="w-12 shrink-0 text-[12px] font-medium text-foreground sm:w-14 sm:text-[13px]">
                    {symbol}
                  </span>
                  <span className="flex-1" />
                  {quote ? (
                    <>
                      <span className="font-financial text-[12px] text-foreground sm:text-[13px]">
                        {formatPrice(quote.price)}
                        <span className="ml-0.5 hidden text-[10px] text-muted-foreground sm:inline">
                          USD
                        </span>
                      </span>
                      <span
                        className={cn(
                          "ml-2 w-12 text-right font-financial text-[12px] sm:ml-3 sm:w-14 sm:text-[13px]",
                          colorClass
                        )}
                      >
                        {formatPercent(quote.changePct)}
                      </span>
                    </>
                  ) : (
                    <div className="h-5 w-20 animate-shimmer" />
                  )}
                </Link>
                <button
                  onClick={() => remove(symbol)}
                  className="mr-1.5 p-0.5 opacity-100 transition-opacity hover:bg-destructive/10 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <X className="size-3 text-muted-foreground" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
