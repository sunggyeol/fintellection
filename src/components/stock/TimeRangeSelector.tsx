"use client";

import { cn } from "@/lib/utils";
import type { TimeRange } from "@/types/financial";

const ranges: TimeRange[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y", "MAX"];

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-1">
      {ranges.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={cn(
            "px-2 py-1 text-xs font-medium transition-colors",
            value === range
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {range}
        </button>
      ))}
    </div>
  );
}
