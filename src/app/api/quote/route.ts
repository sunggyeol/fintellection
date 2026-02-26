import { NextRequest, NextResponse } from "next/server";
import { getStockQuote } from "@/lib/api/provider-chain";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }

  const quote = await getStockQuote(symbol.toUpperCase());
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  return NextResponse.json(quote);
}
