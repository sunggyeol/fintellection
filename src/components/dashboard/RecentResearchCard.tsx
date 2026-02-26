"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Clock } from "lucide-react";
import { getRecentSessions } from "@/lib/db";
import type { DBResearchSession } from "@/types/database";

export function RecentResearchCard() {
  const [sessions, setSessions] = useState<DBResearchSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentSessions(3)
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="border border-border bg-card p-4">
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-shimmer h-12" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-3.5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Recent Research
          </span>
        </div>
        <Link
          href="/research"
          className="text-xs text-primary hover:underline"
        >
          New →
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            No research sessions yet
          </p>
          <Link
            href="/research"
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            Start your first research
          </Link>
        </div>
      ) : (
        <div className="p-1">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/research/${session.id}`}
              className="flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-accent"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {session.title}
                </p>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  <span>
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
