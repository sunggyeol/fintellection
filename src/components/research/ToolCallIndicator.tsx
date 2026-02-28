"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, ChevronDown, AlertCircle } from "lucide-react";
import { TOOL_LABELS } from "@/types/research";

interface ToolCallIndicatorProps {
  toolName: string;
  state: string;
  args?: Record<string, unknown>;
  output?: unknown;
}

export function ToolCallIndicator({
  toolName,
  state,
  args,
  output,
}: ToolCallIndicatorProps) {
  const [expanded, setExpanded] = useState(false);
  const label =
    TOOL_LABELS[toolName as keyof typeof TOOL_LABELS] ?? toolName;
  const detail = getToolDetail(toolName, args ?? {});

  // AI SDK v6 states: input-streaming, input-available, output-available, output-error
  const isLoading =
    state === "input-streaming" || state === "input-available" ||
    state === "call" || state === "partial-call"; // v5 compat
  const isError = state === "output-error";
  const hasOutput = state === "output-available" && output != null;

  return (
    <div className="my-1.5">
      <button
        type="button"
        onClick={() => hasOutput && setExpanded(!expanded)}
        disabled={!hasOutput}
        className={[
          "flex w-full min-w-0 items-center gap-2 border-l-2 px-3 py-1.5 text-xs text-muted-foreground transition-colors",
          isLoading
            ? "border-primary/40 bg-primary/5"
            : isError
              ? "border-red-400/40 bg-red-50/50"
              : "border-primary/20 bg-accent/30",
          hasOutput ? "cursor-pointer hover:bg-accent/60" : "cursor-default",
        ].join(" ")}
      >
        {isLoading ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
        ) : isError ? (
          <AlertCircle className="size-3.5 shrink-0 text-red-500" />
        ) : (
          <CheckCircle2 className="size-3.5 shrink-0 text-up" />
        )}
        <span className="shrink-0 font-medium text-foreground">{label}</span>
        {detail && <span className="min-w-0 flex-1 truncate">{detail}</span>}
        {hasOutput && (
          <ChevronDown
            className={[
              "ml-auto size-3 shrink-0 text-muted-foreground transition-transform",
              expanded ? "rotate-180" : "",
            ].join(" ")}
          />
        )}
      </button>

      {expanded && hasOutput && (
        <div className="border-l-2 border-primary/20 bg-accent/20 px-3 py-2">
          <ToolOutputDisplay toolName={toolName} output={output} />
        </div>
      )}
    </div>
  );
}

function ToolOutputDisplay({
  toolName,
  output,
}: {
  toolName: string;
  output: unknown;
}) {
  const data = output as Record<string, unknown>;
  if (!data || data.success === false) {
    return (
      <p className="text-xs text-red-500">
        {String(data?.error ?? "Tool call failed")}
      </p>
    );
  }

  switch (toolName) {
    case "financial_data":
      return <FinancialDataOutput data={data} />;
    case "web_search":
      return <WebSearchOutput data={data} />;
    case "calculator":
      return <CalculatorOutput data={data} />;
    case "fred_data":
      return <FredDataOutput data={data} />;
    case "sec_filing":
      return <SecFilingOutput data={data} />;
    default:
      return <GenericOutput data={data} />;
  }
}

