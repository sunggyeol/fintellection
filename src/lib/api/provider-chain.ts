import * as finnhub from "./finnhub";
import * as fmp from "./fmp";
import * as twelveData from "./twelve-data";
import * as fred from "./fred";
import {
  cached,
  isCircuitOpen,
  recordSuccess,
  recordFailure,
  TTL,
} from "./cache";
import type { StockQuote, SearchResult, OHLCVBar, NewsArticle } from "@/types/financial";

// ── Helpers ──────────────────────────────────────────────────

/** Try FMP only if circuit is closed */
async function tryFmp<T>(fn: () => Promise<T>): Promise<T | null> {
  if (isCircuitOpen("fmp")) return null;
  try {
    const result = await fn();
    recordSuccess("fmp");
    return result;
  } catch {
    recordFailure("fmp");
    return null;
  }
}

async function tryTwelveData<T>(fn: () => Promise<T>): Promise<T | null> {
  if (isCircuitOpen("twelveData")) return null;
  try {
    const result = await fn();
    recordSuccess("twelveData");
    return result;
  } catch {
    recordFailure("twelveData");
    return null;
  }
}

// ── Quote ────────────────────────────────────────────────────

export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  return cached(`quote:${symbol}`, TTL.QUOTE, () => fetchQuote(symbol));
}

async function fetchQuote(symbol: string): Promise<StockQuote | null> {
  // Indices (^GSPC etc.) are not supported on Finnhub free tier — go straight to FMP
  if (!symbol.startsWith("^")) {
    // Finnhub is fast and free — try first for regular stocks
    try {
      const fhQuote = await finnhub.getQuote(symbol);
      if (fhQuote.c > 0) {
        // Fire FMP in background for enrichment, but don't block
        const fmpQ = await Promise.race([
          tryFmp(() => fmp.getQuote(symbol).then((d) => d[0] ?? null)),
          new Promise<null>((r) => setTimeout(() => r(null), 1500)),
        ]);

        return {
          symbol,
          name: fmpQ?.name ?? symbol,
          price: fhQuote.c,
          change: fhQuote.d ?? 0,
          changePct: fhQuote.dp ?? 0,
          volume: fmpQ?.volume ?? 0,
          marketCap: fmpQ?.marketCap ?? 0,
          peRatio: fmpQ?.pe ?? null,
          week52High: fmpQ?.yearHigh ?? fhQuote.h,
          week52Low: fmpQ?.yearLow ?? fhQuote.l,
          exchange: fmpQ?.exchange ?? "",
          updatedAt: new Date().toISOString(),
        };
      }
    } catch {
      // Finnhub failed — fall through to FMP
    }
  }

  // FMP: primary for indices, fallback for stocks
  const fmpData = await tryFmp(() => fmp.getQuote(symbol));
  if (fmpData?.[0]) {
    const q = fmpData[0];
    return {
      symbol,
      name: q.name ?? symbol,
      price: q.price,
      change: q.change,
      changePct: q.changesPercentage ?? q.changePercentage ?? 0,
      volume: q.volume ?? 0,
      marketCap: q.marketCap ?? 0,
      peRatio: q.pe ?? null,
      week52High: q.yearHigh ?? 0,
      week52Low: q.yearLow ?? 0,
      exchange: q.exchange ?? "",
      updatedAt: new Date().toISOString(),
    };
  }

  return null;
}

// ── Batch Quotes (for dashboard) ─────────────────────────────

export async function getBatchQuotes(
  symbols: string[]
): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();

  await Promise.allSettled(
    symbols.map(async (symbol) => {
      const quote = await getStockQuote(symbol);
      if (quote) results.set(symbol, quote);
    })
  );

  return results;
}

// ── Search ───────────────────────────────────────────────────

export async function searchStocks(query: string): Promise<SearchResult[]> {
  return cached(`search:${query.toLowerCase()}`, TTL.SEARCH, async () => {
    try {
      const result = await finnhub.searchSymbols(query);
      return result.result.slice(0, 10).map((r) => ({
        symbol: r.symbol,
        name: r.description,
        type: r.type,
        exchange: "",
      }));
    } catch {
      return [];
    }
  });
}

// ── Historical Data ──────────────────────────────────────────

export async function getHistoricalData(
  symbol: string,
  from?: string,
  to?: string
): Promise<OHLCVBar[]> {
  const cacheKey = `history:${symbol}:${from ?? ""}:${to ?? ""}`;
  // Past-date OHLCV is immutable; only today's bars need frequent refresh
  const today = new Date().toISOString().split("T")[0];
  const isHistorical = to && to < today;
  const ttl = isHistorical ? TTL.HISTORY_PAST : TTL.HISTORY_LIVE;
  return cached(cacheKey, ttl, () => fetchHistory(symbol, from, to));
}

