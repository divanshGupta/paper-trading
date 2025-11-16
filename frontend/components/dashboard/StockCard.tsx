"use client";

import { StockCardProps } from "@/types";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function StockCard({
  symbol,
  name,
  price,
  previousClose,
  movementArrow,
  flash,
}: StockCardProps) {
  const dayChange = price - previousClose;
  const dayChangePct = (dayChange / previousClose) * 100;

  return (
    <div
      className={`
        p-4 rounded-xl shadow-card bg-[var(--light-surface)] dark:bg-[var(--dark-surface)]
        transition-all border 
        ${
          flash === "up"
            ? "border-green-400"
            : flash === "down"
            ? "border-red-400"
            : "border-gray-200 dark:border-gray-700"
        }
      `}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">{symbol}</h2>
        {movementArrow(symbol)}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">{name}</p>

      <div className="mt-3">
        <p className="text-2xl font-semibold">₹{price}</p>
      </div>

      <div
        className={`mt-1 text-sm font-medium flex items-center gap-1 
          ${dayChange >= 0 ? "text-green-600" : "text-red-600"}
        `}
      >
        {dayChange >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
        {dayChange >= 0 && "+"}
        {dayChange.toFixed(2)} ({dayChangePct.toFixed(2)}%)
      </div>
    </div>
  );
}
