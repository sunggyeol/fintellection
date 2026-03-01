import { NextResponse } from "next/server";
import { cached, TTL } from "@/lib/api/cache";
import * as fmp from "@/lib/api/fmp";
import { getStockQuote } from "@/lib/api/provider-chain";
import { getOffHoursFreezeTtlMs, isUsRegularSessionOpen } from "@/lib/market-hours";
import nasdaq100 from "@/lib/data/nasdaq100.json";
import type {
  IndexData,
  MarketMover,
  NewsArticle,
  SectorPerformance,
  EarningsEntry,
  CryptoQuote,
  DashboardPayload,
  StockQuote,
} from "@/types/financial";

const INDEX_SYMBOLS = [
  "^GSPC", "^IXIC", "^DJI", "^VIX", "^RUT",
  "^FTSE", "^N225", "^HSI", "^STOXX50E", "^DAX",
];
const INDEX_NAMES: Record<string, string> = {
  "^GSPC": "S&P 500",
  "^IXIC": "NASDAQ",
  "^DJI": "DOW 30",
  "^VIX": "VIX",
  "^RUT": "Russell 2000",
  "^FTSE": "FTSE 100",
  "^N225": "Nikkei 225",
  "^HSI": "Hang Seng",
  "^STOXX50E": "Euro STOXX 50",
  "^DAX": "DAX",
};

const CRYPTO_SYMBOLS = [
  "BTCUSD", "ETHUSD", "BNBUSD", "SOLUSD", "XRPUSD",
  "ADAUSD", "DOGEUSD", "DOTUSD", "AVAXUSD", "LINKUSD",
];

const CRYPTO_NAMES: Record<string, string> = {
  BTCUSD: "Bitcoin", ETHUSD: "Ethereum", BNBUSD: "BNB", SOLUSD: "Solana",
  XRPUSD: "XRP", ADAUSD: "Cardano", DOGEUSD: "Dogecoin",
  DOTUSD: "Polkadot", AVAXUSD: "Avalanche", LINKUSD: "Chainlink",
};

const heatmapSymbols = nasdaq100.map((s) => s.symbol);

type EquityDashboardPayload = Omit<DashboardPayload, "cryptos" | "generatedAt">;
type CryptoDashboardPayload = Pick<DashboardPayload, "cryptos">;

