"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { MarketStatusBar } from "./MarketStatusBar";
import { AIMarketSummary } from "./AIMarketSummary";
import { IndexTilesRow } from "./IndexTilesRow";
import { WatchlistDashboardWidget } from "./WatchlistDashboardWidget";
import { RecentResearchCard } from "./RecentResearchCard";
import { CryptoOverview } from "./CryptoOverview";
import { SectorPerformanceBars } from "./SectorPerformanceBars";
import { TopMoversCard } from "./TopMoversCard";
import { NewsFeed } from "./NewsFeed";
import { EarningsCalendar } from "./EarningsCalendar";

export function DashboardClient() {
  const { data, loading } = useDashboard();

  return (
    <div>
      {/* Sticky market status */}
      <MarketStatusBar />

      <div className="p-4">
        {/* AI Summary */}
        <section className="mb-4">
          <AIMarketSummary dashboard={data} />
        </section>

        {/* Top row: Indices + Crypto (left) aligned with TopMovers (right) */}
        <div className="mb-4 flex gap-4">
          {/* Left: Indices + Crypto stacked, stretch to match sidebar */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <IndexTilesRow indices={data?.indices} loading={loading} />
            <CryptoOverview cryptos={data?.cryptos ?? []} loading={loading} />
          </div>

          {/* Right: TopMovers — hidden below xl */}
          <div className="hidden w-[300px] shrink-0 xl:block">
            <TopMoversCard
              gainers={data?.gainers ?? []}
              losers={data?.losers ?? []}
              actives={data?.actives ?? []}
              loading={loading}
              className="h-full"
            />
          </div>
        </div>

        {/* 2-column layout: main + sidebar */}
        <div className="flex gap-4">
          {/* Main content */}
          <div className="min-w-0 flex-1 space-y-4">
            {/* Sector Performance */}
            <SectorPerformanceBars sectors={data?.sectors ?? []} loading={loading} />

            {/* Watchlist + Recent Research */}
            <div className="grid gap-4 lg:grid-cols-2">
              <WatchlistDashboardWidget />
              <RecentResearchCard />
            </div>

            {/* Mobile: sidebar sections below main (hidden on xl+) */}
            <div className="space-y-4 xl:hidden">
              <TopMoversCard
                gainers={data?.gainers ?? []}
                losers={data?.losers ?? []}
                actives={data?.actives ?? []}
                loading={loading}
              />
              <NewsFeed articles={data?.news ?? []} loading={loading} />
              <EarningsCalendar entries={data?.earnings ?? []} loading={loading} />
            </div>
          </div>

          {/* Sidebar — hidden below xl */}
          <div className="hidden w-[300px] shrink-0 space-y-4 xl:block">
            <NewsFeed articles={data?.news ?? []} loading={loading} />
            <EarningsCalendar entries={data?.earnings ?? []} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
