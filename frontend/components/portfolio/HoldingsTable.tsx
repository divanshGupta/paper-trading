"use client";

import { useApp } from "../providers/AppProvider";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import { EnrichedHolding, FlashState } from "@/types";
import SellModal from "../trade/TradeModal";
import { getMarketStatusIST } from "@/utils/marketTime";
import { motion, AnimatePresence } from "framer-motion";

interface HoldingsTableProps {
  holdings: EnrichedHolding[];
  flash: FlashState;
  onSuccess: () => void;
}

export default function HoldingsTable({ holdings, flash, onSuccess }: HoldingsTableProps) {
  const { state } = useApp();
  const { profile } = state;
  const { marketOpen } = getMarketStatusIST();
  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL as string;

  const [active, setActive] = useState<null | { symbol: string; holdingQty: number }>(null);

  /* MOBILE CARD COMPONENT ----------------------------------- */
  const MobileCard = ({ h }: { h: EnrichedHolding }) => {
    const pnlColor = h.unrealized >= 0 ? "text-positive" : "text-negative";

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="bg-bg-surface border border-border rounded-xl p-4 shadow-md"
      >
        {/* Header Row */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">{h.symbol}</h3>
          <span className="text-sm text-text-secondary">{h.sector ?? "—"}</span>
        </div>

        {/* Prices */}
        <div className="flex justify-between text-sm mb-3">
          <div>
            <p className="text-text-secondary">Avg Price</p>
            <p className="font-medium">₹{h.avgPrice}</p>
          </div>

          <div
            className={`px-2 py-1 rounded text-sm ${
              flash[h.symbol] === "up"
                ? "bg-green-200 text-green-900"
                : flash[h.symbol] === "down"
                ? "bg-red-200 text-red-900"
                : "bg-bg-elevated"
            }`}
          >
            <p className="text-text-secondary text-xs">LTP</p>
            <p className="font-semibold">₹{h.livePrice}</p>
          </div>

          <div className="text-right">
            <p className="text-text-secondary">Qty</p>
            <p className="font-medium">{h.quantity}</p>
          </div>
        </div>

        {/* PNL */}
        <div className="flex justify-between text-sm mb-4">
          <p className="text-text-secondary">Unrealized P&L</p>
          <p className={`font-semibold ${pnlColor}`}>
            {h.unrealized >= 0 ? "+" : ""}
            {h.unrealized.toFixed(2)}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            disabled={!marketOpen}
            className={`flex-1 py-2 rounded-lg text-sm 
              ${marketOpen ? "bg-negative text-text" : "bg-bg-elevated cursor-not-allowed border border-border"}
            `}
            onClick={() => {
              if (!marketOpen) return;
              setActive({ symbol: h.symbol, holdingQty: h.quantity });
            }}
          >
            {marketOpen ? "Sell" : "Closed"}
          </button>

          <button
            disabled={!marketOpen}
            className={`flex-1 py-2 rounded-lg text-sm 
              ${marketOpen ? "bg-red-600 text-text" : "bg-bg-elevated cursor-not-allowed border border-border"}
            `}
            onClick={async () => {
              if (!marketOpen) return;

              const { data } = await supabase.auth.getSession();
              const token = data.session?.access_token;
              if (!token) return router.replace("/login");

              const res = await fetch(`${BACKEND_URL}/api/v1/trade/squareoff`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ symbol: h.symbol, price: h.livePrice }),
              });

              const json = await res.json();
              if (res.ok) {
                toast.success("Square-off completed!");
                onSuccess?.();
              } else {
                toast.error(json.message || "Failed");
              }
            }}
          >
            {marketOpen ? "Exit" : "Closed"}
          </button>
        </div>
      </motion.div>
    );
  };

  /* DESKTOP TABLE ----------------------------------------- */
  const DesktopTable = () => (
    <div className="hidden md:block bg-bg-surface border border-border rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4">Your Holdings</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-text-secondary border-b border-border">
              <th className="py-3 text-left">Symbol</th>
              <th className="py-3 text-left">Qty</th>
              <th className="py-3 text-left">Avg Price</th>
              <th className="py-3 text-left">LTP</th>
              <th className="py-3 text-left">P&L</th>
              <th className="py-3 text-center">Sell</th>
              <th className="py-3 text-center">Exit</th>
            </tr>
          </thead>

          <tbody>
            {holdings.map((h) => {
              const pnlColor = h.unrealized >= 0 ? "text-positive" : "text-negative";

              return (
                <tr key={h.id} className="border-b border-border hover:bg-bg-elevated transition">
                  <td className="py-3 font-semibold">{h.symbol}</td>
                  <td className="py-3">{h.quantity}</td>
                  <td className="py-3">₹{h.avgPrice}</td>

                  <td
                    className={`py-3 ${
                      flash[h.symbol] === "up"
                        ? "bg-green-100"
                        : flash[h.symbol] === "down"
                        ? "bg-red-100"
                        : ""
                    }`}
                  >
                    ₹{h.livePrice}
                  </td>

                  <td className={`py-3 font-semibold ${pnlColor}`}>
                    {h.unrealized >= 0 ? "+" : ""}
                    {h.unrealized.toFixed(2)}
                  </td>

                  <td className="py-3 text-center">
                    <button
                      disabled={!marketOpen}
                      className={`px-3 py-1 rounded-lg text-text
                        ${marketOpen ? "bg-negative hover:bg-red-700" : "bg-bg-elevated cursor-not-allowed border border-border"}
                      `}
                      onClick={() => setActive({ symbol: h.symbol, holdingQty: h.quantity })}
                    >
                      {marketOpen ? "Sell" : "Closed"}
                    </button>
                  </td>

                  <td className="py-3 text-center">
                    <button
                      disabled={!marketOpen}
                      className={`px-3 py-1 rounded-lg text-text
                        ${marketOpen ? "bg-red-600 hover:bg-red-700" : "bg-bg-elevated cursor-not-allowed border border-border"}
                      `}
                      onClick={() => {}}
                    >
                      {marketOpen ? "Exit" : "Closed"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>

      {/* EMPTY STATE */}
      {holdings.length === 0 && (
        <div className="text-center py-10">
          <p className="text-text-secondary text-lg">You don&apos;t have any holdings yet.</p>
          <p className="text-text-secondary text-sm mt-1">
            Buy a stock to see it appear here.
          </p>
        </div>
      )}

      {/* MOBILE LIST */}
      <div className="md:hidden space-y-4 mt-4">
        <AnimatePresence>
          {holdings.map((h) => (
            <MobileCard key={h.id} h={h} />
          ))}
        </AnimatePresence>
      </div>

      {/* DESKTOP TABLE */}
      <DesktopTable />

      {/* SELL MODAL */}
      {active && (
        <SellModal
          mode="sell"
          symbol={active.symbol}
          holdingQty={active.holdingQty}
          balance={profile?.balance ?? 0}
          onClose={() => setActive(null)}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
}
