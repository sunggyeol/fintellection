"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { MessageList } from "@/components/research/MessageList";
import { ResearchInput } from "@/components/research/ResearchInput";
import { FollowUpCards } from "@/components/research/FollowUpCards";
import { ResearchHistory } from "@/components/research/ResearchHistory";
import { AIDisclaimer } from "@/components/research/AIDisclaimer";
import {
  useResearchHistory,
  ResearchHistoryProvider,
} from "@/hooks/useResearchHistory";
import { Bot, PanelRight, PanelRightClose } from "lucide-react";

const STARTER_QUERIES = [
  "Analyze NVIDIA's competitive position in AI chips",
  "Compare FAANG valuations — which is cheapest?",
  "Tesla Q4 earnings breakdown and outlook",
  "What are the risks to the S&P 500 in 2026?",
];

const FOLLOW_UP_SUGGESTIONS = [
  "What about AMD's competitive response?",
  "Show me the DCF valuation",
  "Compare these metrics to industry peers",
];

export default function ResearchPage() {
  return (
    <ResearchHistoryProvider>
      <Suspense>
        <ResearchPageInner />
      </Suspense>
    </ResearchHistoryProvider>
  );
}

function ResearchPageInner() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(true);
  const { save } = useResearchHistory();
  const savedRef = useRef(false);
  const autoSentRef = useRef(false);

  const { messages, sendMessage, stop, status } = useChat();

  const isStreaming = status === "streaming";
  const hasMessages = messages.length > 0;

  // Auto-send query from ?q= param (e.g., from AIInsightsPanel)
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !autoSentRef.current && status === "ready") {
      autoSentRef.current = true;
      sendMessage({ text: q });
    }
  }, [searchParams, status, sendMessage]);

  // Save session when streaming completes (assistant responded)
  useEffect(() => {
    if (
      status === "ready" &&
      messages.length >= 2 &&
      !savedRef.current
    ) {
      savedRef.current = true;
      save(messages);
    }
    if (status === "streaming") {
      savedRef.current = false;
    }
  }, [status, messages, save]);

  const handleSubmit = () => {
    if (!input.trim() || isStreaming) return;
    const text = input;
    setInput("");
    sendMessage({ text });
  };

  const handleStarterClick = (query: string) => {
    setInput("");
    sendMessage({ text: query });
  };

  return (
    <div className="flex h-full">
      {/* Main research area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex h-10 items-center justify-between border-b border-border px-4">
          <span className="text-xs font-medium text-foreground">
            Analyst
          </span>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            {showHistory ? (
              <PanelRightClose className="size-3.5" />
            ) : (
              <PanelRight className="size-3.5" />
            )}
          </button>
        </div>

        {hasMessages ? (
          <>
            <MessageList messages={messages} />
            {!isStreaming && messages.length > 1 && (
              <div className="px-4 pb-2">
                <FollowUpCards
                  suggestions={FOLLOW_UP_SUGGESTIONS}
                  onSelect={handleStarterClick}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center bg-primary/10">
                <Bot className="size-6 text-primary" />
              </div>
              <h1 className="mb-1 text-lg font-semibold text-foreground">
                AI Analyst
              </h1>
              <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
                Research, analyze, and visualize financial data. From quick
                lookups to deep competitive analysis — powered by real-time
                data, SEC filings, and web search.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {STARTER_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleStarterClick(q)}
                    className="border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <ResearchInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          onStop={stop}
          isStreaming={isStreaming}
        />
        {hasMessages && <AIDisclaimer />}
      </div>

      {/* History sidebar */}
      {showHistory && (
        <div className="hidden w-64 shrink-0 border-l border-border bg-card md:block">
          <ResearchHistory />
        </div>
      )}
    </div>
  );
}
