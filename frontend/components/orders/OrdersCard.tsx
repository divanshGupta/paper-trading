"use client";

import { motion } from "framer-motion";
import type { Transaction } from "@/types";

/**
 * OrdersCard
 * - Designed for mobile (used in TransactionTable's mobile view)
 * - Uses only fields declared in your Transaction type
 */
export default function OrdersCard({ order }: { order: Transaction }) {
  const isBuy = order.type === "BUY";

  const formatMoney = (v?: number | string) => {
    if (v === undefined || v === null) return "—";
    const n = typeof v === "number" ? v : parseFloat(String(v));
    if (Number.isNaN(n)) return String(v);
    return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  };

  const formatDate = (d?: string | Date) => {
    if (!d) return "";
    const dt = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toLocaleString();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="bg-bg-surface border border-border rounded-xl p-4 shadow-sm"
    >
      {/* Row: BUY/SELL + createdAt */}
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-semibold ${isBuy ? "text-positive" : "text-negative"}`}
          >
            {isBuy ? "BUY" : "SELL"}
          </span>
        </div>

        <span className="text-xs text-text-secondary">{formatDate(order.createdAt)}</span>
      </div>

      {/* Symbol */}
      <p className="text-base font-medium text-text mb-1">{order.symbol}</p>

      {/* Price / Total */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-text-secondary">Price</p>
          <p className="font-semibold">{formatMoney(order.price)}</p>
        </div>

        <div className="text-right">
          <p className="text-xs text-text-secondary">Qty</p>
          <p className="font-semibold">{order.quantity}</p>
        </div>

        <div className="text-right">
          <p className="text-xs text-text-secondary">Total</p>
          <p className="font-semibold">{formatMoney(order.total)}</p>
        </div>
      </div>

      {/* Footer: realized PnL if exists */}
      {order.realizedPnl !== null && order.realizedPnl !== undefined && (
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>Realized P&L</span>
          <span className={Number(order.realizedPnl) >= 0 ? "text-positive font-semibold" : "text-negative font-semibold"}>
            {Number(order.realizedPnl) >= 0 ? "+" : ""}
            {Number(order.realizedPnl).toFixed(2)}
          </span>
        </div>
      )}
    </motion.div>
  );
}
