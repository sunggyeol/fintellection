"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { cn, formatPercent, formatPrice, formatMarketCap } from "@/lib/utils";
import nasdaq100Data from "@/lib/data/nasdaq100.json";

interface HeatmapQuote {
  price: number;
  changePct: number;
  marketCap: number;
}

interface Nasdaq100HeatmapProps {
  quotes: Record<string, HeatmapQuote>;
  loading?: boolean;
}

interface StockNode {
  symbol: string;
  name: string;
  sector: string;
  weight: number;
  price: number;
  changePct: number;
  marketCap: number;
}

interface SectorNode {
  sector: string;
  children: StockNode[];
}

interface HierarchyData {
  name: string;
  children: SectorNode[];
}

function getHeatColor(pct: number): string {
  const clamped = Math.max(-3, Math.min(3, pct));
  const t = Math.abs(clamped) / 3;

  if (clamped >= 0) {
    const r = Math.round(20 + (1 - t) * 30);
    const g = Math.round(80 + t * 80);
    const b = Math.round(40 + (1 - t) * 30);
    const a = 0.3 + t * 0.6;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  } else {
    const r = Math.round(160 + t * 60);
    const g = Math.round(45 - t * 20);
    const b = Math.round(45 - t * 15);
    const a = 0.3 + t * 0.6;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
}

export function Nasdaq100Heatmap({ quotes, loading }: Nasdaq100HeatmapProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDims({ w: width, h: Math.max(400, width * 0.52) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Build treemap layout
  const cells = useMemo(() => {
    if (dims.w === 0 || !Object.keys(quotes).length) return [];

    // Group stocks by sector
    const sectorMap = new Map<string, StockNode[]>();
    for (const stock of nasdaq100Data) {
      const q = quotes[stock.symbol];
      const node: StockNode = {
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        weight: stock.weight,
        price: q?.price ?? 0,
        changePct: q?.changePct ?? 0,
        marketCap: q?.marketCap ?? 0,
      };
      const existing = sectorMap.get(stock.sector) ?? [];
      existing.push(node);
      sectorMap.set(stock.sector, existing);
    }

    const hierarchyData: HierarchyData = {
      name: "root",
      children: Array.from(sectorMap.entries()).map(([sector, children]) => ({
        sector,
        children,
      })),
    };

    const root = hierarchy<HierarchyData | SectorNode | StockNode>(hierarchyData)
      .sum((d) => ("weight" in d ? d.weight : 0))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const layout = treemap<HierarchyData | SectorNode | StockNode>()
      .size([dims.w, dims.h])
      .tile(treemapSquarify)
      .paddingOuter(1)
      .paddingTop(14) // space for sector labels
      .paddingInner(1);

    layout(root);

    return { leaves: root.leaves(), sectorNodes: root.children ?? [] };
  }, [quotes, dims]);

  if (loading) {
    return (
      <div className="border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-[13px] font-medium text-foreground">NASDAQ 100</span>
        </div>
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-[13px] text-muted-foreground">Loading heatmap...</div>
        </div>
      </div>
    );
  }

  const hasData = cells && "leaves" in cells && cells.leaves.length > 0;

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[13px] font-medium text-foreground">NASDAQ 100</span>
        <span className="text-[11px] text-muted-foreground">
          {nasdaq100Data.length} stocks &middot; sized by index weight
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ height: dims.h || 400 }}
      >
        {/* Sector labels */}
        {hasData && cells.sectorNodes.map((sectorNode) => {
          const d = sectorNode as unknown as { x0: number; y0: number; x1: number };
          const sectorData = sectorNode.data as SectorNode;
          return (
            <span
              key={sectorData.sector}
              className="pointer-events-none absolute z-10 truncate px-1 text-[9px] font-semibold uppercase tracking-wider text-white/60"
              style={{
                left: d.x0 + 2,
                top: d.y0 + 1,
                maxWidth: d.x1 - d.x0 - 4,
              }}
            >
              {sectorData.sector}
            </span>
          );
        })}

        {/* Stock cells */}
        {hasData && cells.leaves.map((leaf) => {
          const d = leaf as unknown as { x0: number; y0: number; x1: number; y1: number };
          const stock = leaf.data as StockNode;
          const w = d.x1 - d.x0;
          const h = d.y1 - d.y0;
          const isHovered = hoveredSymbol === stock.symbol;
          const isSmall = w < 55 || h < 40;
          const isTiny = w < 35 || h < 25;

          return (
            <button
              key={stock.symbol}
              onClick={() => router.push(`/stock/${stock.symbol}`)}
              onMouseEnter={() => setHoveredSymbol(stock.symbol)}
              onMouseLeave={() => setHoveredSymbol(null)}
              className={cn(
                "absolute flex flex-col items-center justify-center overflow-hidden transition-all duration-100",
                isHovered ? "z-20 brightness-125" : ""
              )}
              style={{
                left: d.x0,
                top: d.y0,
                width: w,
                height: h,
                backgroundColor: getHeatColor(stock.changePct),
              }}
            >
              {!isTiny && (
                <>
                  <span className={cn(
                    "font-semibold leading-tight text-white",
                    isSmall ? "text-[9px]" : "text-[12px]"
                  )}>
                    {stock.symbol}
                  </span>
                  <span className={cn(
                    "font-financial leading-tight text-white/80",
                    isSmall ? "text-[8px]" : "text-[11px]"
                  )}>
                    {formatPercent(stock.changePct)}
                  </span>
                </>
              )}

              {/* Hover tooltip */}
              {isHovered && (
                <div className="pointer-events-none absolute -bottom-16 left-1/2 z-30 -translate-x-1/2 border border-border bg-card px-2 py-1.5 shadow-lg">
                  <div className="whitespace-nowrap text-[11px] font-medium text-foreground">{stock.name}</div>
                  <div className="flex gap-2 text-[10px] text-muted-foreground">
                    <span>{formatPrice(stock.price)}</span>
                    <span className={stock.changePct >= 0 ? "text-up" : "text-down"}>
                      {formatPercent(stock.changePct)}
                    </span>
                    <span>{formatMarketCap(stock.marketCap)}</span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
