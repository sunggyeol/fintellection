"use client";

import { useState } from "react";
import { Copy, Check, RotateCcw } from "lucide-react";
import type { UIMessage } from "ai";

interface MessageActionsProps {
  message: UIMessage;
  onRetry?: (message: UIMessage) => void;
}

export function MessageActions({ message, onRetry }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = message.parts
      .filter((p) => p.type === "text" && typeof p.text === "string")
      .map((p) => (p as { text: string }).text)
      .join("\n\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1 pt-1 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
      <button
        onClick={handleCopy}
        className="flex size-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Copy response"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
      {onRetry && (
        <button
          onClick={() => onRetry(message)}
          className="flex size-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Retry response"
        >
          <RotateCcw className="size-3.5" />
        </button>
      )}
    </div>
  );
}