async function fetchHistory(
  symbol: string,
  from?: string,
  to?: string
): Promise<OHLCVBar[]> {
  const days = from && to
    ? Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000)
    : 252;

  // Try Twelve Data first
  const tdResult = await tryTwelveData(() =>
    twelveData.getTimeSeries(symbol, "1day", Math.min(days + 10, 5000))
  );
  if (tdResult && tdResult.values.length > 0) {
    const bars = tdResult.values
      .map((v) => ({
        time: new Date(v.datetime).getTime() / 1000,
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: parseInt(v.volume, 10),
      }))
      .reverse();

    if (from) {
      const fromTs = new Date(from).getTime() / 1000;
      return bars.filter((b) => b.time >= fromTs);
    }
    return bars;
  }

  // Fallback to FMP
  const fmpBars = await tryFmp(() => fmp.getHistoricalDaily(symbol, from, to));
  if (fmpBars && fmpBars.length > 0) {
    return fmpBars
      .map((bar) => ({
        time: new Date(bar.date).getTime() / 1000,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
      }))
      .reverse();
  }

  // Last resort: Finnhub candles (paid feature — will fail on free tier but worth trying)
  try {
    const fromTs = from
      ? Math.floor(new Date(from).getTime() / 1000)
      : Math.floor(Date.now() / 1000) - 365 * 86400;
    const toTs = to
      ? Math.floor(new Date(to).getTime() / 1000)
      : Math.floor(Date.now() / 1000);
    const candles = await finnhub.getCandles(symbol, "D", fromTs, toTs);
    if (candles.s === "ok" && candles.t.length > 0) {
      return candles.t.map((t, i) => ({
        time: t,
        open: candles.o[i],
        high: candles.h[i],
        low: candles.l[i],
        close: candles.c[i],
        volume: candles.v[i],
      }));
    }
  } catch {
    // All providers exhausted
  }

  return [];
}

// ── News ─────────────────────────────────────────────────────

export async function getStockNews(symbol: string): Promise<NewsArticle[]> {
  return cached(`news:${symbol}`, TTL.NEWS, () => fetchNews(symbol));
}

async function fetchNews(symbol: string): Promise<NewsArticle[]> {
  // Finnhub (free tier works)
  try {
    const to = new Date().toISOString().split("T")[0];
    const from = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    const news = await finnhub.getCompanyNews(symbol, from, to);
    if (news.length > 0) {
      return news.slice(0, 15).map((n) => ({
        id: `fh-${n.id}`,
        title: n.headline,
        summary: n.summary,
        source: n.source,
        url: n.url,
        image: n.image || null,
        publishedAt: new Date(n.datetime * 1000).toISOString(),
        symbols: [symbol],
        sentiment: null,
      }));
    }
  } catch {
    // Fall through
  }

  // FMP fallback
  const fmpNews = await tryFmp(() => fmp.getStockNews(symbol, 15));
  if (fmpNews && fmpNews.length > 0) {
    return fmpNews.map((n, i) => ({
      id: `fmp-${symbol}-${i}`,
      title: n.title,
      summary: n.text,
      source: n.site,
      url: n.url,
      image: n.image ?? null,
      publishedAt: n.publishedDate,
      symbols: n.symbol ? [n.symbol] : [symbol],
      sentiment: null,
    }));
  }

  return [];
}

// ── Company Profile (cached) ────────────────────────────────

export async function getCompanyProfile(symbol: string) {
  return cached(`profile:${symbol}`, TTL.PROFILE, async () => {
    const result = await tryFmp(() => fmp.getProfile(symbol));
    return result?.[0] ?? null;
  });
}

// ── Key Metrics (cached) ────────────────────────────────────

export async function getKeyMetrics(symbol: string) {
  return cached(`metrics:${symbol}`, TTL.METRICS, async () => {
    const result = await tryFmp(() => fmp.getKeyMetrics(symbol));
    return result?.[0] ?? null;
  });
}

export async function getKeyMetricsAlt(symbol: string) {
  return cached(`metricsAlt:${symbol}`, TTL.METRICS, async () => {
    const result = await tryFmp(() => fmp.getKeyMetricsAlt(symbol));
    return result?.[0] ?? null;
  });
}

// ── FRED (Federal Reserve Economic Data) ────────────────────

async function tryFred<T>(fn: () => Promise<T>): Promise<T | null> {
  if (isCircuitOpen("fred")) return null;
  try {
    const result = await fn();
    recordSuccess("fred");
    return result;
  } catch {
    recordFailure("fred");
    return null;
  }
}

export async function getFredSeries(
  seriesId: string,
  options?: Parameters<typeof fred.getSeriesObservations>[1]
) {
  const optKey = options
    ? `:${options.observationStart ?? ""}:${options.observationEnd ?? ""}:${options.limit ?? ""}:${options.frequency ?? ""}`
    : "";
  const cacheKey = `fred:obs:${seriesId}${optKey}`;

  return cached(cacheKey, TTL.FRED, async () => {
    const raw = await tryFred(() => fred.getSeriesObservations(seriesId, options));
    if (!raw) return null;
    return fred.parseObservations(raw);
  });
}

export async function getFredSeriesInfo(seriesId: string) {
  return cached(`fred:meta:${seriesId}`, TTL.FRED_META, async () => {
    const info = await tryFred(() => fred.getSeriesInfo(seriesId));
    return info?.seriess[0] ?? null;
  });
}

/**
 * Pre-cache key macro series. Call once on server startup.
 * Fetches last 12 months of data for each series.
 */
export async function preCacheFredSeries(): Promise<void> {
  if (!process.env.FRED_API_KEY) {
    console.log("[FRED] No API key configured, skipping pre-cache");
    return;
  }

  const oneYearAgo = new Date(Date.now() - 365 * 86_400_000)
    .toISOString()
    .split("T")[0];

  const seriesIds = Object.keys(fred.KEY_MACRO_SERIES) as fred.FredSeriesId[];

  await Promise.allSettled(
    seriesIds.map(async (id) => {
      await getFredSeries(id, { observationStart: oneYearAgo, sortOrder: "asc" });
      await getFredSeriesInfo(id);
    })
  );

  console.log(`[FRED] Pre-cached ${seriesIds.length} macro series`);
}
