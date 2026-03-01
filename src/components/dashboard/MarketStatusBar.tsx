"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// ── Exchange definitions ─────────────────────────────────────

interface Exchange {
  name: string;
  abbr: string;
  timezone: string;
  /** [openHour, openMin, closeHour, closeMin] */
  hours: [number, number, number, number];
  /** Days the exchange is open (1=Mon … 5=Fri) */
  days?: number[];
}

const EXCHANGES: Exchange[] = [
  { name: "Korea KOSPI", abbr: "KOSPI", timezone: "Asia/Seoul",          hours: [9, 0, 15, 30] },
  { name: "Korea KOSDAQ",abbr: "KOSDAQ",timezone: "Asia/Seoul",          hours: [9, 0, 15, 30] },
  { name: "NYSE",      abbr: "NYSE",    timezone: "America/New_York",    hours: [9, 30, 16, 0] },
  { name: "NASDAQ",    abbr: "NSDQ",    timezone: "America/New_York",    hours: [9, 30, 16, 0] },
  { name: "London",    abbr: "LSE",     timezone: "Europe/London",       hours: [8, 0, 16, 30] },
  { name: "Euronext",  abbr: "ENX",     timezone: "Europe/Paris",        hours: [9, 0, 17, 30] },
  { name: "Frankfurt", abbr: "FRA",     timezone: "Europe/Berlin",       hours: [8, 0, 22, 0] },
  { name: "Tokyo",     abbr: "TSE",     timezone: "Asia/Tokyo",          hours: [9, 0, 15, 0] },
  { name: "Hong Kong", abbr: "HKEX",    timezone: "Asia/Hong_Kong",      hours: [9, 30, 16, 0] },
  { name: "Shanghai",  abbr: "SSE",     timezone: "Asia/Shanghai",       hours: [9, 30, 15, 0] },
  { name: "Sydney",    abbr: "ASX",     timezone: "Australia/Sydney",    hours: [10, 0, 16, 0] },
  { name: "Toronto",   abbr: "TSX",     timezone: "America/Toronto",     hours: [9, 30, 16, 0] },
  { name: "Mumbai",    abbr: "BSE",     timezone: "Asia/Kolkata",        hours: [9, 15, 15, 30] },
];

function isExchangeOpen(ex: Exchange, now: Date): boolean {
  const local = new Date(now.toLocaleString("en-US", { timeZone: ex.timezone }));
  const day = local.getDay();
  const days = ex.days ?? [1, 2, 3, 4, 5];
  if (!days.includes(day)) return false;

  const totalMin = local.getHours() * 60 + local.getMinutes();
  const openMin = ex.hours[0] * 60 + ex.hours[1];
  const closeMin = ex.hours[2] * 60 + ex.hours[3];
  return totalMin >= openMin && totalMin < closeMin;
}

function formatTime(now: Date, tz: string): string {
  return now.toLocaleTimeString("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

// ── Component ────────────────────────────────────────────────

export function MarketStatusBar() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date()); // hydration-safe: only set on client
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Show placeholder until client mounts to avoid hydration mismatch
  if (!now) {
    return (
      <div className="flex h-[33px] items-center border-b border-border bg-card">
        <div className="flex shrink-0 items-center gap-3 border-r border-border px-3 py-1.5">
          <div className="h-3 w-24 animate-shimmer" />
          <div className="h-3 w-px bg-border" />
          <div className="h-3 w-24 animate-shimmer" />
        </div>
        <div className="min-w-0 flex-1" />
      </div>
    );
  }

  const localTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const etTime = formatTime(now, "America/New_York");

  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop()?.replace("_", " ") ?? "Local";

  const exchangeStatuses = EXCHANGES.map((ex) => ({
    ...ex,
    open: isExchangeOpen(ex, now),
  }));

  // Duplicate content for seamless loop
  const tickerContent = (
    <>
      {exchangeStatuses.map((ex) => (
        <span key={ex.abbr} className="inline-flex shrink-0 items-center gap-1.5 px-3">
          <span
            className={cn(
              "inline-block size-1.5",
              ex.open ? "bg-up" : "bg-muted-foreground/40"
            )}
            style={{ borderRadius: "50%" }}
          />
          <span className={cn(
            "text-[11px]",
            ex.open ? "font-medium text-foreground" : "text-muted-foreground"
          )}>
            {ex.abbr}
          </span>
          <span className={cn(
            "text-[10px]",
            ex.open ? "text-up" : "text-muted-foreground/60"
          )}>
            {ex.open ? "Open" : "Closed"}
          </span>
        </span>
      ))}
    </>
  );

  return (
    <div className="flex items-center border-b border-border bg-card">
      {/* Fixed left: clocks */}
      <div className="flex shrink-0 items-center gap-3 border-r border-border px-3 py-1.5">
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="text-[10px] text-muted-foreground">{localTz}</span>
          <span className="font-financial text-[11px] text-foreground">{localTime}</span>
        </div>
        <div className="hidden h-3 w-px bg-border sm:block" />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">New York</span>
          <span className="font-financial text-[11px] text-foreground">{etTime}</span>
        </div>
      </div>

      {/* Scrolling exchange ticker */}
      <div className="relative min-w-0 flex-1 overflow-hidden py-1.5">
        <div className="animate-ticker flex w-max">
          {tickerContent}
          {/* Duplicate for seamless loop */}
          {tickerContent}
        </div>
      </div>
    </div>
  );
}
