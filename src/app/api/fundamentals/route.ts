import { NextRequest, NextResponse } from "next/server";
import * as fmp from "@/lib/api/fmp";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }

  // Helper to extract a number from an object with varying field names
  const get = (obj: Record<string, unknown>, ...keys: string[]): number | null => {
    for (const key of keys) {
      const v = obj[key];
      if (typeof v === "number" && !isNaN(v)) return v;
    }
    return null;
  };

  try {
    const [profileRes, ratiosRes, metricsRes] = await Promise.allSettled([
      fmp.getProfile(symbol.toUpperCase()),
      fmp.getKeyMetrics(symbol.toUpperCase()),       // ratios-ttm (PE, PB, PS, dividendYield)
      fmp.getKeyMetricsAlt(symbol.toUpperCase()),     // key-metrics-ttm (ROE, ROIC, EV/EBITDA)
    ]);

    const p =
      profileRes.status === "fulfilled" ? profileRes.value[0] ?? null : null;

    // Merge both metrics endpoints into one object
    const ratios: Record<string, unknown> =
      ratiosRes.status === "fulfilled" && ratiosRes.value[0]
        ? { ...ratiosRes.value[0] }
        : {};
    const km: Record<string, unknown> =
      metricsRes.status === "fulfilled" && metricsRes.value[0]
        ? { ...metricsRes.value[0] }
        : {};
    const m = { ...km, ...ratios };
    const hasMetrics = Object.keys(m).length > 1;

    return NextResponse.json({
      profile: p
        ? {
            companyName: p.companyName,
            description: p.description,
            sector: p.sector ?? null,
            industry: p.industry ?? null,
            exchange: p.exchange ?? null,
            mktCap: p.marketCap ?? p.mktCap ?? null,
            fullTimeEmployees: p.fullTimeEmployees
              ? String(p.fullTimeEmployees)
              : null,
            website: p.website ?? null,
            ceo: p.ceo ?? null,
            country: p.country ?? null,
          }
        : null,
      metrics: hasMetrics
        ? {
            peRatio: get(m, "priceToEarningsRatioTTM", "peRatioTTM", "peRatio"),
            priceToBookRatio: get(m, "priceToBookRatioTTM", "priceToBookRatio"),
            priceToSalesRatio: get(m, "priceToSalesRatioTTM", "priceToSalesRatio"),
            enterpriseValueOverEBITDA: get(m, "evToEBITDATTM", "enterpriseValueOverEBITDA"),
            dividendYield: get(m, "dividendYieldTTM", "dividendYield"),
            debtToEquity: get(m, "debtToEquityRatioTTM", "debtToEquityTTM", "debtToEquity"),
            currentRatio: get(m, "currentRatioTTM", "currentRatio"),
            roe: get(m, "returnOnEquityTTM", "roeTTM", "roe"),
            roic: get(m, "returnOnInvestedCapitalTTM", "roicTTM", "roic"),
          }
        : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch fundamentals" },
      { status: 500 }
    );
  }
}
