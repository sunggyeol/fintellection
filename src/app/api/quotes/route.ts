import { NextRequest, NextResponse } from "next/server";
import { getBatchQuotes } from "@/lib/api/provider-chain";

/**
 * Batch quote endpoint: /api/quotes?symbols=AAPL,MSFT,GOOGL
 * Returns a map of symbol → quote data in a single request.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("symbols");
  if (!raw) {
    return NextResponse.json({ error: "symbols is required" }, { status: 400 });
  }

  const symbols = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 40); // cap at 40

  const quotes = await getBatchQuotes(symbols);

  // Convert Map to plain object for JSON
  const result: Record<string, unknown> = {};
  quotes.forEach((q, sym) => {
    result[sym] = q;
  });

  return NextResponse.json(result);
}
