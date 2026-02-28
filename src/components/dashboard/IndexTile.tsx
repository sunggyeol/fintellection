"use client";

import Link from "next/link";
import { Sparkline } from "@/components/common/Sparkline";
import { cn, formatPrice, formatPercent, getPriceColorClass } from "@/lib/utils";
import type { IndexData } from "@/types/financial";

interface IndexTileProps {
  data: IndexData;
}

export function IndexTile({ data }: IndexTileProps) {
  const colorClass = getPriceColorClass(data.changePct);
  const href = `/stock/${encodeURIComponent(data.symbol)}`;

  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {data.name}
        </span>
        {data.sparkline.length > 1 && (
          <Sparkline
            data={data.sparkline}
            width={56}
            height={20}
            positive={data.changePct >= 0}
          />
        )}
      </div>
      <div className="mt-1">
        <span className="font-financial text-[15px] font-medium text-foreground">
          {formatPrice(data.value)}
        </span>
      </div>
      <div className={cn("font-financial text-[11px]", colorClass)}>
        {data.change >= 0 ? "+" : ""}
        {formatPrice(Math.abs(data.change))}{" "}
        ({formatPercent(data.changePct)})
      </div>
    </>
  );

  return (
    <Link
      href={href}
      className="block border border-border bg-card px-3 py-2.5 transition-colors hover:bg-elevated"
    >
      {content}
    </Link>
  );
}
