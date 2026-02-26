import { NextRequest, NextResponse } from "next/server";
import { getStockNews } from "@/lib/api/provider-chain";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }

  const news = await getStockNews(symbol.toUpperCase());
  return NextResponse.json(news);
}
