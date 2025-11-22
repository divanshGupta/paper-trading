"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import { StockCardProps } from "@/types";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import WatchlistButton from "../stocks/WatchlistButton";

export default function StockCard({
  symbol,
  name,
  price,
  previousClose,
  flash,
  sparkline,
}: StockCardProps) {
  const dayChange = price - previousClose;
  const pct = (dayChange / previousClose) * 100;

  const flashBorder =
    flash === "up"
      ? "border-green-400"
      : flash === "down"
      ? "border-red-400"
      : "border-gray-200 dark:border-gray-700";

  return (
    <div
      className={`
        group relative p-4 rounded-xl shadow-card border transition-all bg-white
        dark:bg-dark-surface hover:shadow-md hover:border-gray-300  
        ${flashBorder}
      `}
    >
      {/* ⭐ Watchlist Button (Groww-style) */}
      <div
        className="
          absolute top-2 right-2 
          opacity-0 group-hover:opacity-100 transition
          bg-white/80 dark:bg-black/40 backdrop-blur-md p-1
          z-10
        "
      >
        <WatchlistButton symbol={symbol} />
      </div>

      {/* Content */}
      <div>
        {/* Symbol & Name */}
        <h2 className="font-bold text-lg">{symbol}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{name}</p>

        {/* Price */}
        <p className="text-2xl font-semibold mt-3">₹{price}</p>

        {/* Day Change */}
        <div
          className={`mt-1 text-sm font-semibold flex items-center gap-1 ${
            dayChange >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {dayChange >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          {dayChange >= 0 && "+"}
          {dayChange.toFixed(2)} ({pct.toFixed(2)}%)
        </div>

        {/* Sparkline */}
        <div className="mt-3 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline}>
              <Line
                type="monotone"
                dataKey="value"
                dot={false}
                stroke={dayChange >= 0 ? "#22c55e" : "#ef4444"}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
