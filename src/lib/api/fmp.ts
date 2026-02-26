import { z } from "zod/v4";

const BASE_URL = "https://financialmodelingprep.com/stable";
const API_KEY = () => process.env.FMP_API_KEY!;

async function fetchWithRetry(url: string, retries = 1): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url, {
        next: { revalidate: 60 },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) return res;
      if (res.status === 429) throw new Error("FMP rate limited");
      if (res.status >= 500 && i < retries) continue;
      throw new Error(`FMP API error: ${res.status}`);
    } catch (e) {
      clearTimeout(timeout);
      if (i >= retries) throw e;
    }
  }
  throw new Error("FMP API: max retries exceeded");
}

// ── Schemas ──────────────────────────────────────────────────

const ProfileSchema = z.array(
  z.object({
    symbol: z.string(),
    companyName: z.string(),
    description: z.string().optional().default(""),
    sector: z.string().nullable().optional(),
    industry: z.string().nullable().optional(),
    exchange: z.string().nullable().optional(),
    mktCap: z.number().nullable().optional(),
    marketCap: z.number().nullable().optional(),
    fullTimeEmployees: z.union([z.string(), z.number()]).nullable().optional(),
    website: z.string().nullable().optional(),
    ceo: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    ipoDate: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    price: z.number().nullable().optional(),
    changes: z.number().nullable().optional(),
    beta: z.number().nullable().optional(),
    volAvg: z.number().nullable().optional(),
    averageVolume: z.number().nullable().optional(),
    dcfDiff: z.number().nullable().optional(),
    dcf: z.number().nullable().optional(),
  })
);

// Stable API returns a flat array (not { symbol, historical: [...] })
const HistoricalBarSchema = z.object({
  date: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
  change: z.number().optional(),
  changePercent: z.number().optional(),
  vwap: z.number().optional(),
});

const HistoricalSchema = z.array(HistoricalBarSchema);

const QuoteSchema = z.array(
  z.object({
    symbol: z.string(),
    name: z.string().nullable().optional(),
    price: z.number(),
    changesPercentage: z.number().nullable().optional(),
    changePercentage: z.number().nullable().optional(),
    change: z.number(),
    dayLow: z.number().nullable().optional(),
    dayHigh: z.number().nullable().optional(),
    yearHigh: z.number().nullable().optional(),
    yearLow: z.number().nullable().optional(),
    marketCap: z.number().nullable().optional(),
    volume: z.number().nullable().optional(),
    avgVolume: z.number().nullable().optional(),
    exchange: z.string().nullable().optional(),
    open: z.number().nullable().optional(),
    previousClose: z.number().nullable().optional(),
    eps: z.number().nullable().optional(),
    pe: z.number().nullable().optional(),
  })
);

const KeyMetricsSchema = z.array(
  z.object({
    symbol: z.string().optional(),
    date: z.string().optional(),
    peRatio: z.number().nullable().optional(),
    peRatioTTM: z.number().nullable().optional(),
    pegRatio: z.number().nullable().optional(),
    pegRatioTTM: z.number().nullable().optional(),
    priceToBookRatio: z.number().nullable().optional(),
    priceToBookRatioTTM: z.number().nullable().optional(),
    priceToSalesRatio: z.number().nullable().optional(),
    priceToSalesRatioTTM: z.number().nullable().optional(),
    enterpriseValueOverEBITDA: z.number().nullable().optional(),
    evToEBITDATTM: z.number().nullable().optional(),
    dividendYield: z.number().nullable().optional(),
    dividendYieldTTM: z.number().nullable().optional(),
    earningsYield: z.number().nullable().optional(),
    earningsYieldTTM: z.number().nullable().optional(),
    debtToEquity: z.number().nullable().optional(),
    debtToEquityTTM: z.number().nullable().optional(),
    currentRatio: z.number().nullable().optional(),
    currentRatioTTM: z.number().nullable().optional(),
    roe: z.number().nullable().optional(),
    roeTTM: z.number().nullable().optional(),
    roic: z.number().nullable().optional(),
    roicTTM: z.number().nullable().optional(),
    marketCap: z.number().nullable().optional(),
  }).passthrough()
);

const GainersLosersSchema = z.array(
  z.object({
    symbol: z.string(),
    name: z.string(),
    change: z.number(),
    price: z.number(),
    changesPercentage: z.number(),
  })
);

const NewsSchema = z.array(
  z.object({
    symbol: z.string().optional(),
    publishedDate: z.string(),
    title: z.string(),
    image: z.string().nullable().optional(),
    site: z.string(),
    text: z.string(),
    url: z.string(),
  })
);

// ── API Functions ────────────────────────────────────────────

export async function getQuote(symbol: string) {
  const res = await fetchWithRetry(
    `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY()}`
  );
  const data = await res.json();
  return QuoteSchema.parse(data);
}

export async function getProfile(symbol: string) {
  const res = await fetchWithRetry(
    `${BASE_URL}/profile?symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY()}`
  );
  const data = await res.json();
  return ProfileSchema.parse(data);
}

export async function getHistoricalDaily(symbol: string, from?: string, to?: string) {
  let url = `${BASE_URL}/historical-price-eod/full?symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY()}`;
  if (from) url += `&from=${from}`;
  if (to) url += `&to=${to}`;
  const res = await fetchWithRetry(url);
  const data = await res.json();
  // Stable API returns flat array, not { symbol, historical: [...] }
  return HistoricalSchema.parse(data);
}

export async function getKeyMetrics(symbol: string) {
  const res = await fetchWithRetry(
    `${BASE_URL}/ratios-ttm?symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY()}`
  );
  const data = await res.json();
  return KeyMetricsSchema.parse(data);
}

export async function getKeyMetricsAlt(symbol: string) {
  const res = await fetchWithRetry(
    `${BASE_URL}/key-metrics-ttm?symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY()}`
  );
  const data = await res.json();
  return KeyMetricsSchema.parse(data);
}

export async function getGainers() {
  const res = await fetchWithRetry(
    `${BASE_URL}/gainers?apikey=${API_KEY()}`
  );
  const data = await res.json();
  return GainersLosersSchema.parse(data);
}

export async function getLosers() {
  const res = await fetchWithRetry(
    `${BASE_URL}/losers?apikey=${API_KEY()}`
  );
  const data = await res.json();
  return GainersLosersSchema.parse(data);
}

export async function getMostActive() {
  const res = await fetchWithRetry(
    `${BASE_URL}/actives?apikey=${API_KEY()}`
  );
  const data = await res.json();
  return GainersLosersSchema.parse(data);
}

export async function getStockNews(symbol: string, limit = 10) {
  const res = await fetchWithRetry(
    `${BASE_URL}/news?symbol=${encodeURIComponent(symbol)}&limit=${limit}&apikey=${API_KEY()}`
  );
  const data = await res.json();
  return NewsSchema.parse(data);
}

export type FMPQuote = z.infer<typeof QuoteSchema>[number];
export type FMPProfile = z.infer<typeof ProfileSchema>[number];
export type FMPKeyMetrics = z.infer<typeof KeyMetricsSchema>[number];
