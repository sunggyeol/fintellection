"use client";

import { cn, formatPercent, formatPrice, getPriceColorClass } from "@/lib/utils";

interface PriceChangeProps {
  change?: number;
  changePct: number;
  showAbsolute?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceChange({
  change,
  changePct,
  showAbsolute = false,
  size = "md",
  className,
}: PriceChangeProps) {
  const colorClass = getPriceColorClass(changePct);

  const textSize = {
    sm: "text-[11px]",
    md: "text-[13px]",
    lg: "text-sm",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-financial",
        colorClass,
        textSize,
        className
      )}
    >
      {showAbsolute && change != null && (
        <span>
          {change >= 0 ? "+" : ""}
          {formatPrice(Math.abs(change))}
        </span>
      )}
      <span>{formatPercent(changePct)}</span>
    </span>
  );
}
