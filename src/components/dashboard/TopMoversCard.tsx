"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoverRow } from "./MoverRow";
import { cn } from "@/lib/utils";
import type { MarketMover } from "@/types/financial";

interface TopMoversCardProps {
  gainers: MarketMover[];
  losers: MarketMover[];
  actives: MarketMover[];
  loading?: boolean;
  className?: string;
}

function ColumnHeaders() {
  return (
    <div className="flex min-w-0 items-center gap-2 border-b border-border px-3 py-1.5 text-[10px] text-muted-foreground sm:gap-3 sm:text-[11px]">
      <span className="min-w-0 flex-1">Name</span>
      <span className="w-14 shrink-0 text-right sm:w-20">Price</span>
      <span className="w-12 shrink-0 text-right sm:w-16">Chg %</span>
    </div>
  );
}

export function TopMoversCard({ gainers, losers, actives, loading, className }: TopMoversCardProps) {
  if (loading) {
    return (
      <div className="border border-border bg-card">
        <div className="p-3 space-y-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-7 animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border border-border bg-card", className)}>
      <Tabs defaultValue="gainers">
        <div className="border-b border-border px-3 pt-1">
          <TabsList variant="line" className="h-8 gap-0 p-0">
            <TabsTrigger value="gainers" className="px-2 text-[11px] sm:px-3 sm:text-[12px]">
              Gainers
            </TabsTrigger>
            <TabsTrigger value="losers" className="px-2 text-[11px] sm:px-3 sm:text-[12px]">
              Losers
            </TabsTrigger>
            <TabsTrigger value="active" className="px-2 text-[11px] sm:px-3 sm:text-[12px]">
              <span className="hidden sm:inline">Most Active</span>
              <span className="sm:hidden">Active</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="gainers" className="mt-0">
          <ColumnHeaders />
          <div className="py-0.5">
            {gainers.slice(0, 8).map((m) => (
              <MoverRow key={m.symbol} mover={m} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="losers" className="mt-0">
          <ColumnHeaders />
          <div className="py-0.5">
            {losers.slice(0, 8).map((m) => (
              <MoverRow key={m.symbol} mover={m} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          <ColumnHeaders />
          <div className="py-0.5">
            {actives.slice(0, 8).map((m) => (
              <MoverRow key={m.symbol} mover={m} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
