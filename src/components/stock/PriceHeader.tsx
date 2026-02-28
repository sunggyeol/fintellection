"use client";

import { Eye, EyeOff } from "lucide-react";
import { PriceChange } from "@/components/common/PriceChange";
import { formatPrice, formatMarketCap, formatVolume } from "@/lib/utils";
import { useWatchlist } from "@/hooks/useWatchlist";
import type { StockQuote } from "@/types/financial";

interface PriceHeaderProps {
  quote: StockQuote;
}

export function PriceHeader({ quote }: PriceHeaderProps) {
  const { watchlist, add, remove } = useWatchlist();
  const isWatched = watchlist?.symbols.includes(quote.symbol) ?? false;
  const isIndex = quote.symbol?.startsWith("^") ?? false;

  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold text-foreground">
          {isIndex && quote.name ? quote.name : quote.symbol}
        </h1>
        {(!isIndex || !quote.name) && (
          <span className="max-w-full truncate text-[13px] text-muted-foreground sm:max-w-none">
            {quote.name}
          </span>
        )}
        {quote.exchange && (
          <span className="text-[11px] text-muted-foreground">
            {quote.exchange}
          </span>
        )}
        <button
          onClick={() => isWatched ? remove(quote.symbol) : add(quote.symbol)}
          className="ml-0 flex items-center gap-1 border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground sm:ml-1"
        >
          {isWatched ? (
            <>
              <Eye className="size-3 text-primary" />
              Watching
            </>
          ) : (
            <>
              <EyeOff className="size-3" />
              Watch
            </>
          )}
        </button>
      </div>

      <div className="mt-1.5 flex flex-wrap items-baseline gap-2 sm:gap-3">
        <span className="font-financial text-[22px] font-medium text-foreground sm:text-[28px]">
          {formatPrice(quote.price)}
        </span>
        <span className="text-[13px] text-muted-foreground">USD</span>
        <PriceChange
          change={quote.change}
          changePct={quote.changePct}
          showAbsolute
          size="md"
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-0.5 text-[11px] text-muted-foreground">
        {!isIndex && quote.volume > 0 && (
          <span>
            Vol{" "}
            <span className="font-financial text-foreground">
              {formatVolume(quote.volume)}
            </span>
          </span>
        )}
        {!isIndex && quote.marketCap > 0 && (
          <span>
            Mkt Cap{" "}
            <span className="font-financial text-foreground">
              {formatMarketCap(quote.marketCap)}
            </span>
          </span>
        )}
        {quote.peRatio && (
          <span>
            P/E{" "}
            <span className="font-financial text-foreground">
              {quote.peRatio.toFixed(2)}
            </span>
          </span>
        )}
        <span>
          52W{" "}
          <span className="font-financial text-foreground">
            {formatPrice(quote.week52Low)} – {formatPrice(quote.week52High)}
          </span>
        </span>
      </div>
    </div>
  );
}
