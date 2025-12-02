"use client";

import { StockCardProps } from "@/types";
import WatchlistButton from "../stocks/WatchlistButton";

export default function StockCard({
  symbol,
  name,
  price,
  previousClose,
  flash,
}: StockCardProps) {
  const dayChange = price - previousClose;
  const pct = (dayChange / previousClose) * 100;

  const flashBorder =
    flash === "up"
      ? "border-positive"
      : flash === "down"
      ? "border-negative"
      : "border-border";

  return (
    <div
      className={`
        bg-bg-surface text-text border rounded-xl shadow-card 
        transition-all hover:shadow-sm ${flashBorder}
        p-4 h-40 flex flex-col justify-between 
        relative group
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-bold text-base">{symbol}</h2>
          <p className="text-xs text-text-secondary truncate w-[90px]">{name}</p>
        </div>

        <WatchlistButton symbol={symbol} />
      </div>

      {/* Price */}
      <div>
        <p className="text-xl font-semibold">₹{price}</p>
        <p
          className={`text-sm font-semibold ${
            dayChange >= 0 ? "text-positive" : "text-negative"
          }`}
        >
          {dayChange >= 0 && "+"}
          {dayChange.toFixed(2)} ({pct.toFixed(2)}%)
        </p>
      </div>
    </div>
  );
}
