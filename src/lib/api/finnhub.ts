import { z } from "zod/v4";

const BASE_URL = "https://finnhub.io/api/v1";
const API_KEY = () => process.env.FINNHUB_API_KEY!;

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
      if (res.status === 429) throw new Error("Finnhub rate limited");
      if (res.status >= 500 && i < retries) continue;
      throw new Error(`Finnhub API error: ${res.status}`);
    } catch (e) {
      clearTimeout(timeout);
      if (i >= retries) throw e;
    }
  }
  throw new Error("Finnhub API: max retries exceeded");
}

// ── Schemas ──────────────────────────────────────────────────

const QuoteSchema = z.object({
  c: z.number(),  // current price
  d: z.number().nullable(),  // change
  dp: z.number().nullable(), // change percent
  h: z.number(),  // high
  l: z.number(),  // low
  o: z.number(),  // open
  pc: z.number(), // previous close
  t: z.number(),  // timestamp
});

const SearchResultSchema = z.object({
  count: z.number(),
  result: z.array(
    z.object({
      description: z.string(),
      displaySymbol: z.string(),
      symbol: z.string(),
      type: z.string(),
    })
  ),
});

const NewsSchema = z.array(
  z.object({
    category: z.string(),
    datetime: z.number(),
    headline: z.string(),
    id: z.number(),
    image: z.string(),
    related: z.string(),
    source: z.string(),
    summary: z.string(),
    url: z.string(),
  })
);

// ── API Functions ────────────────────────────────────────────

export async function getQuote(symbol: string) {
  const res = await fetchWithRetry(
    `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${API_KEY()}`
  );
  const data = await res.json();
  return QuoteSchema.parse(data);
}

export async function searchSymbols(query: string) {
  const res = await fetchWithRetry(
    `${BASE_URL}/search?q=${encodeURIComponent(query)}&token=${API_KEY()}`
  );
  const data = await res.json();
  return SearchResultSchema.parse(data);
}

export async function getCompanyNews(
  symbol: string,
  from: string,
  to: string
) {
  const res = await fetchWithRetry(
    `${BASE_URL}/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&token=${API_KEY()}`
  );
  const data = await res.json();
  return NewsSchema.parse(data);
}

const CandleSchema = z.object({
  c: z.array(z.number()), // close
  h: z.array(z.number()), // high
  l: z.array(z.number()), // low
  o: z.array(z.number()), // open
  v: z.array(z.number()), // volume
  t: z.array(z.number()), // timestamps
  s: z.string(),           // status: "ok" or "no_data"
});

export async function getCandles(
  symbol: string,
  resolution: string,
  from: number,
  to: number
) {
  const res = await fetchWithRetry(
    `${BASE_URL}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}&token=${API_KEY()}`
  );
  const data = await res.json();
  return CandleSchema.parse(data);
}

export type FinnhubQuote = z.infer<typeof QuoteSchema>;
export type FinnhubSearchResult = z.infer<typeof SearchResultSchema>;
