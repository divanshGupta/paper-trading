"use client";

import { motion } from "framer-motion";
import { RealizedRow } from "@/types";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function RealizedCard({ row }: { row: RealizedRow }) {
  const positive = row.realizedPnL >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="
        bg-bg-surface border border-border 
        rounded-xl p-4
        shadow-sm 
        flex flex-col gap-3
      "
    >
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{row.symbol}</h3>

        {/* ICON */}
        <div
          className={`
            p-1.5 rounded-full
            ${positive ? "bg-green-500/20" : "bg-red-500/20"}
          `}
        >
          {positive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </div>
      </div>

      {/* QTY SECTION */}
      <div className="grid grid-cols-2 gap-y-1 text-sm">
        <p className="text-text-secondary">Buy Qty</p>
        <p className="text-right font-medium">{row.buyQty}</p>

        <p className="text-text-secondary">Sell Qty</p>
        <p className="text-right font-medium">{row.sellQty}</p>
      </div>

      {/* PRICES */}
      <div className="grid grid-cols-2 gap-y-1 text-sm">
        <p className="text-text-secondary">Avg Buy</p>
        <p className="text-right font-medium">₹{row.avgBuy}</p>

        <p className="text-text-secondary">Avg Sell</p>
        <p className="text-right font-medium">₹{row.avgSell}</p>
      </div>

      {/* PNL */}
      <div className="flex justify-between items-center mt-2">
        <p className="text-text-secondary">Realized P&L</p>
        <p
          className={`text-lg font-bold ${
            positive ? "text-positive" : "text-negative"
          }`}
        >
          {positive ? "+" : ""}
          ₹{row.realizedPnL.toFixed(2)}
        </p>
      </div>

      {/* PNL % */}
      <div className="flex justify-between items-center">
        <p className="text-text-secondary">P&L %</p>
        <p
          className={`font-semibold ${
            row.pnlPercent >= 0 ? "text-positive" : "text-negative"
          }`}
        >
          {row.pnlPercent.toFixed(2)}%
        </p>
      </div>
    </motion.div>
  );
}
