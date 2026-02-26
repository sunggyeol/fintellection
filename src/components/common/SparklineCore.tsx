"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  AreaSeries,
  ColorType,
  type IChartApi,
} from "lightweight-charts";

interface SparklineCoreProps {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
}

export default function SparklineCore({
  data,
  width = 80,
  height = 32,
  positive = true,
}: SparklineCoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length < 2) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

    const color = positive ? "#16a34a" : "#dc2626";

    const chart = createChart(containerRef.current, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "transparent",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
      crosshair: {
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
      handleScroll: false,
      handleScale: false,
    });
    chartRef.current = chart;

    const series = chart.addSeries(AreaSeries, {
      topColor: `${color}20`,
      bottomColor: "transparent",
      lineColor: color,
      lineWidth: 1,
      crosshairMarkerVisible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // Use sequential timestamps for sparkline data
    const seriesData = data.map((value, i) => ({
      time: (i + 1) as unknown as import("lightweight-charts").Time,
      value,
    }));
    series.setData(seriesData);
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [data, width, height, positive]);

  return <div ref={containerRef} />;
}
