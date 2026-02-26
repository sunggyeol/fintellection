"use client";

import dynamic from "next/dynamic";
import type { OHLCVBar, ChartType } from "@/types/financial";
import { Skeleton } from "@/components/ui/skeleton";

const ChartCore = dynamic(
  () => import("./ChartCore").then((mod) => ({ default: mod.ChartCore })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    ),
  }
);

interface StockChartProps {
  data: OHLCVBar[];
  chartType?: ChartType;
  height?: number;
  showVolume?: boolean;
}

export function StockChart({
  data,
  chartType = "candlestick",
  height = 400,
  showVolume = true,
}: StockChartProps) {
  return (
    <ChartCore
      data={data}
      chartType={chartType}
      height={height}
      showVolume={showVolume}
    />
  );
}
