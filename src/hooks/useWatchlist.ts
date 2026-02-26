"use client";

import { useState, useEffect, useCallback } from "react";
import { db, ensureDefaultWatchlist, addToWatchlist, removeFromWatchlist } from "@/lib/db";
import type { DBWatchlist } from "@/types/database";

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<DBWatchlist | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const wl = await ensureDefaultWatchlist();
      setWatchlist(wl);
    } catch {
      setWatchlist(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (symbol: string) => {
      await addToWatchlist(symbol);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (symbol: string) => {
      await removeFromWatchlist(symbol);
      await refresh();
    },
    [refresh]
  );

  return { watchlist, loading, add, remove, refresh };
}
