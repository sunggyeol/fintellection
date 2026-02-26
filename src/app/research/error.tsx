"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function ResearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Research Error]", error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center bg-destructive/10">
          <AlertTriangle className="size-6 text-destructive" />
        </div>
        <h2 className="mb-1 text-lg font-semibold text-foreground">
          Research unavailable
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {error.message || "The AI research assistant encountered an error."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
          >
            <RotateCcw className="size-3" />
            Retry
          </button>
          <Link
            href="/"
            className="flex items-center gap-1.5 bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Home className="size-3" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
