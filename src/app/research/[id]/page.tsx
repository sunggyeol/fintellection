"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { ArrowLeft, MessageSquareText } from "lucide-react";
import { actorFromAuth, getSession } from "@/lib/data/unified";
import { MessageList } from "@/components/research/MessageList";
import { useAuth } from "@/hooks/useAuth";
import type { DBResearchSession } from "@/types/database";
import type { UIMessage } from "ai";

interface ResearchSessionPageProps {
  params: Promise<{ id: string }>;
}

export default function ResearchSessionPage({
  params,
}: ResearchSessionPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, supabase, isReady, dataVersion } = useAuth();
  const userId = user?.id ?? null;
  const [session, setSession] = useState<DBResearchSession | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;

    getSession(actorFromAuth(userId ? { id: userId } : null, supabase), id)
      .then((s) => {
        if (s) {
          setSession(s);
          try {
            setMessages(JSON.parse(s.messages));
          } catch {
            setMessages([]);
          }
        }
      })
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, [id, userId, supabase, isReady, dataVersion]);

  if (!isReady || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Session not found</p>
        <button
          onClick={() => router.push("/research")}
          className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-elevated"
        >
          <ArrowLeft className="size-3" />
          Back to Research
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      {/* Session header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <button
          onClick={() => router.push("/research")}
          className="flex size-7 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground line-clamp-1">
            {session.title}
          </p>
          <div className="mt-0.5 flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
            <span className="shrink-0">
              {new Date(session.createdAt).toLocaleDateString()}
            </span>
            {session.symbolsReferenced.length > 0 && (
              <>
                <span className="shrink-0">·</span>
                <span className="truncate">
                  {session.symbolsReferenced.join(", ")}
                </span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => router.push("/research")}
          className="flex shrink-0 items-center gap-1.5 border border-border px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-elevated sm:px-3"
        >
          <MessageSquareText className="size-3" />
          <span className="hidden sm:inline">New Research</span>
        </button>
      </div>

      {/* Read-only messages */}
      <MessageList messages={messages} />
    </div>
  );
}
