"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoverRow } from "./MoverRow";
import type { MarketMover } from "@/types/financial";

interface MarketData {
  gainers: MarketMover[];
  losers: MarketMover[];
  actives: MarketMover[];
}

function ColumnHeaders() {
  return (
    <div className="flex min-w-0 items-center gap-2 border-b border-border px-3 py-1.5 text-[11px] text-muted-foreground sm:gap-3">
      <span className="w-14 shrink-0 sm:w-16">Symbol</span>
      <span className="min-w-0 flex-1">Name</span>
      <span className="w-16 shrink-0 text-right sm:w-20">Price</span>
      <span className="w-14 shrink-0 text-right sm:w-16">Change %</span>
    </div>
  );
}

export function MarketOverviewCard() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/market-overview")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="border border-border bg-card">
        <div className="p-3 space-y-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-shimmer h-8" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="border border-border bg-card py-8 text-center text-[13px] text-muted-foreground">
        Market data unavailable
      </div>
    );
  }

  return (
    <div className="border border-border bg-card">
      <Tabs defaultValue="gainers">
        <div className="border-b border-border px-3 pt-1">
          <TabsList variant="line" className="h-8 gap-0 p-0">
            <TabsTrigger value="gainers" className="px-3 text-[13px]">
              Gainers
            </TabsTrigger>
            <TabsTrigger value="losers" className="px-3 text-[13px]">
              Losers
            </TabsTrigger>
            <TabsTrigger value="active" className="px-3 text-[13px]">
              Most Active
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="gainers" className="mt-0">
          <ColumnHeaders />
          <div className="py-0.5">
            {data.gainers.map((m) => (
              <MoverRow key={m.symbol} mover={m} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="losers" className="mt-0">
          <ColumnHeaders />
          <div className="py-0.5">
            {data.losers.map((m) => (
              <MoverRow key={m.symbol} mover={m} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="active" className="mt-0">
          <ColumnHeaders />
          <div className="py-0.5">
            {data.actives.map((m) => (
              <MoverRow key={m.symbol} mover={m} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
