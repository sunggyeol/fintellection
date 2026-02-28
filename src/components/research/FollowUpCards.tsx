"use client";

import { ArrowRight } from "lucide-react";

interface FollowUpCardsProps {
  suggestions: string[];
  onSelect: (query: string) => void;
}

export function FollowUpCards({ suggestions, onSelect }: FollowUpCardsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="mx-auto mt-2 max-w-3xl sm:mt-4">
      <p className="mb-2 hidden text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:block">
        Follow-up questions
      </p>
      <div className="-mx-4 no-scrollbar overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="flex snap-x snap-mandatory gap-2 sm:flex-wrap sm:snap-none">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSelect(s)}
              className="group flex shrink-0 snap-start items-center gap-1.5 border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <span className="whitespace-nowrap">
                {s}
              </span>
              <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