function FinancialDataOutput({ data }: { data: Record<string, unknown> }) {
  const d = data.data as Record<string, unknown> | undefined;
  if (!d) return <GenericOutput data={data} />;

  // Quote data
  if ("price" in d) {
    const pct = Number(d.changePct ?? 0);
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
        <span>
          <span className="text-muted-foreground">Price </span>
          <span className="font-medium text-foreground">
            ${Number(d.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </span>
        <span className={pct >= 0 ? "text-up" : "text-down"}>
          {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
        </span>
        {d.marketCap ? (
          <span>
            <span className="text-muted-foreground">MCap </span>
            <span className="text-foreground">{formatLargeNum(Number(d.marketCap))}</span>
          </span>
        ) : null}
        {d.peRatio ? (
          <span>
            <span className="text-muted-foreground">P/E </span>
            <span className="text-foreground">{Number(d.peRatio).toFixed(1)}</span>
          </span>
        ) : null}
      </div>
    );
  }

  // Metrics/profile — show top keys
  const entries = Object.entries(d).filter(
    ([, v]) => v != null && v !== "" && typeof v !== "object"
  );
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
      {entries.slice(0, 8).map(([k, v]) => (
        <span key={k}>
          <span className="text-muted-foreground">{formatKey(k)} </span>
          <span className="text-foreground">
            {typeof v === "number" ? formatNum(v) : String(v)}
          </span>
        </span>
      ))}
      {entries.length > 8 && (
        <span className="text-muted-foreground">+{entries.length - 8} more</span>
      )}
    </div>
  );
}

function WebSearchOutput({ data }: { data: Record<string, unknown> }) {
  const results = data.results as Array<{
    title: string;
    url: string;
    snippet: string;
  }> | undefined;
  if (!results?.length) return <p className="text-xs text-muted-foreground">No results</p>;

  return (
    <div className="space-y-1.5">
      {results.slice(0, 4).map((r, i) => (
        <div key={i} className="text-xs">
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            {r.title}
          </a>
          <p className="line-clamp-1 text-muted-foreground">{r.snippet}</p>
        </div>
      ))}
      {results.length > 4 && (
        <p className="text-xs text-muted-foreground">+{results.length - 4} more results</p>
      )}
    </div>
  );
}

function CalculatorOutput({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="text-xs">
      <p className="font-medium text-foreground">
        = {typeof data.result === "number"
          ? data.result.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : String(data.result ?? "")}
      </p>
      {data.formula ? (
        <p className="text-muted-foreground">{String(data.formula)}</p>
      ) : null}
      {data.explanation ? (
        <p className="text-muted-foreground">{String(data.explanation)}</p>
      ) : null}
    </div>
  );
}

function FredDataOutput({ data }: { data: Record<string, unknown> }) {
  const series = data.series as Record<string, unknown> | undefined;
  const observations = data.observations as Array<{
    date: string;
    value: number;
  }> | undefined;

  return (
    <div className="text-xs">
      {series && (
        <p className="font-medium text-foreground">
          {String(series.title ?? series.id)}{" "}
          <span className="font-normal text-muted-foreground">
            ({String(series.units ?? "")})
          </span>
        </p>
      )}
      {observations && observations.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
          {observations.slice(0, 5).map((o, i) => (
            <span key={i}>
              <span className="text-muted-foreground">{o.date.slice(0, 7)} </span>
              <span className="text-foreground">{formatNum(o.value)}</span>
            </span>
          ))}
          {observations.length > 5 && (
            <span className="text-muted-foreground">
              +{observations.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function SecFilingOutput({ data }: { data: Record<string, unknown> }) {
  const filings = data.filings as Array<{
    formType: string;
    entityName: string;
    fileDate: string;
  }> | undefined;

  if (!filings?.length) return <p className="text-xs text-muted-foreground">No filings found</p>;

  return (
    <div className="space-y-0.5 text-xs">
      {filings.slice(0, 4).map((f, i) => (
        <p key={i}>
          <span className="font-medium text-foreground">{f.formType}</span>{" "}
          <span className="text-muted-foreground">
            {f.entityName} — {f.fileDate}
          </span>
        </p>
      ))}
    </div>
  );
}

function GenericOutput({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(
    ([k, v]) => k !== "success" && v != null
  );
  if (entries.length === 0) return null;

  return (
    <div className="max-h-32 overflow-auto text-xs text-muted-foreground">
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(data, null, 2).slice(0, 600)}
      </pre>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────

function getToolDetail(
  toolName: string,
  args: Record<string, unknown>
): string | null {
  if (!args || Object.keys(args).length === 0) return null;

  switch (toolName) {
    case "financial_data":
      return args.symbol ? `${args.symbol} — ${args.dataType ?? ""}` : null;
    case "web_search":
      return args.query ? String(args.query) : null;
    case "rag_query":
      return args.query ? String(args.query) : null;
    case "calculator":
      return args.calculationType ? String(args.calculationType) : null;
    case "sec_filing":
      return args.query ? String(args.query) : null;
    case "fred_data":
      return args.seriesId ? String(args.seriesId) : null;
    default:
      return null;
  }
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/TTM$/i, " (TTM)")
    .trim();
}

function formatNum(n: number): string {
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toFixed(2);
}

function formatLargeNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}
