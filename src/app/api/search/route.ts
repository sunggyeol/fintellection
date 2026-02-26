import { NextRequest, NextResponse } from "next/server";
import { searchStocks } from "@/lib/api/provider-chain";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.length < 1) {
    return NextResponse.json([]);
  }

  const results = await searchStocks(query);
  return NextResponse.json(results);
}
