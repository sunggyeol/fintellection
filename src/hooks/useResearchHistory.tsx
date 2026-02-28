"use client";

import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import {
  actorFromAuth,
  deleteSession as deleteResearchSession,
  getRecentSessions,
  saveResearchSession,
} from "@/lib/data/unified";
import { useAuth } from "@/hooks/useAuth";
import type { DBResearchSession } from "@/types/database";
import type { UIMessage } from "ai";

interface ResearchHistoryState {
  sessions: DBResearchSession[];
  loading: boolean;
  save: (messages: UIMessage[], title?: string) => Promise<string | undefined>;
  deleteSession: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const ResearchHistoryContext = createContext<ResearchHistoryState | null>(null);

function getMessageText(message: UIMessage) {
  const chunks: string[] = [];
  for (const part of message.parts) {
    if (part.type === "text" && typeof part.text === "string") {
      chunks.push(part.text);
    }
  }
  return chunks.join("\n\n").trim();
}

export function ResearchHistoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, supabase, isReady, dataVersion } = useAuth();
  const userId = user?.id ?? null;
  const [sessions, setSessions] = useState<DBResearchSession[]>([]);
  const [loading, setLoading] = useState(true);

  const getActor = useCallback(
    () => actorFromAuth(userId ? { id: userId } : null, supabase),
    [userId, supabase]
  );

  const refresh = useCallback(async () => {
    if (!isReady) return;

    try {
      const recent = await getRecentSessions(getActor(), 20);
      setSessions(recent);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [isReady, getActor]);

  useEffect(() => {
    void refresh();
  }, [refresh, dataVersion]);

  const save = useCallback(
    async (messages: UIMessage[], title?: string) => {
      if (messages.length === 0) return;

      try {
        const firstUserMsg = messages.find((m) => m.role === "user");
        const query = firstUserMsg ? getMessageText(firstUserMsg) : "Untitled";

        const sessionTitle =
          title ?? query.slice(0, 80) + (query.length > 80 ? "..." : "");

        const assistantResponse = messages
          .filter((m) => m.role === "assistant")
          .map((message) => getMessageText(message))
          .filter(Boolean)
          .join("\n\n");

        // Extract referenced symbols from tool calls
        const symbols = new Set<string>();
        for (const msg of messages) {
          for (const part of msg.parts) {
            if (part.type !== "text" && "input" in part) {
              const input = part.input as Record<string, unknown> | undefined;
              if (input && typeof input.symbol === "string") {
                symbols.add(input.symbol.toUpperCase());
              }
            }
          }
        }

        const session: DBResearchSession = {
          id: crypto.randomUUID(),
          title: sessionTitle,
          query,
          response: assistantResponse,
          messages: JSON.stringify(messages),
          symbolsReferenced: Array.from(symbols),
          sources: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const persisted = await saveResearchSession(getActor(), session);
        await refresh();
        return persisted.id;
      } catch (err) {
        console.warn("[Research] Failed to save session:", err);
        return undefined;
      }
    },
    [refresh, getActor]
  );

  const deleteSession = useCallback(
    async (id: string) => {
      await deleteResearchSession(getActor(), id);
      await refresh();
    },
    [refresh, getActor]
  );

  return (
    <ResearchHistoryContext
      value={{ sessions, loading: !isReady || loading, save, deleteSession, refresh }}
    >
      {children}
    </ResearchHistoryContext>
  );
}

export function useResearchHistory(): ResearchHistoryState {
  const ctx = useContext(ResearchHistoryContext);
  if (!ctx) {
    throw new Error(
      "useResearchHistory must be used within ResearchHistoryProvider"
    );
  }
  return ctx;
}
