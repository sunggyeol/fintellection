"use client";

import { useState, useEffect, useCallback } from "react";
import type { StockQuote } from "@/types/financial";

export function useStockQuote(symbol: string) {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    try {
      const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) throw new Error("Failed to fetch quote");
      const data = await res.json();
      setQuote(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchQuote();
    // Refresh every 60 seconds
    const interval = setInterval(fetchQuote, 60_000);
    return () => clearInterval(interval);
  }, [fetchQuote]);

  return { quote, loading, error, refetch: fetchQuote };
}
