// "use client";

// import { useEffect, useRef } from "react";
// import {
//   createChart,
//   ColorType,
//   ISeriesApi,
//   CandlestickData,
// } from "lightweight-charts";

// interface TVChartProps {
//   candles: CandlestickData[];
//   theme?: "light" | "dark";
// }

// export default function TVChart({ candles, theme = "light" }: TVChartProps) {
//   const chartContainerRef = useRef<HTMLDivElement | null>(null);
//   const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

//   useEffect(() => {
//     if (!chartContainerRef.current) return;

//     // Destroy previous chart if already created
//     chartContainerRef.current.innerHTML = "";

//     const chart = createChart(chartContainerRef.current, {
//       width: chartContainerRef.current.clientWidth,
//       height: 380,
//       layout: {
//         background: { type: ColorType.Solid, color: theme === "light" ? "#ffffff" : "#0E141B" },
//         textColor: theme === "light" ? "#222" : "#EEE",
//       },
//       grid: {
//         vertLines: { color: theme === "light" ? "#eee" : "#222" },
//         horzLines: { color: theme === "light" ? "#eee" : "#222" },
//       },
//       timeScale: {
//         timeVisible: true,
//         secondsVisible: false,
//       },
//     });

//     const candleSeries = chart.addCandlestickSeries({
//       upColor: "#16A34A",
//       downColor: "#DC2626",
//       borderUpColor: "#16A34A",
//       borderDownColor: "#DC2626",
//       wickUpColor: "#16A34A",
//       wickDownColor: "#DC2626",
//     });

//     candleSeriesRef.current = candleSeries;
//     candleSeries.setData(candles);

//     const resize = () => {
//       chart.applyOptions({ width: chartContainerRef.current!.clientWidth });
//     };

//     window.addEventListener("resize", resize);

//     return () => window.removeEventListener("resize", resize);
//   }, [candles, theme]);

//   return <div ref={chartContainerRef} className="w-full" />;
// }
