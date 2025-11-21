"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";

interface MiniChartProps {
  data: { time: number; value: number }[];
  color?: string;
  height?: number;
}

export default function StockMiniChart({
  data,
  color = "#22c55e",
  height = 50,
}: MiniChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  // ⭐ Initialize chart ONCE
  useEffect(() => {
    if (!containerRef.current) return;

    // Create chart
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#888",
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
    });

    // Lightweight-charts v4+ uses addSeries({ type: "line" })
    const series = chart.addSeries({
      type: "line",
      color,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // ResizeObserver
    const ro = new ResizeObserver(() => {
      chart.applyOptions({
        width: containerRef.current?.clientWidth ?? 0,
      });
    });

    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, []);

  // ⭐ Update data ONLY
  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      seriesRef.current.setData(data);
    }
  }, [data]);

  return <div ref={containerRef} className="w-full" style={{ height }} />;
}
