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
import { Clock } from "lucide-react";

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

  const handleSquareOff = async (symbol: string, price: number) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return router.replace("/login");

    const res = await fetch(`${BACKEND_URL}/api/v1/trade/squareoff`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ symbol, price }),
    });

    const json = await res.json();
    if (res.ok) {
      toast.success("Square-off completed!");
      onSuccess?.();
    } else {
      toast.error(json.message || "Failed");
    }
  };

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
        {!marketOpen ? (
          <div
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-bg-elevated border border-border text-text-secondary text-xs font-semibold select-none cursor-help shadow-sm w-full"
            title="Market is closed. Trading hours: 9:15 AM - 3:30 PM IST (Mon-Fri)"
          >
            <Clock size={14} className="text-text-secondary opacity-70" />
            <span>Market Closed</span>
          </div>
        ) : (
          <div className="flex gap-3 w-full">
            <button
              className="flex-1 py-2 rounded-lg text-sm bg-negative text-text font-medium hover:opacity-90 transition"
              onClick={() => {
                setActive({ symbol: h.symbol, holdingQty: h.quantity });
              }}
            >
              Sell
            </button>

            <button
              className="flex-1 py-2 rounded-lg text-sm bg-red-600 text-text font-medium hover:bg-red-700 transition"
              onClick={() => handleSquareOff(h.symbol, h.livePrice)}
            >
              Exit
            </button>
          </div>
        )}
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

                  {!marketOpen ? (
                    <td colSpan={2} className="py-3 text-center">
                      <div
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-bg-elevated border border-border text-text-secondary text-xs font-semibold select-none cursor-help shadow-sm mx-auto"
                        title="Market is closed. Trading hours: 9:15 AM - 3:30 PM IST (Mon-Fri)"
                      >
                        <Clock size={12} className="text-text-secondary opacity-70" />
                        <span>Market Closed</span>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="py-3 text-center">
                        <button
                          className="px-3 py-1 rounded-lg text-text bg-negative hover:bg-red-700 transition"
                          onClick={() => setActive({ symbol: h.symbol, holdingQty: h.quantity })}
                        >
                          Sell
                        </button>
                      </td>

                      <td className="py-3 text-center">
                        <button
                          className="px-3 py-1 rounded-lg text-text bg-red-600 hover:bg-red-700 transition"
                          onClick={() => handleSquareOff(h.symbol, h.livePrice)}
                        >
                          Exit
                        </button>
                      </td>
                    </>
                  )}
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
