"use client";

import { useEffect, useRef, useState } from "react";

/* ── Simulated signal feed ─────────────────────────────────── */
const FEED_LINES = [
  { ts: "09:31:02", action: "BUY", sym: "AAPL", price: "187.42", conf: 94 },
  { ts: "09:31:15", action: "SELL", sym: "TSLA", price: "242.18", conf: 87 },
  { ts: "09:32:44", action: "HOLD", sym: "MSFT", price: "412.33", conf: 91 },
  { ts: "09:33:01", action: "BUY", sym: "NVDA", price: "876.22", conf: 96 },
  { ts: "09:33:18", action: "SELL", sym: "META", price: "523.15", conf: 82 },
  { ts: "09:34:22", action: "BUY", sym: "GOOG", price: "178.93", conf: 89 },
  { ts: "09:35:00", action: "REBAL", sym: "PTFL", price: "—", conf: 100 },
  { ts: "09:35:47", action: "SCAN", sym: "···", price: "847 sigs", conf: 99 },
];

const METRICS = [
  { label: "SIGNALS / DAY", target: 2847 },
  { label: "WIN RATE", target: 73.2, suffix: "%", decimals: 1 },
  { label: "AVG RETURN", target: 12.4, suffix: "%", decimals: 1 },
  { label: "UPTIME", target: 99.97, suffix: "%", decimals: 2 },
];

const CAPABILITIES = [
  { n: "01", title: "Automated Rebalancing", desc: "Portfolio allocation adjusts in real time based on your strategy." },
  { n: "02", title: "Signal Execution", desc: "Entry and exit triggers from technical and fundamental signals." },
  { n: "03", title: "Risk Guardrails", desc: "Position limits, stop losses, and drawdown controls." },
  { n: "04", title: "Performance Analytics", desc: "P&L, Sharpe ratio, and attribution across all trades." },
  { n: "05", title: "24/7 Monitoring", desc: "Continuous market surveillance across equities and crypto." },
  { n: "06", title: "Strategy Builder", desc: "Natural language to trading strategy with backtesting." },
];

/* ── Count-up hook ─────────────────────────────────────────── */
function useCountUp(target: number, duration = 2000, decimals = 0) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let startTime: number | null = null;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Number((eased * target).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration, decimals]);

  return value;
}

/* ── Animated metric cell ──────────────────────────────────── */
function MetricCell({
  label,
  target,
  suffix = "",
  decimals = 0,
}: {
  label: string;
  target: number;
  suffix?: string;
  decimals?: number;
}) {
  const value = useCountUp(target, 2200, decimals);
  return (
    <div className="bg-card p-3 sm:p-4">
      <div className="font-mono text-lg font-semibold text-foreground sm:text-xl">
        {decimals > 0
          ? value.toFixed(decimals)
          : Math.round(value).toLocaleString()}
        <span className="text-primary">{suffix}</span>
      </div>
      <div className="mt-0.5 text-[10px] font-medium tracking-[0.12em] text-muted-foreground sm:text-[11px]">
        {label}
      </div>
    </div>
  );
}

/* ── Signal feed terminal ──────────────────────────────────── */
function SignalFeed() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount < FEED_LINES.length) {
      const timer = setTimeout(
        () => setVisibleCount((v) => v + 1),
        550
      );
      return () => clearTimeout(timer);
    }
    // Pause, then replay
    const timer = setTimeout(() => setVisibleCount(0), 4000);
    return () => clearTimeout(timer);
  }, [visibleCount]);

  return (
    <div className="border border-border bg-card">
      {/* Terminal header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] font-medium tracking-[0.12em] text-muted-foreground">
            SIGNAL FEED
          </span>
          <span className="text-[10px] text-muted-foreground/50">
            v0.1.0-alpha
          </span>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-up">
          <span className="size-1.5 animate-pulse-glow bg-up" />
          LIVE
        </span>
      </div>

      {/* Feed lines */}
      <div className="space-y-0 p-1.5 font-mono text-[11px] sm:p-3 sm:text-[12px]">
        {FEED_LINES.map((line, i) => (
          <div
            key={`${line.ts}-${i}`}
            className="flex items-center gap-1.5 px-1.5 py-[3px] transition-all duration-300 sm:gap-3"
            style={{
              opacity: i < visibleCount ? 1 : 0,
              transform:
                i < visibleCount ? "translateX(0)" : "translateX(-8px)",
            }}
          >
            <span className="w-[52px] shrink-0 text-muted-foreground/60 sm:w-14">
              {line.ts}
            </span>
            <span
              className={`w-9 shrink-0 font-semibold sm:w-11 ${
                line.action === "BUY" || line.action === "REBAL"
                  ? "text-up"
                  : line.action === "SELL"
                    ? "text-down"
                    : "text-muted-foreground"
              }`}
            >
              {line.action}
            </span>
            <span className="w-7 shrink-0 text-foreground sm:w-10">
              {line.sym}
            </span>
            <span className="w-14 shrink-0 text-foreground sm:w-16">
              {line.price}
            </span>
            {/* Confidence bar — hidden on narrow mobile */}
            <div className="hidden items-center gap-2 sm:flex sm:flex-1">
              <div className="h-[3px] flex-1 bg-border">
                <div
                  className="h-full bg-primary/60 transition-all duration-700"
                  style={{
                    width: i < visibleCount ? `${line.conf}%` : "0%",
                  }}
                />
              </div>
              <span className="w-7 text-right text-muted-foreground/60">
                {line.conf}%
              </span>
            </div>
          </div>
        ))}

        {/* Blinking cursor */}
        <div className="flex items-center gap-1 px-1.5 pt-1">
          <span className="text-primary/60">{">"}</span>
          <span
            className="h-3 w-1.5 bg-primary"
            style={{ animation: "cursor-blink 1s step-end infinite" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function TraderPage() {
  return (
    <div className="relative min-h-full overflow-y-auto">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(var(--foreground) 1px, transparent 1px)",
            "linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "40px 40px",
          opacity: 0.025,
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero */}
        <div className="mb-8 sm:mb-10">
          <div className="mb-4 flex items-center gap-2">
            <span className="size-2 animate-pulse-glow bg-up" />
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Coming Soon
            </span>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-foreground sm:text-4xl">
            Agentic Trader
          </h1>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
            Autonomous trading with minimal human intervention. AI that
            monitors, decides, and executes.
          </p>
        </div>

        {/* Metrics strip */}
        <div className="mb-8 grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {METRICS.map((m) => (
            <MetricCell key={m.label} {...m} />
          ))}
        </div>

        {/* Signal Feed */}
        <div className="mb-8 sm:mb-10">
          <SignalFeed />
        </div>

        {/* Capabilities */}
        <div className="mb-8 sm:mb-10">
          <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Capabilities
          </div>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {CAPABILITIES.map((c) => (
              <div key={c.n} className="flex gap-3">
                <span className="mt-0.5 font-mono text-[11px] font-semibold text-primary">
                  {c.n}
                </span>
                <div>
                  <h3 className="text-[13px] font-semibold text-foreground">
                    {c.title}
                  </h3>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {c.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-6">
          <p className="text-[11px] text-muted-foreground">
            Interested in early access? Stay tuned for updates.
          </p>
        </div>
      </div>
    </div>
  );
}
