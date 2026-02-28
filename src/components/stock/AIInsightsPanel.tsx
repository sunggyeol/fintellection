"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, ArrowRight, Loader2 } from "lucide-react";

interface AIInsightsPanelProps {
  symbol: string;
  companyName?: string;
}

const STOCK_ANALYSES = [
  "Full fundamental analysis",
  "Competitive landscape",
  "Recent news & sentiment",
  "Valuation (DCF + comparables)",
  "Risk assessment",
] as const;

const INDEX_ANALYSES = [
  "Market overview & trend analysis",
  "Recent news & sentiment",
  "Sector performance breakdown",
  "Macro economic outlook",
] as const;

export function AIInsightsPanel({ symbol, companyName }: AIInsightsPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const isIndex = symbol.startsWith("^");
  const displayName = companyName || symbol;
  const analyses = isIndex ? INDEX_ANALYSES : STOCK_ANALYSES;

  const handleAnalyze = (analysisType: string) => {
    setLoading(analysisType);
    const query =
      analysisType === "Full fundamental analysis"
        ? `Analyze ${symbol}${companyName ? ` (${companyName})` : ""} — full fundamental analysis including valuation, growth prospects, and risks`
        : `${analysisType} for ${symbol}${companyName ? ` (${companyName})` : ""}`;

    router.push(`/research?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <BrainCircuit className="size-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          Analyst
        </span>
      </div>

      <div className="p-4">
        <p className="mb-3 text-xs text-muted-foreground">
          Run AI-powered analysis on {displayName}
        </p>

        <div className="space-y-1.5">
          {analyses.map((analysis) => (
            <button
              key={analysis}
              onClick={() => handleAnalyze(analysis)}
              disabled={loading !== null}
              className="group flex w-full items-center justify-between border border-border px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-elevated disabled:opacity-50"
            >
              <span>{analysis}</span>
              {loading === analysis ? (
                <Loader2 className="size-3 animate-spin text-primary" />
              ) : (
                <ArrowRight className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
