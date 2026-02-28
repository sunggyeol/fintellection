"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { EarningsEntry } from "@/types/financial";

interface EarningsCalendarProps {
  entries: EarningsEntry[];
  loading?: boolean;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00"); // avoid timezone offset
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function groupByDate(entries: EarningsEntry[]): Map<string, EarningsEntry[]> {
  const groups = new Map<string, EarningsEntry[]>();
  for (const entry of entries) {
    const existing = groups.get(entry.reportDate) ?? [];
    existing.push(entry);
    groups.set(entry.reportDate, existing);
  }
  return groups;
}

export function EarningsCalendar({ entries, loading }: EarningsCalendarProps) {
  if (loading) {
    return (
      <div className="border border-border bg-card">
        <div className="border-b border-border px-3 py-2">
          <span className="text-[13px] font-medium text-foreground">Earnings Calendar</span>
        </div>
        <div className="space-y-1.5 p-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-5 animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="border border-border bg-card">
        <div className="border-b border-border px-3 py-2">
          <span className="text-[13px] font-medium text-foreground">Earnings Calendar</span>
        </div>
        <div className="px-3 py-4 text-center text-[12px] text-muted-foreground">
          No upcoming earnings this week
        </div>
      </div>
    );
  }

  const grouped = groupByDate(entries);

  return (
    <div className="border border-border bg-card">
      <div className="border-b border-border px-3 py-2">
        <span className="text-[13px] font-medium text-foreground">Earnings Calendar</span>
      </div>
      <div className="max-h-[250px] overflow-y-auto sm:max-h-[400px]">
        {Array.from(grouped.entries()).map(([date, dateEntries]) => (
          <div key={date}>
            <div className="bg-elevated px-3 py-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                {formatDate(date)}
              </span>
            </div>
            {dateEntries.map((entry) => (
              <Link
                key={`${entry.symbol}-${entry.reportDate}`}
                href={`/stock/${entry.symbol}`}
                className="flex items-center gap-2 px-3 py-1.5 transition-colors hover:bg-elevated"
              >
                <span className="w-14 shrink-0 text-[12px] font-medium text-foreground">
                  {entry.symbol}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
                  {entry.name !== entry.symbol ? entry.name : ""}
                </span>
                {entry.epsEstimate != null && (
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    Est: ${entry.epsEstimate.toFixed(2)}
                  </span>
                )}
                {entry.time && (
                  <span className={cn(
                    "shrink-0 px-1 py-0.5 text-[9px] font-semibold uppercase",
                    entry.time === "bmo"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {entry.time}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
