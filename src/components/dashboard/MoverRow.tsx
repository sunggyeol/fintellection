"use client";

import Link from "next/link";
import { cn, formatPrice, formatPercent, getPriceColorClass } from "@/lib/utils";
import type { MarketMover } from "@/types/financial";

interface MoverRowProps {
  mover: MarketMover;
}

export function MoverRow({ mover }: MoverRowProps) {
  const colorClass = getPriceColorClass(mover.changePct);

  return (
    <Link
      href={`/stock/${mover.symbol}`}
      className="flex items-center gap-3 px-3 py-1.5 transition-colors hover:bg-elevated"
    >
      {/* Symbol */}
      <span className="w-16 shrink-0 text-[13px] font-medium text-foreground">
        {mover.symbol}
      </span>

      {/* Name — truncated */}
      <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
        {mover.name}
      </span>

      {/* Price */}
      <span className="w-20 shrink-0 text-right font-financial text-[13px] text-foreground">
        {formatPrice(mover.price)}
        <span className="ml-0.5 text-[10px] text-muted-foreground">USD</span>
      </span>

      {/* Change % */}
      <span
        className={cn(
          "w-16 shrink-0 text-right font-financial text-[13px]",
          colorClass
        )}
      >
        {formatPercent(mover.changePct)}
      </span>
    </Link>
  );
}
