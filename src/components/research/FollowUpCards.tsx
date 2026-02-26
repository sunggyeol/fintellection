"use client";

import { ArrowRight } from "lucide-react";

interface FollowUpCardsProps {
  suggestions: string[];
  onSelect: (query: string) => void;
}

export function FollowUpCards({ suggestions, onSelect }: FollowUpCardsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="mx-auto mt-4 max-w-3xl">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Follow-up questions
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSelect(s)}
            className="group flex items-center gap-1.5 border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <span>{s}</span>
            <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
}
