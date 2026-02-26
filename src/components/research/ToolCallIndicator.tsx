"use client";

import { Loader2, CheckCircle2 } from "lucide-react";
import { TOOL_LABELS } from "@/types/research";

interface ToolCallIndicatorProps {
  toolName: string;
  state: string;
  args?: Record<string, unknown>;
}

export function ToolCallIndicator({
  toolName,
  state,
  args,
}: ToolCallIndicatorProps) {
  const label =
    TOOL_LABELS[toolName as keyof typeof TOOL_LABELS] ?? toolName;
  const detail = getToolDetail(toolName, args ?? {});
  const isLoading = state === "call" || state === "partial-call";

  return (
    <div className="my-2 flex items-center gap-2 border-l-2 border-primary/30 bg-accent/50 px-3 py-2 text-xs text-muted-foreground">
      {isLoading ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
      ) : (
        <CheckCircle2 className="size-3.5 shrink-0 text-up" />
      )}
      <span className="font-medium text-foreground">{label}</span>
      {detail && <span className="truncate">{detail}</span>}
    </div>
  );
}

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
    default:
      return null;
  }
}
