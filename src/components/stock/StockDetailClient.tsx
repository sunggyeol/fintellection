"use client";

import { useEffect, useState, useCallback } from "react";
import { StockChart } from "./StockChart";
import { PriceHeader } from "./PriceHeader";
import { TimeRangeSelector } from "./TimeRangeSelector";
import { FundamentalsTab } from "./FundamentalsTab";
import { NewsTab } from "./NewsTab";
import { AIInsightsPanel } from "./AIInsightsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { StockQuote, OHLCVBar, TimeRange, ChartType } from "@/types/financial";

interface StockDetailClientProps {
  symbol: string;
}

function getDateRange(range: TimeRange): { from: string; to: string } {
  const to = new Date();
  const from = new Date();

  switch (range) {
    case "1D": from.setDate(to.getDate() - 5); break;
    case "1W": from.setDate(to.getDate() - 7); break;
    case "1M": from.setMonth(to.getMonth() - 1); break;
    case "3M": from.setMonth(to.getMonth() - 3); break;
    case "6M": from.setMonth(to.getMonth() - 6); break;
    case "1Y": from.setFullYear(to.getFullYear() - 1); break;
    case "5Y": from.setFullYear(to.getFullYear() - 5); break;
    case "MAX": from.setFullYear(2000); break;
  }

  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export function StockDetailClient({ symbol }: StockDetailClientProps) {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [chartData, setChartData] = useState<OHLCVBar[]>([]);
  const [range, setRange] = useState<TimeRange>("1Y");
  const [chartType] = useState<ChartType>("candlestick");
  const [loading, setLoading] = useState(true);

  const isIndex = symbol.startsWith("^");

  // Fetch quote
  useEffect(() => {
    fetch(`/api/quote?symbol=${symbol}`)
      .then((r) => r.json())
      .then(setQuote)
      .catch(() => setQuote(null));
  }, [symbol]);

  // Fetch chart data
  const fetchChart = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getDateRange(range);
      const res = await fetch(
        `/api/history?symbol=${symbol}&from=${from}&to=${to}`
      );
      const data = await res.json();
      setChartData(data);
    } catch {
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [symbol, range]);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  return (
    <div className="p-3 sm:p-6">
      {/* Price Header */}
      {quote ? (
        <PriceHeader quote={quote} />
      ) : (
        <div className="mb-4 space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          {/* Chart */}
          <div className="mb-6 border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <TimeRangeSelector value={range} onChange={setRange} />
            </div>
            {loading ? (
              <Skeleton className="h-[280px] w-full sm:h-[400px]" />
            ) : chartData.length > 0 ? (
              <StockChart
                data={chartData}
                chartType={chartType}
                height={400}
                showVolume
              />
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground sm:h-[400px]">
                No chart data available
              </div>
            )}
          </div>

          {/* Tabs: Fundamentals (stocks only) + News */}
          <Tabs defaultValue={isIndex ? "news" : "fundamentals"} className="w-full">
            <TabsList className="mb-4 bg-surface">
              {!isIndex && (
                <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
              )}
              <TabsTrigger value="news">News</TabsTrigger>
            </TabsList>
            {!isIndex && (
              <TabsContent value="fundamentals">
                <div className="border border-border bg-card p-4">
                  <FundamentalsTab symbol={symbol} />
                </div>
              </TabsContent>
            )}
            <TabsContent value="news">
              <div className="border border-border bg-card p-4">
                <NewsTab symbol={symbol} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* AI Insights sidebar — desktop */}
        <div className="hidden lg:block">
          <AIInsightsPanel
            symbol={symbol}
            companyName={quote?.name}
          />
        </div>
      </div>

      {/* AI Insights — mobile (below tabs) */}
      <div className="mt-6 lg:hidden">
        <AIInsightsPanel
          symbol={symbol}
          companyName={quote?.name}
        />
      </div>
    </div>
  );
}
