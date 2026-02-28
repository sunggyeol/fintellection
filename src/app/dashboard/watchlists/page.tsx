"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import {
  cn,
  formatPrice,
  formatPercent,
  getPriceColorClass,
} from "@/lib/utils";
import type { StockQuote, SearchResult } from "@/types/financial";

export default function WatchlistsPage() {
  const { watchlist, loading: wlLoading, add, remove } = useWatchlist();
  const [quotes, setQuotes] = useState<Map<string, StockQuote>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const symbols = useMemo(() => watchlist?.symbols ?? [], [watchlist?.symbols]);

  // Fetch quotes for watchlist symbols (single batch request)
  useEffect(() => {
    if (!symbols.length) return;

    fetch(`/api/quotes?symbols=${symbols.join(",")}`)
      .then((r) => r.json())
      .then((data: Record<string, StockQuote>) => {
        const map = new Map<string, StockQuote>();
        Object.entries(data).forEach(([sym, q]) => map.set(sym, q));
        setQuotes(map);
      })
      .catch(() => setQuotes(new Map()));
  }, [symbols]);

  // Debounced search
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) setSearchResults(await res.json());
      } catch {
        /* ignore */
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const handleAdd = async (symbol: string) => {
    await add(symbol);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus();
  }, [showSearch]);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-foreground">Watchlists</h1>
          <p className="text-sm text-muted-foreground">
            {symbols.length} stock{symbols.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="flex shrink-0 items-center gap-1.5 border border-border px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-elevated"
        >
          <Plus className="size-3" />
          Add Stock
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="relative mb-4">
          <div className="flex items-center gap-2 border border-border bg-card px-3 py-2">
            {searching ? (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            ) : (
              <Search className="size-3.5 text-muted-foreground" />
            )}
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by symbol or name..."
              className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute inset-x-0 top-full z-10 max-h-64 overflow-y-auto border border-t-0 border-border bg-card shadow-lg">
              {searchResults.map((result) => {
                const alreadyAdded = symbols.includes(result.symbol);
                return (
                  <button
                    key={result.symbol}
                    onClick={() => !alreadyAdded && handleAdd(result.symbol)}
                    disabled={alreadyAdded}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                      alreadyAdded
                        ? "opacity-50 cursor-default"
                        : "hover:bg-elevated"
                    )}
                  >
                    <span className="w-16 shrink-0 text-[13px] font-medium text-foreground">
                      {result.symbol}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
                      {result.name}
                    </span>
                    {alreadyAdded ? (
                      <span className="text-[11px] text-muted-foreground">
                        Added
                      </span>
                    ) : (
                      <Plus className="size-3.5 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Watchlist table */}
      {wlLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-shimmer border border-border" />
          ))}
        </div>
      ) : symbols.length === 0 ? (
        <div className="border border-border bg-card px-6 py-12 text-center">
          <p className="mb-1 text-sm text-muted-foreground">
            No stocks in your watchlist yet.
          </p>
          <p className="text-xs text-muted-foreground">
            Click &ldquo;Add Stock&rdquo; above or press{" "}
            <kbd className="bg-elevated px-1 py-0.5 font-mono text-[10px] text-foreground">
              ⌘K
            </kbd>{" "}
            to search.
          </p>
        </div>
      ) : (
        <div className="border border-border bg-card">
          {/* Mobile layout */}
          <div className="md:hidden">
            {symbols.map((symbol) => {
              const quote = quotes.get(symbol);
              const colorClass = getPriceColorClass(quote?.changePct ?? 0);

              return (
                <div
                  key={symbol}
                  className="group flex items-stretch border-b border-border last:border-b-0"
                >
                  <Link
                    href={`/stock/${symbol}`}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-elevated"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-foreground">
                        {symbol}
                      </p>
                      <p className="truncate text-[13px] text-muted-foreground">
                        {quote?.name ?? "—"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-financial text-[15px] text-foreground">
                        {quote ? formatPrice(quote.price) : "—"}
                      </p>
                      <p className={cn("font-financial text-[13px]", colorClass)}>
                        {quote ? formatPercent(quote.changePct) : "—"}
                      </p>
                    </div>
                  </Link>

                  <button
                    onClick={() => remove(symbol)}
                    className="flex shrink-0 items-center px-3 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            {/* Table header */}
            <div className="flex items-center border-b border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
              <span className="w-20">Symbol</span>
              <span className="flex-1">Name</span>
              <span className="w-24 text-right">Price</span>
              <span className="w-20 text-right">Change</span>
              <span className="w-8" />
            </div>

            {/* Rows */}
            {symbols.map((symbol) => {
              const quote = quotes.get(symbol);
              const colorClass = getPriceColorClass(quote?.changePct ?? 0);

              return (
                <div
                  key={symbol}
                  className="group flex items-center border-b border-border last:border-b-0"
                >
                  <Link
                    href={`/stock/${symbol}`}
                    className="flex flex-1 items-center px-3 py-2 transition-colors hover:bg-elevated"
                  >
                    <span className="w-20 shrink-0 text-[13px] font-medium text-foreground">
                      {symbol}
                    </span>
                    <span className="flex-1 truncate text-[13px] text-muted-foreground">
                      {quote?.name ?? "—"}
                    </span>
                    <span className="w-24 text-right font-financial text-[13px] text-foreground">
                      {quote ? formatPrice(quote.price) : "—"}
                    </span>
                    <span
                      className={cn(
                        "w-20 text-right font-financial text-[13px]",
                        colorClass
                      )}
                    >
                      {quote ? formatPercent(quote.changePct) : "—"}
                    </span>
                  </Link>
                  <button
                    onClick={() => remove(symbol)}
                    className="mr-2 p-1 opacity-100 transition-opacity hover:bg-destructive/10 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <X className="size-3 text-muted-foreground" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
