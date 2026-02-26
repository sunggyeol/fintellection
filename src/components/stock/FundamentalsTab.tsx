"use client";

import { useEffect, useState } from "react";
import { formatRatio, formatMarketCap, formatPercent } from "@/lib/utils";

interface FundamentalsTabProps {
  symbol: string;
}

interface FundamentalsData {
  profile: {
    companyName: string;
    description: string;
    sector: string | null;
    industry: string | null;
    exchange: string | null;
    mktCap: number | null;
    fullTimeEmployees: string | null;
    website: string | null;
    ceo: string | null;
    country: string | null;
  } | null;
  metrics: {
    peRatio: number | null;
    priceToBookRatio: number | null;
    priceToSalesRatio: number | null;
    enterpriseValueOverEBITDA: number | null;
    dividendYield: number | null;
    debtToEquity: number | null;
    currentRatio: number | null;
    roe: number | null;
    roic: number | null;
  } | null;
}

export function FundamentalsTab({ symbol }: FundamentalsTabProps) {
  const [data, setData] = useState<FundamentalsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/fundamentals?symbol=${symbol}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-shimmer h-8" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Fundamentals unavailable
      </p>
    );
  }

  const { profile, metrics } = data;

  const rows: [string, string][] = [];
  if (profile) {
    if (profile.sector) rows.push(["Sector", profile.sector]);
    if (profile.industry) rows.push(["Industry", profile.industry]);
    if (profile.mktCap) rows.push(["Market Cap", formatMarketCap(profile.mktCap)]);
    if (profile.fullTimeEmployees)
      rows.push(["Employees", Number(profile.fullTimeEmployees).toLocaleString()]);
    if (profile.ceo) rows.push(["CEO", profile.ceo]);
    if (profile.country) rows.push(["Country", profile.country]);
  }
  if (metrics) {
    if (metrics.peRatio) rows.push(["P/E Ratio", formatRatio(metrics.peRatio)]);
    if (metrics.priceToBookRatio)
      rows.push(["P/B Ratio", formatRatio(metrics.priceToBookRatio)]);
    if (metrics.priceToSalesRatio)
      rows.push(["P/S Ratio", formatRatio(metrics.priceToSalesRatio)]);
    if (metrics.enterpriseValueOverEBITDA)
      rows.push(["EV/EBITDA", formatRatio(metrics.enterpriseValueOverEBITDA)]);
    if (metrics.dividendYield)
      rows.push(["Dividend Yield", formatPercent(metrics.dividendYield * 100)]);
    if (metrics.roe) rows.push(["ROE", formatPercent(metrics.roe * 100)]);
    if (metrics.debtToEquity)
      rows.push(["Debt/Equity", formatRatio(metrics.debtToEquity)]);
    if (metrics.currentRatio)
      rows.push(["Current Ratio", formatRatio(metrics.currentRatio)]);
  }

  return (
    <div>
      {profile?.description && (
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground line-clamp-4">
          {profile.description}
        </p>
      )}
      <div className="divide-y divide-border">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between py-2 text-sm"
          >
            <span className="text-muted-foreground">{label}</span>
            <span className="font-financial font-medium text-foreground">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
