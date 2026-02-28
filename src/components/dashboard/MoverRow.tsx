"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { cn, formatPrice, formatPercent, getPriceColorClass } from "@/lib/utils";
import type { MarketMover } from "@/types/financial";

interface MoverRowProps {
  mover: MarketMover;
}

export function MoverRow({ mover }: MoverRowProps) {
  const colorClass = getPriceColorClass(mover.changePct);
  const [hover, setHover] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLAnchorElement>(null);

  function handleEnter() {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ x: rect.left, y: rect.top - 4 });
    }
    setHover(true);
  }

  return (
    <>
      <Link
        ref={ref}
        href={`/stock/${mover.symbol}`}
        className="flex min-w-0 items-center gap-2 px-3 py-1.5 transition-colors hover:bg-elevated sm:gap-3"
        onMouseEnter={handleEnter}
        onMouseLeave={() => setHover(false)}
      >
        {/* Company name (truncated) */}
        <span className="min-w-0 flex-1 truncate text-[11px] text-foreground sm:text-[13px]">
          {mover.name}
        </span>

        {/* Price */}
        <span className="w-14 shrink-0 text-right font-financial text-[11px] text-foreground sm:w-20 sm:text-[13px]">
          {formatPrice(mover.price)}
          <span className="ml-0.5 hidden text-[10px] text-muted-foreground sm:inline">
            USD
          </span>
        </span>

        {/* Change % */}
        <span
          className={cn(
            "w-12 shrink-0 text-right font-financial text-[11px] sm:w-16 sm:text-[13px]",
            colorClass
          )}
        >
          {formatPercent(mover.changePct)}
        </span>
      </Link>

      {/* Fixed-position tooltip — escapes any overflow:hidden */}
      {hover && (
        <div
          className="pointer-events-none fixed z-[9999] max-w-[280px] border border-border bg-card px-2 py-1 text-[11px] text-foreground shadow-md"
          style={{ left: pos.x, top: pos.y, transform: "translateY(-100%)" }}
        >
          <span className="font-medium">{mover.symbol}</span>
          <span className="mx-1 text-muted-foreground">&middot;</span>
          {mover.name}
        </div>
      )}
    </>
  );
}
