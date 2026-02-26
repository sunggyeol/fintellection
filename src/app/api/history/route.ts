import { NextRequest, NextResponse } from "next/server";
import { getHistoricalData } from "@/lib/api/provider-chain";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  const from = request.nextUrl.searchParams.get("from") ?? undefined;
  const to = request.nextUrl.searchParams.get("to") ?? undefined;

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }

  const data = await getHistoricalData(symbol.toUpperCase(), from, to);
  return NextResponse.json(data);
}
