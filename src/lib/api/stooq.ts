const BASE_URL = "https://stooq.com/q/l/";

const SYMBOL_MAP: Record<string, string> = {
  "^DAX": "^dax",
  "^KOSPI": "^kospi",
  "^KOSDAQ": "^kosdaq",
  "^GSPC": "^spx",
  "^IXIC": "^ndq",
  "^FTSE": "^ukx",
  "^HSI": "^hsi",
  "^N225": "^n225",
  "^DJI": "^dji",
  "^RUT": "^rut",
  "^VIX": "^vix",
};

function toStooqSymbol(symbol: string): string {
  return SYMBOL_MAP[symbol] ?? symbol;
}

function parseNumber(value: string): number | null {
  if (!value || value === "N/D") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export interface StooqQuote {
  symbol: string;
  name: string;
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose: number | null;
  volume: number;
  change: number;
  changePct: number;
  date: string;
  time: string;
}

/**
 * Returns quote data from Stooq CSV endpoint or null when data is unavailable.
 * CSV format for f=sd2t2ohlcvpcn:
 * symbol,date,time,open,high,low,volume,previousClose,close,name
 */
export async function getQuote(symbol: string): Promise<StooqQuote | null> {
  const stooqSymbol = toStooqSymbol(symbol);
  const res = await fetch(
    `${BASE_URL}?s=${encodeURIComponent(stooqSymbol)}&f=sd2t2ohlcvpcn&e=csv`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`Stooq API error: ${res.status}`);

  const text = (await res.text()).trim();
  if (!text) return null;

  const row = text.split(/\r?\n/)[0];
  const cols = row.split(",");
  if (cols.length < 10) return null;

  const date = cols[1];
  const time = cols[2];
  const open = parseNumber(cols[3]);
  const high = parseNumber(cols[4]);
  const low = parseNumber(cols[5]);
  const volume = parseNumber(cols[6]);
  const previousClose = parseNumber(cols[7]);
  const close = parseNumber(cols[8]);
  const name = cols.slice(9).join(",").trim();

  if (!open || !high || !low || !close || !volume || date === "N/D" || time === "N/D") {
    return null;
  }

  const change = previousClose ? close - previousClose : 0;
  const changePct = previousClose ? (change / previousClose) * 100 : 0;

  return {
    symbol,
    name: name || symbol,
    open,
    high,
    low,
    close,
    previousClose,
    volume,
    change,
    changePct,
    date,
    time,
  };
}

