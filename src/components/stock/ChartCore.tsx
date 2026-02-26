"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
  type DeepPartial,
  type ChartOptions,
  ColorType,
} from "lightweight-charts";
import type { OHLCVBar, ChartType } from "@/types/financial";

interface ChartCoreProps {
  data: OHLCVBar[];
  chartType?: ChartType;
  height?: number;
  showVolume?: boolean;
}

export function ChartCore({
  data,
  chartType = "candlestick",
  height = 400,
  showVolume = true,
}: ChartCoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const initChart = useCallback(() => {
    if (!containerRef.current || data.length === 0) return;

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chartOptions: DeepPartial<ChartOptions> = {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#6b7280",
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#e5e7eb" },
        horzLines: { color: "#e5e7eb" },
      },
      crosshair: {
        vertLine: { color: "#1e40af", width: 1, style: 2 },
        horzLine: { color: "#1e40af", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "#e5e7eb",
        scaleMargins: { top: 0.1, bottom: showVolume ? 0.25 : 0.05 },
      },
      timeScale: {
        borderColor: "#e5e7eb",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    };

    const chart = createChart(containerRef.current, {
      ...chartOptions,
      width: containerRef.current.clientWidth,
      height,
    });
    chartRef.current = chart;

    // Main series
    const candlestickData: CandlestickData[] = data.map((bar) => ({
      time: bar.time as CandlestickData["time"],
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }));

    if (chartType === "candlestick") {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#16a34a",
        downColor: "#dc2626",
        borderUpColor: "#16a34a",
        borderDownColor: "#dc2626",
        wickUpColor: "#16a34a",
        wickDownColor: "#dc2626",
      });
      series.setData(candlestickData);
    } else if (chartType === "line") {
      const series = chart.addSeries(LineSeries, {
        color: "#1e40af",
        lineWidth: 2,
      });
      series.setData(
        data.map((bar) => ({
          time: bar.time as CandlestickData["time"],
          value: bar.close,
        }))
      );
    } else {
      const series = chart.addSeries(AreaSeries, {
        topColor: "rgba(30, 64, 175, 0.15)",
        bottomColor: "rgba(30, 64, 175, 0.02)",
        lineColor: "#1e40af",
        lineWidth: 2,
      });
      series.setData(
        data.map((bar) => ({
          time: bar.time as CandlestickData["time"],
          value: bar.close,
        }))
      );
    }

    // Volume histogram
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });

      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      const volumeData: HistogramData[] = data.map((bar) => ({
        time: bar.time as HistogramData["time"],
        value: bar.volume,
        color:
          bar.close >= bar.open
            ? "rgba(22, 163, 74, 0.25)"
            : "rgba(220, 38, 38, 0.25)",
      }));
      volumeSeries.setData(volumeData);
    }

    chart.timeScale().fitContent();

    // Resize observer
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [data, chartType, height, showVolume]);

  useEffect(() => {
    const cleanup = initChart();
    return () => cleanup?.();
  }, [initChart]);

  return <div ref={containerRef} className="w-full" />;
}