export async function GET() {
  try {
    const equitiesTtl = isUsRegularSessionOpen()
      ? TTL.DASHBOARD_OPEN
      : getOffHoursFreezeTtlMs();
    const [equities, crypto] = await Promise.all([
      cached<EquityDashboardPayload>(
        "dashboard:equities:v2",
        equitiesTtl,
        fetchEquityDashboardData
      ),
      cached<CryptoDashboardPayload>(
        "dashboard:crypto",
        TTL.CRYPTO,
        fetchCryptoDashboardData
      ),
    ]);
    const data: DashboardPayload = {
      ...equities,
      ...crypto,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(data);
  } catch (e) {
    console.error("[Dashboard API]", e);
    return NextResponse.json({
      indices: [],
      sectors: [],
      cryptos: [],
      gainers: [],
      losers: [],
      actives: [],
      news: [],
      earnings: [],
      heatmapQuotes: {},
      generatedAt: new Date().toISOString(),
    } satisfies DashboardPayload);
  }
}

async function fetchEquityDashboardData(): Promise<EquityDashboardPayload> {
  // FMP Starter: single quotes work, batch doesn't.
  // Gainers/losers/actives use correct /stable/biggest-gainers etc.
  // Sectors not available on Starter — derive from heatmap quotes.
  const [
    indexQuotesResult,
    gainersResult,
    losersResult,
    activesResult,
    heatmapResult,
    newsResult,
    sparklineResults,
  ] = await Promise.allSettled([
    fetchIndividualQuotes(INDEX_SYMBOLS),
    fmp.getGainers(),
    fmp.getLosers(),
    fmp.getMostActive(),
    fetchHeatmapQuotes(),
    fmp.getMarketNews(20),
    fetchIndexSparklines(),
  ]);

  // ── Indices ──────────────────────────────────────────
  const indexMap = indexQuotesResult.status === "fulfilled"
    ? indexQuotesResult.value
    : new Map<string, StockQuote>();
  const sparklines = sparklineResults.status === "fulfilled"
    ? sparklineResults.value
    : {};

  const indices: IndexData[] = INDEX_SYMBOLS.map((sym) => {
    const q = indexMap.get(sym);
    return {
      symbol: sym,
      name: INDEX_NAMES[sym] ?? sym,
      value: q?.price ?? 0,
      change: q?.change ?? 0,
      changePct: q?.changePct ?? 0,
      sparkline: sparklines[sym] ?? [],
    };
  });

  // ── Movers (from FMP biggest-gainers / biggest-losers / most-actives) ──
  const toMover = (g: { symbol: string; name: string; price: number; change: number; changesPercentage: number }): MarketMover => ({
    symbol: g.symbol,
    name: g.name,
    price: g.price,
    change: g.change,
    changePct: g.changesPercentage,
  });

  const rawGainers = gainersResult.status === "fulfilled" ? gainersResult.value : [];
  const rawLosers = losersResult.status === "fulfilled" ? losersResult.value : [];
  const rawActives = activesResult.status === "fulfilled" ? activesResult.value : [];

  const gainers = rawGainers.slice(0, 10).map(toMover);
  const losers = rawLosers.slice(0, 10).map(toMover);
  const actives = rawActives.slice(0, 10).map(toMover);

  // ── Heatmap quotes ─────────────────────────────────
  const rawHeatmap = heatmapResult.status === "fulfilled"
    ? heatmapResult.value
    : new Map<string, StockQuote>();
  const heatmapQuotes: Record<string, { price: number; changePct: number; marketCap: number }> = {};
  for (const [sym, q] of rawHeatmap) {
    heatmapQuotes[sym] = {
      price: q.price,
      changePct: q.changePct,
      marketCap: q.marketCap,
    };
  }

  // ── Sectors (derived from heatmap quotes by averaging per sector) ──
  const sectorTotals = new Map<string, { totalPct: number; count: number }>();
  for (const stock of nasdaq100) {
    const q = rawHeatmap.get(stock.symbol);
    if (!q) continue;
    const existing = sectorTotals.get(stock.sector) ?? { totalPct: 0, count: 0 };
    existing.totalPct += q.changePct;
    existing.count++;
    sectorTotals.set(stock.sector, existing);
  }
  const sectors: SectorPerformance[] = Array.from(sectorTotals.entries()).map(
    ([sector, { totalPct, count }]) => ({
      sector,
      changesPercentage: count > 0 ? totalPct / count : 0,
    })
  );

  // ── News (from fmp-articles) ───────────────────────
  const rawArticles = newsResult.status === "fulfilled" ? newsResult.value : [];
  const news: NewsArticle[] = rawArticles.slice(0, 20).map((n, i) => {
    // Extract ticker symbols from "NYSE:MTZ, NASDAQ:AAPL" format
    const tickers = n.tickers
      ? n.tickers.split(",").map((t) => t.trim().split(":").pop()!).filter(Boolean)
      : [];
    return {
      id: `fmp-${i}`,
      title: n.title,
      summary: n.content?.replace(/<[^>]*>/g, "").slice(0, 200) ?? "",
      source: n.author ?? n.site ?? "Market News",
      url: n.link ?? "",
      image: n.image ?? null,
      publishedAt: n.date,
      symbols: tickers,
      sentiment: null,
    };
  });

  // ── Earnings (not available on Starter plan) ──────
  const earnings: EarningsEntry[] = [];

  return {
    indices,
    sectors,
    gainers,
    losers,
    actives,
    news,
    earnings,
    heatmapQuotes,
  };
}

async function fetchCryptoDashboardData(): Promise<CryptoDashboardPayload> {
  const cryptoMap = await fetchCryptoQuotes().catch(
    () => new Map<string, StockQuote>()
  );
  const cryptos: CryptoQuote[] = CRYPTO_SYMBOLS.map((sym) => {
    const q = cryptoMap.get(sym);
    return {
      symbol: sym,
      name: CRYPTO_NAMES[sym] ?? sym,
      price: q?.price ?? 0,
      change: q?.change ?? 0,
      changePct: q?.changePct ?? 0,
      marketCap: q?.marketCap ?? 0,
      volume24h: q?.volume ?? 0,
      sparkline: [],
    };
  });

  return { cryptos };
}

// ── Helpers ──────────────────────────────────────────────────

/** Fetch quotes individually via provider chain (Finnhub → FMP fallback) */
async function fetchIndividualQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();
  await Promise.allSettled(
    symbols.map(async (sym) => {
      const q = await getStockQuote(sym);
      if (q) results.set(sym, q);
    })
  );
  return results;
}

/** Fetch NASDAQ 100 heatmap quotes — FMP direct, all in parallel (300 calls/min limit) */
async function fetchHeatmapQuotes(): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();

  await Promise.allSettled(
    heatmapSymbols.map(async (sym) => {
      try {
        const data = await fmp.getQuote(sym);
        const q = data[0];
        if (q) {
          results.set(sym, {
            symbol: sym,
            name: q.name ?? sym,
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
          });
        }
      } catch { /* skip failed symbol */ }
    })
  );

  return results;
}

/** Fetch crypto quotes individually via FMP (Starter plan supports crypto) */
async function fetchCryptoQuotes(): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();
  await Promise.allSettled(
    CRYPTO_SYMBOLS.map(async (sym) => {
      try {
        const data = await fmp.getQuote(sym);
        const q = data[0];
        if (q) {
          results.set(sym, {
            symbol: sym,
            name: q.name ?? sym,
            price: q.price,
            change: q.change,
            changePct: q.changesPercentage ?? q.changePercentage ?? 0,
            volume: q.volume ?? 0,
            marketCap: q.marketCap ?? 0,
            peRatio: null,
            week52High: q.yearHigh ?? 0,
            week52Low: q.yearLow ?? 0,
            exchange: q.exchange ?? "",
            updatedAt: new Date().toISOString(),
          });
        }
      } catch { /* skip failed crypto */ }
    })
  );
  return results;
}

async function fetchIndexSparklines(): Promise<Record<string, number[]>> {
  const result: Record<string, number[]> = {};
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 86_400_000);
  const from = weekAgo.toISOString().split("T")[0];
  const to = today.toISOString().split("T")[0];

  const settled = await Promise.allSettled(
    INDEX_SYMBOLS.map(async (sym) => {
      const bars = await fmp.getHistoricalDaily(sym, from, to);
      return { sym, closes: bars.map((b) => b.close).reverse() };
    })
  );

  for (const r of settled) {
    if (r.status === "fulfilled" && r.value.closes.length > 0) {
      result[r.value.sym] = r.value.closes;
    }
  }

  return result;
}
