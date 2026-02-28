"use client";

import { useState, useEffect, useCallback } from "react";
import {
  actorFromAuth,
  addToWatchlist,
  getDefaultWatchlist,
  removeFromWatchlist,
} from "@/lib/data/unified";
import { useAuth } from "@/hooks/useAuth";
import type { DBWatchlist } from "@/types/database";

export function useWatchlist() {
  const { user, supabase, isReady, dataVersion } = useAuth();
  const userId = user?.id ?? null;
  const [watchlist, setWatchlist] = useState<DBWatchlist | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isReady) return;

    try {
      const actor = actorFromAuth(userId ? { id: userId } : null, supabase);
      const wl = await getDefaultWatchlist(actor);
      setWatchlist(wl);
    } catch {
      setWatchlist(null);
    } finally {
      setLoading(false);
    }
  }, [isReady, userId, supabase]);

  useEffect(() => {
    void refresh();
  }, [refresh, dataVersion]);

  const add = useCallback(
    async (symbol: string) => {
      const actor = actorFromAuth(userId ? { id: userId } : null, supabase);
      await addToWatchlist(actor, symbol);
      await refresh();
    },
    [refresh, userId, supabase]
  );

  const remove = useCallback(
    async (symbol: string) => {
      const actor = actorFromAuth(userId ? { id: userId } : null, supabase);
      await removeFromWatchlist(actor, symbol);
      await refresh();
    },
    [refresh, userId, supabase]
  );

  return { watchlist, loading: !isReady || loading, add, remove, refresh };
}
