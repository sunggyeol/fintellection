"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { MessageList } from "@/components/research/MessageList";
import { ResearchInput } from "@/components/research/ResearchInput";
import { FollowUpCards } from "@/components/research/FollowUpCards";
import { ResearchHistory } from "@/components/research/ResearchHistory";
import { AIDisclaimer } from "@/components/research/AIDisclaimer";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  useResearchHistory,
  ResearchHistoryProvider,
} from "@/hooks/useResearchHistory";
import {
  Bot,
  MessageSquarePlus,
  PanelRight,
  PanelRightClose,
} from "lucide-react";

const STARTER_QUERIES = [
  "Analyze NVIDIA's competitive position in AI chips",
  "Compare FAANG valuations, which is cheapest?",
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
  const [showDesktopHistory, setShowDesktopHistory] = useState(true);
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const { save } = useResearchHistory();
  const savedRef = useRef(false);
  const autoSentRef = useRef(false);

  const { messages, setMessages, sendMessage, stop, status } = useChat({
    onError: (error) => {
      console.error("[Chat stream error]", error);
    },
  });

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
      save(messages).catch(() => {
        // Non-critical: session save failed (e.g., DB migration issue)
      });
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

  const handleNewChat = () => {
    if (isStreaming) stop();
    setInput("");
    setMessages([]);
    savedRef.current = false;
  };

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const closeMobileDrawerOnDesktop = (e: MediaQueryListEvent) => {
      if (e.matches) setShowMobileHistory(false);
    };

    media.addEventListener("change", closeMobileDrawerOnDesktop);
    return () =>
      media.removeEventListener("change", closeMobileDrawerOnDesktop);
  }, []);

  return (
    <div className="flex h-full min-w-0 overflow-hidden">
      {/* Main research area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-4">
          <span className="text-xs font-medium text-foreground">
            Research Analyst
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowMobileHistory(true)}
              className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground md:hidden"
              aria-label="Open history drawer"
            >
              <PanelRight className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNewChat}
              className="inline-flex h-7 items-center gap-1.5 border border-border bg-card px-2.5 text-xs text-foreground transition-colors hover:bg-elevated"
            >
              <MessageSquarePlus className="size-3.5" />
              <span>New chat</span>
            </button>
          </div>
        </div>

        {hasMessages ? (
          <>
            <MessageList messages={messages} isStreaming={isStreaming} />
            {!isStreaming && messages.length > 1 && (
              <div className="overflow-x-hidden px-4 pb-2">
                <FollowUpCards
                  suggestions={FOLLOW_UP_SUGGESTIONS}
                  onSelect={handleStarterClick}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full px-4 text-center sm:px-0">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center bg-primary/10">
                <Bot className="size-8 text-primary" />
              </div>
              <h1 className="mb-2 text-xl font-semibold text-foreground">
                Research Analyst
              </h1>
              <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
                Agentic research and financial modeling with live market data.
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

      {/* History sidebar / collapsed rail */}
      <div
        className={[
          "hidden shrink-0 border-l border-border bg-card md:flex md:flex-col",
          showDesktopHistory ? "w-64" : "w-9",
        ].join(" ")}
      >
        {showDesktopHistory ? (
          <ResearchHistory
            headerActions={
              <button
                type="button"
                onClick={() => setShowDesktopHistory(false)}
                className="flex size-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Collapse history panel"
              >
                <PanelRightClose className="size-3.5" />
              </button>
            }
          />
        ) : (
          <div className="flex h-10 items-center justify-center border-b border-border">
            <button
              type="button"
              onClick={() => setShowDesktopHistory(true)}
              className="flex size-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Expand history panel"
            >
              <PanelRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* History drawer — mobile */}
      <Sheet open={showMobileHistory} onOpenChange={setShowMobileHistory}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-[85vw] border-l border-border bg-card p-0 sm:max-w-sm md:hidden"
        >
          <SheetTitle className="sr-only">Research History</SheetTitle>
          <ResearchHistory
            headerActions={
              <button
                type="button"
                onClick={() => setShowMobileHistory(false)}
                className="flex size-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close history drawer"
              >
                <PanelRightClose className="size-3.5" />
              </button>
            }
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
