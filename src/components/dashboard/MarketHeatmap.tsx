"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn, formatPercent } from "@/lib/utils";
import type { MarketMover } from "@/types/financial";

// Approximate market cap weights (billions) for treemap sizing
const WEIGHTS: Record<string, number> = {
  AAPL: 35, MSFT: 32, NVDA: 30, GOOGL: 22, AMZN: 21,
  META: 16, TSLA: 12, JPM: 7, V: 6, UNH: 5,
  HD: 4, PG: 4, CRM: 3, NFLX: 3, PLTR: 3,
  AMD: 2, ADBE: 2, DIS: 2, BA: 1.5, UBER: 1.5,
  NKE: 1, PYPL: 1, COIN: 1, ABNB: 1, ROKU: 0.7,
  SOFI: 0.7, SNAP: 0.5, RIVN: 0.5, HOOD: 0.5, INTC: 1,
};

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TreemapCell extends Rect {
  item: MarketMover & { weight: number };
}

// ── Treemap layout (recursive binary partition) ──────────────
function partition(
  items: (MarketMover & { weight: number })[],
  rect: Rect,
  totalWeight: number
): TreemapCell[] {
  if (items.length === 0) return [];
  if (items.length === 1) return [{ ...rect, item: items[0] }];

  const halfWeight = totalWeight / 2;
  let running = 0;
  let splitIdx = 1;

  for (let i = 0; i < items.length; i++) {
    running += items[i].weight;
    if (running >= halfWeight) {
      splitIdx = i + 1;
      break;
    }
  }
  splitIdx = Math.max(1, Math.min(items.length - 1, splitIdx));

  const left = items.slice(0, splitIdx);
  const right = items.slice(splitIdx);
  const leftW = left.reduce((s, i) => s + i.weight, 0);
  const rightW = right.reduce((s, i) => s + i.weight, 0);
  const ratio = leftW / totalWeight;

  let lr: Rect, rr: Rect;
  if (rect.w >= rect.h) {
    lr = { x: rect.x, y: rect.y, w: rect.w * ratio, h: rect.h };
    rr = { x: rect.x + rect.w * ratio, y: rect.y, w: rect.w * (1 - ratio), h: rect.h };
  } else {
    lr = { x: rect.x, y: rect.y, w: rect.w, h: rect.h * ratio };
    rr = { x: rect.x, y: rect.y + rect.h * ratio, w: rect.w, h: rect.h * (1 - ratio) };
  }

  return [
    ...partition(left, lr, leftW),
    ...partition(right, rr, rightW),
  ];
}

// ── Color mapping ────────────────────────────────────────────
function getHeatColor(pct: number): string {
  const clamped = Math.max(-5, Math.min(5, pct));
  const t = Math.abs(clamped) / 5; // 0→1 intensity

  if (pct >= 0) {
    // Green: from muted sage to vivid green
    const r = Math.round(22 + (1 - t) * 50);
    const g = Math.round(100 + t * 63);
    const b = Math.round(40 + (1 - t) * 40);
    const a = 0.25 + t * 0.65;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  } else {
    // Red: from muted to vivid crimson
    const r = Math.round(180 + t * 40);
    const g = Math.round(50 - t * 20);
    const b = Math.round(50 - t * 15);
    const a = 0.25 + t * 0.65;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
}

function getTextColor(pct: number): string {
  const intensity = Math.abs(pct);
  return intensity > 2 ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.8)";
}

// ── Component ────────────────────────────────────────────────
export function MarketHeatmap() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [stocks, setStocks] = useState<MarketMover[]>([]);
  const [cells, setCells] = useState<TreemapCell[]>([]);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [loading, setLoading] = useState(true);
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    fetch("/api/market-overview")
      .then((r) => r.json())
      .then((d) => setStocks(d.all ?? []))
      .catch(() => setStocks([]))
      .finally(() => setLoading(false));
  }, []);

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDims({ w: width, h: Math.max(360, width * 0.55) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Compute treemap layout
  const computeLayout = useCallback(() => {
    if (!stocks.length || dims.w === 0) return;

    const weighted = stocks
      .map((s) => ({ ...s, weight: WEIGHTS[s.symbol] ?? 0.5 }))
      .sort((a, b) => b.weight - a.weight);

    const totalWeight = weighted.reduce((s, i) => s + i.weight, 0);
    const gap = 2; // gap in pixels
    const result = partition(weighted, { x: 0, y: 0, w: dims.w, h: dims.h }, totalWeight);

    // Apply gap
    const gapped = result.map((c) => ({
      ...c,
      x: c.x + gap / 2,
      y: c.y + gap / 2,
      w: c.w - gap,
      h: c.h - gap,
    }));

    setCells(gapped);
  }, [stocks, dims]);

  useEffect(() => {
    computeLayout();
  }, [computeLayout]);

  if (loading) {
    return (
      <div ref={containerRef} className="border border-border bg-card">
        <div className="flex h-[360px] items-center justify-center">
          <div className="text-[13px] text-muted-foreground">Loading market data...</div>
        </div>
      </div>
    );
  }

  if (!stocks.length) {
    return (
      <div ref={containerRef} className="border border-border bg-card py-8 text-center text-[13px] text-muted-foreground">
        Market data unavailable
      </div>
    );
  }

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[13px] font-medium text-foreground">
          Market Overview
        </span>
        <span className="text-[11px] text-muted-foreground">
          {stocks.length} stocks &middot; sized by market cap
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ height: dims.h || 360 }}
      >
        {cells.map((cell) => {
          const isHovered = hoveredSymbol === cell.item.symbol;
          const isSmall = cell.w < 60 || cell.h < 45;
          const isTiny = cell.w < 40 || cell.h < 30;

          return (
            <button
              key={cell.item.symbol}
              onClick={() => router.push(`/stock/${cell.item.symbol}`)}
              onMouseEnter={() => setHoveredSymbol(cell.item.symbol)}
              onMouseLeave={() => setHoveredSymbol(null)}
              className={cn(
                "absolute flex flex-col items-center justify-center overflow-hidden transition-all duration-150",
                isHovered ? "z-10 brightness-110" : "brightness-100"
              )}
              style={{
                left: cell.x,
                top: cell.y,
                width: cell.w,
                height: cell.h,
                backgroundColor: getHeatColor(cell.item.changePct),
                color: getTextColor(cell.item.changePct),
              }}
            >
              {!isTiny && (
                <>
                  <span
                    className={cn(
                      "font-semibold leading-tight",
                      isSmall ? "text-[10px]" : "text-[13px]"
                    )}
                  >
                    {cell.item.symbol}
                  </span>
                  <span
                    className={cn(
                      "font-financial leading-tight opacity-90",
                      isSmall ? "text-[9px]" : "text-[12px]"
                    )}
                  >
                    {cell.item.changePct >= 0 ? "+" : ""}
                    {formatPercent(cell.item.changePct)}
                  </span>
                </>
              )}

              {/* Hover tooltip */}
              {isHovered && (
                <span className="absolute bottom-0.5 text-[9px] leading-tight opacity-75">
                  {cell.item.name}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
