import { NextResponse } from "next/server";
import { getBatchQuotes } from "@/lib/api/provider-chain";
import { cached, TTL } from "@/lib/api/cache";

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
    const data = await cached("market-overview", TTL.MARKET_OVERVIEW, async () => {
      const quotes = await getBatchQuotes(TRACKED_SYMBOLS);

      const entries: MoverEntry[] = [];
      for (const symbol of TRACKED_SYMBOLS) {
        const q = quotes.get(symbol);
        if (!q) continue;
        entries.push({
          symbol,
          name: NAMES[symbol] ?? q.name ?? symbol,
          price: q.price,
          change: q.change,
          changePct: q.changePct,
        });
      }

      const sorted = [...entries].sort((a, b) => b.changePct - a.changePct);

      return {
        gainers: sorted.filter((e) => e.changePct > 0).slice(0, 10),
        losers: sorted
          .filter((e) => e.changePct < 0)
          .reverse()
          .slice(0, 10),
        actives: [...entries]
          .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
          .slice(0, 10),
        all: entries,
      };
    });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ gainers: [], losers: [], actives: [], all: [] });
  }
}
