import { z } from "zod/v4";

const BASE_URL = "https://api.twelvedata.com";
const API_KEY = () => process.env.TWELVE_DATA_API_KEY!;

async function fetchWithRetry(url: string, retries = 1): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(url, {
        next: { revalidate: 60 },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) return res;
      if (res.status === 429) throw new Error("Twelve Data rate limited");
      if (res.status >= 500 && i < retries) continue;
      throw new Error(`Twelve Data API error: ${res.status}`);
    } catch (e) {
      clearTimeout(timeout);
      if (i >= retries) throw e;
    }
  }
  throw new Error("Twelve Data API: max retries exceeded");
}

// ── Schemas ──────────────────────────────────────────────────

const TimeSeriesSchema = z.object({
  meta: z.object({
    symbol: z.string(),
    interval: z.string(),
    currency: z.string().optional(),
    exchange: z.string().optional(),
    type: z.string().optional(),
  }),
  values: z.array(
    z.object({
      datetime: z.string(),
      open: z.string(),
      high: z.string(),
      low: z.string(),
      close: z.string(),
      volume: z.string(),
    })
  ),
  status: z.string().optional(),
});

const QuoteSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  exchange: z.string(),
  datetime: z.string(),
  open: z.string(),
  high: z.string(),
  low: z.string(),
  close: z.string(),
  volume: z.string(),
  previous_close: z.string(),
  change: z.string(),
  percent_change: z.string(),
  fifty_two_week: z
    .object({
      low: z.string(),
      high: z.string(),
    })
    .optional(),
});

// ── API Functions ────────────────────────────────────────────

export async function getTimeSeries(
  symbol: string,
  interval: string = "1day",
  outputsize: number = 252
) {
  const res = await fetchWithRetry(
    `${BASE_URL}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${API_KEY()}`
  );
  const data = await res.json();
  return TimeSeriesSchema.parse(data);
}

export async function getQuote(symbol: string) {
  const res = await fetchWithRetry(
    `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY()}`
  );
  const data = await res.json();
  return QuoteSchema.parse(data);
}

export type TwelveDataTimeSeries = z.infer<typeof TimeSeriesSchema>;
export type TwelveDataQuote = z.infer<typeof QuoteSchema>;
