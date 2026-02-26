"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Plus, Check } from "lucide-react";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useWatchlist } from "@/hooks/useWatchlist";

export function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { isOpen, query, setQuery, results, loading, close } =
    useGlobalSearch();
  const { watchlist, add } = useWatchlist();

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  const watchedSymbols = watchlist?.symbols ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={close}
      />

      {/* Search modal */}
      <div className="relative w-full max-w-md border border-border bg-surface shadow-2xl">
        {/* Input */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          {loading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <Search className="size-4 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol or name..."
            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
            autoComplete="off"
          />
          <kbd className="bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-72 overflow-y-auto py-0.5">
            {results.map((result) => {
              const isWatched = watchedSymbols.includes(result.symbol);
              return (
                <div
                  key={result.symbol}
                  className="flex items-center hover:bg-elevated"
                >
                  <button
                    onClick={() => {
                      router.push(`/stock/${result.symbol}`);
                      close();
                    }}
                    className="flex flex-1 items-center gap-3 px-3 py-1.5 text-left transition-colors"
                  >
                    <span className="w-16 shrink-0 text-[13px] font-medium text-foreground">
                      {result.symbol}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
                      {result.name}
                    </span>
                    {result.type && (
                      <span className="text-[11px] text-muted-foreground">
                        {result.type}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isWatched) add(result.symbol);
                    }}
                    className="mr-2 flex size-6 items-center justify-center text-muted-foreground transition-colors hover:text-primary"
                    title={isWatched ? "In watchlist" : "Add to watchlist"}
                  >
                    {isWatched ? (
                      <Check className="size-3.5 text-primary" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {query && !loading && results.length === 0 && (
          <div className="px-3 py-5 text-center text-[13px] text-muted-foreground">
            No results for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
