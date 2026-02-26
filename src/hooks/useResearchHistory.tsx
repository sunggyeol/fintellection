"use client";

import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import { db, saveResearchSession, getRecentSessions } from "@/lib/db";
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

export function ResearchHistoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessions, setSessions] = useState<DBResearchSession[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const recent = await getRecentSessions(20);
      setSessions(recent);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (messages: UIMessage[], title?: string) => {
      if (messages.length === 0) return;

      const firstUserMsg = messages.find((m) => m.role === "user");
      const query =
        firstUserMsg?.parts.find((p) => p.type === "text")?.text ?? "Untitled";

      const sessionTitle =
        title ?? query.slice(0, 80) + (query.length > 80 ? "..." : "");

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
        messages: JSON.stringify(messages),
        symbolsReferenced: Array.from(symbols),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await saveResearchSession(session);
      await refresh();
      return session.id;
    },
    [refresh]
  );

  const deleteSession = useCallback(
    async (id: string) => {
      await db.researchSessions.delete(id);
      await refresh();
    },
    [refresh]
  );

  return (
    <ResearchHistoryContext
      value={{ sessions, loading, save, deleteSession, refresh }}
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
