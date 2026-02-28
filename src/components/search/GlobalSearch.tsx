"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useWatchlist } from "@/hooks/useWatchlist";

export function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { isOpen, query, setQuery, results, loading, close } =
    useGlobalSearch();
  const { watchlist, add } = useWatchlist();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && visible) inputRef.current?.focus();
  }, [isOpen, visible]);

  // Reset selection when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  if (!mounted) return null;

  const watchedSymbols = watchlist?.symbols ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-3 pt-[18vh] sm:px-4">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/70 transition-opacity duration-150",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={close}
      />

      {/* Search modal */}
      <div className={cn(
        "relative w-full max-w-md border border-border bg-surface shadow-2xl transition-all duration-150",
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : "-translate-y-2 scale-[0.98] opacity-0"
      )}>
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
            onKeyDown={(e) => {
              if (results.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => {
                  const next = i < results.length - 1 ? i + 1 : 0;
                  listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
                  return next;
                });
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => {
                  const next = i > 0 ? i - 1 : results.length - 1;
                  listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
                  return next;
                });
              } else if (e.key === "Enter" && activeIndex >= 0) {
                e.preventDefault();
                router.push(`/stock/${results[activeIndex].symbol}`);
                close();
              }
            }}
            placeholder="Search symbol or name..."
            className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none sm:text-[13px]"
            autoComplete="off"
          />
          <kbd className="bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div ref={listRef} className="max-h-72 overflow-y-auto py-0.5">
            {results.map((result, index) => {
              const isWatched = watchedSymbols.includes(result.symbol);
              const isActive = index === activeIndex;
              return (
                <div
                  key={result.symbol}
                  className={cn(
                    "flex items-center hover:bg-elevated",
                    isActive && "bg-elevated"
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
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
