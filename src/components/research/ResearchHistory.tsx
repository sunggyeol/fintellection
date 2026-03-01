"use client";

import type { ReactNode } from "react";
import { Clock, Trash2, MessageSquare } from "lucide-react";
import { useResearchHistory } from "@/hooks/useResearchHistory";

interface ResearchHistoryProps {
  headerActions?: ReactNode;
  onSelectSession?: (id: string) => void;
}

export function ResearchHistory({
  headerActions,
  onSelectSession,
}: ResearchHistoryProps = {}) {
  const { sessions, loading, deleteSession, currentSessionId } = useResearchHistory();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          History
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            {loading ? "-" : sessions.length}
          </span>
          {headerActions}
        </div>
      </div>
      {loading ? (
        <div className="space-y-2 p-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-shimmer h-14" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-3 py-8 text-center text-xs text-muted-foreground">
          <p>
            No research history yet.
            <br />
            Start a conversation to save it here.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={[
                "group flex items-start gap-2 border-b border-border px-3 py-2.5 transition-colors hover:bg-elevated",
                currentSessionId === session.id ? "bg-elevated" : "",
              ].join(" ")}
            >
              <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <button
                onClick={() => onSelectSession?.(session.id)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="text-xs font-medium text-foreground line-clamp-2">
                  {session.title}
                </p>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="size-3" />
                  <span>
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </span>
                  {session.symbolsReferenced.length > 0 && (
                    <>
                      <span>·</span>
                      <span>
                        {session.symbolsReferenced.slice(0, 3).join(", ")}
                      </span>
                    </>
                  )}
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  deleteSession(session.id);
                }}
                className="mt-0.5 p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
