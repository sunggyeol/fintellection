"use client";

import { useRef, useEffect } from "react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isStreaming: boolean;
}

export function ResearchInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
}: ResearchInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isStreaming) onSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-surface p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a financial research question..."
          rows={1}
          className="flex-1 resize-none border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
        />
        {isStreaming ? (
          <button
            onClick={onStop}
            className="flex size-9 shrink-0 items-center justify-center bg-foreground text-background transition-colors hover:bg-foreground/80"
          >
            <Square className="size-3.5" />
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={!value.trim()}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center transition-colors",
              value.trim()
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <ArrowUp className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
