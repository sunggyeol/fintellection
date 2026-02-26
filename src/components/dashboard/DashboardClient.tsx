"use client";

import { IndexTilesRow } from "./IndexTilesRow";
import { MarketOverviewCard } from "./MarketOverviewCard";
import { WatchlistDashboardWidget } from "./WatchlistDashboardWidget";
import { RecentResearchCard } from "./RecentResearchCard";

export function DashboardClient() {
  return (
    <div className="p-4">
      {/* Index Tiles */}
      <section className="mb-4">
        <IndexTilesRow />
      </section>

      {/* Two column: Watchlist + Recent Research */}
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <WatchlistDashboardWidget />
        <RecentResearchCard />
      </div>

      {/* Market Movers */}
      <section>
        <MarketOverviewCard />
      </section>
    </div>
  );
}
