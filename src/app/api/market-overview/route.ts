import { NextResponse } from "next/server";

const FINNHUB_KEY = () => process.env.FINNHUB_API_KEY!;

// Popular tickers to track for movers
const TRACKED_SYMBOLS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA",
  "JPM", "V", "UNH", "HD", "PG", "CRM", "AMD", "NFLX",
  "ADBE", "INTC", "DIS", "BA", "NKE", "PYPL", "COIN",
  "PLTR", "SOFI", "UBER", "ABNB", "SNAP", "RIVN", "HOOD", "ROKU",
];

// Company names for display
const NAMES: Record<string, string> = {
  AAPL: "Apple", MSFT: "Microsoft", GOOGL: "Alphabet", AMZN: "Amazon",
  NVDA: "NVIDIA", META: "Meta", TSLA: "Tesla", JPM: "JPMorgan",
  V: "Visa", UNH: "UnitedHealth", HD: "Home Depot", PG: "Procter & Gamble",
  CRM: "Salesforce", AMD: "AMD", NFLX: "Netflix", ADBE: "Adobe",
  INTC: "Intel", DIS: "Disney", BA: "Boeing", NKE: "Nike",
  PYPL: "PayPal", COIN: "Coinbase", PLTR: "Palantir", SOFI: "SoFi",
  UBER: "Uber", ABNB: "Airbnb", SNAP: "Snap", RIVN: "Rivian",
  HOOD: "Robinhood", ROKU: "Roku",
};

interface MoverEntry {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
}

export async function GET() {
  try {
    // Fetch quotes in parallel from Finnhub (free tier: 60/min)
    const results = await Promise.allSettled(
      TRACKED_SYMBOLS.map(async (symbol) => {
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY()}`,
          { next: { revalidate: 120 } }
        );
        if (!res.ok) return null;
        const q = await res.json();
        if (!q.c || q.c === 0) return null;
        return {
          symbol,
          name: NAMES[symbol] ?? symbol,
          price: q.c,
          change: q.d ?? 0,
          changePct: q.dp ?? 0,
        } satisfies MoverEntry;
      })
    );

    const entries = results
      .filter(
        (r): r is PromiseFulfilledResult<MoverEntry> =>
          r.status === "fulfilled" && r.value !== null
      )
      .map((r) => r.value);

    const sorted = [...entries].sort((a, b) => b.changePct - a.changePct);

    return NextResponse.json({
      gainers: sorted.filter((e) => e.changePct > 0).slice(0, 10),
      losers: sorted
        .filter((e) => e.changePct < 0)
        .reverse()
        .slice(0, 10),
      actives: [...entries]
        .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
        .slice(0, 10),
      all: entries,
    });
  } catch {
    return NextResponse.json({ gainers: [], losers: [], actives: [], all: [] });
  }
}
