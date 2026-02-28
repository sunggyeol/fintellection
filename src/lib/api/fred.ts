import { z } from "zod/v4";

const BASE_URL = "https://api.stlouisfed.org/fred";
const API_KEY = () => process.env.FRED_API_KEY!;

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) return res;
      if (res.status === 429) throw new Error("FRED rate limited");
      if (res.status >= 500 && i < retries) continue;
      throw new Error(`FRED API error: ${res.status}`);
    } catch (e) {
      clearTimeout(timeout);
      if (i >= retries) throw e;
    }
  }
  throw new Error("FRED API: max retries exceeded");
}

// ── Schemas ──────────────────────────────────────────────────

const ObservationSchema = z.object({
  date: z.string(),
  value: z.string(), // FRED returns numbers as strings; "." means missing
});

const SeriesObservationsSchema = z.object({
  realtime_start: z.string(),
  realtime_end: z.string(),
  observation_start: z.string(),
  observation_end: z.string(),
  units: z.string(),
  count: z.number(),
  offset: z.number(),
  limit: z.number(),
  observations: z.array(ObservationSchema),
});

const SeriesInfoSchema = z.object({
  seriess: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      observation_start: z.string(),
      observation_end: z.string(),
      frequency: z.string(),
      frequency_short: z.string(),
      units: z.string(),
      units_short: z.string(),
      seasonal_adjustment: z.string(),
      seasonal_adjustment_short: z.string(),
      last_updated: z.string(),
      popularity: z.number(),
      notes: z.string().optional(),
    })
  ),
});

// ── API Functions ────────────────────────────────────────────

export async function getSeriesObservations(
  seriesId: string,
  options?: {
    observationStart?: string; // YYYY-MM-DD
    observationEnd?: string;   // YYYY-MM-DD
    limit?: number;
    sortOrder?: "asc" | "desc";
    units?: string;
    frequency?: string;
  }
) {
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: API_KEY(),
    file_type: "json",
  });
  if (options?.observationStart) params.set("observation_start", options.observationStart);
  if (options?.observationEnd) params.set("observation_end", options.observationEnd);
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.sortOrder) params.set("sort_order", options.sortOrder);
  if (options?.units) params.set("units", options.units);
  if (options?.frequency) params.set("frequency", options.frequency);

  const res = await fetchWithRetry(`${BASE_URL}/series/observations?${params}`);
  const data = await res.json();
  return SeriesObservationsSchema.parse(data);
}

export async function getSeriesInfo(seriesId: string) {
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: API_KEY(),
    file_type: "json",
  });
  const res = await fetchWithRetry(`${BASE_URL}/series?${params}`);
  const data = await res.json();
  return SeriesInfoSchema.parse(data);
}

// ── Parsed Helpers ───────────────────────────────────────────

export interface FredObservation {
  date: string;
  value: number | null;
}

/** Parse FRED string observations to typed numbers (filtering "." missing values) */
export function parseObservations(
  raw: z.infer<typeof SeriesObservationsSchema>
): FredObservation[] {
  return raw.observations.map((obs) => ({
    date: obs.date,
    value: obs.value === "." ? null : parseFloat(obs.value),
  }));
}

// ── Pre-cacheable Series ─────────────────────────────────────

export const KEY_MACRO_SERIES = {
  FEDFUNDS: "Federal Funds Effective Rate",
  CPIAUCSL: "Consumer Price Index for All Urban Consumers",
  GDP: "Gross Domestic Product",
  UNRATE: "Unemployment Rate",
  DGS10: "10-Year Treasury Constant Maturity Rate",
  DGS2: "2-Year Treasury Constant Maturity Rate",
  T10Y2Y: "10-Year Treasury Minus 2-Year Treasury",
  VIXCLS: "CBOE Volatility Index",
} as const;

export type FredSeriesId = keyof typeof KEY_MACRO_SERIES;
export type FredSeriesInfo = z.infer<typeof SeriesInfoSchema>["seriess"][number];
