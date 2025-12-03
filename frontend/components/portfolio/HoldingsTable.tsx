"use client";

import { useApp } from "../providers/AppProvider";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import { EnrichedHolding, FlashState } from "@/types";
import SellModal from "../trade/TradeModal";
import { getMarketStatusIST } from "@/utils/marketTime";


// 2. Define the type for the flash state object
// Flash maps a symbol to a price change state ("up" | "down" | undefined)

// 3. Define the component props interface
interface HoldingsTableProps {
  holdings: EnrichedHolding[];
  flash: FlashState;
  onSuccess: () => void;
}

export default function HoldingsTable({ holdings, flash, onSuccess }: HoldingsTableProps) {
  const { state } = useApp();
  const { profile } = state;
  const router = useRouter();
  const { marketOpen } = getMarketStatusIST();
  
  // State for the active modal, which holds the stock symbol and quantity to sell
  const [active, setActive] = useState<null | { symbol: string; holdingQty: number }>(null);
  
  // Assuming the unused 'refresh' state was here and removing it to resolve the warning.
  // const [refresh, setRefresh] = useState(0); // REMOVED UNUSED VARIABLE

  return (
    <div className="bg-bg-surface border border-border rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4">Your Holdings</h2>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-text-secondary border-b border-border">
            <th className="py-3 text-left">Symbol</th>
            <th className="py-3 text-left">Qty</th>
            <th className="py-3 text-left">Avg Price</th>
            <th className="py-3 text-left">LTP</th>
            <th className="py-3 text-left">P&L</th>
            <th className="py-3 text-center">Actions</th>
            <th className="py-3 text-center">Exit</th>
          </tr>
        </thead>

        <tbody>
          {/* 4. Use the Holding type in the map function */}
          {holdings.map((h: EnrichedHolding) => {
            const pnlColor = h.unrealized >= 0 ? "text-positive" : "text-negative";

            return (
              <tr
                key={h.id}
                className="border-b border-border hover:bg-bg-elevated transition"
              >
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

                {/* SELL BUTTON → opens modal */}
                <td className="py-3 text-center">
                  <button
                    disabled={!marketOpen}
                    className={`px-3 py-1 rounded-lg text-text
                      ${marketOpen ? "bg-negative hover:bg-red-700" : "bg-bg-elevated cursor-not-allowed border border-border"}
                    `}
                    onClick={() => {
                      if (!marketOpen) return;
                      setActive({ symbol: h.symbol, holdingQty: h.quantity });
                    }}
                  >
                    {marketOpen ? "Sell" : "Closed"}
                  </button>
                </td>

                {/* EXIT BUTTON */}
                <td className="py-3 text-center">
                  <button
                    disabled={!marketOpen}
                    className={`px-3 py-1 rounded-lg text-text
                      ${marketOpen ? "bg-red-600 hover:bg-red-700" : "bg-bg-elevated cursor-not-allowed border border-border"}
                    `}
                    onClick={async () => {
                      if (!marketOpen) return;
                      const BACKEND_URL = "http://localhost:5500";
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

                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {holdings.length === 0 && (
        <p className="text-center text-text-secondary py-6">
          You have no holdings yet.
        </p>
      )}

      {/* MODAL HERE */}
      {active && (
        <SellModal
          mode="sell"
          symbol={active.symbol}
          holdingQty={active.holdingQty}
          // Assuming profile?.balance is the cash balance used here. 
          // You might need to adjust the prop name if SellModal expects the current price of the stock.
          balance={profile?.balance} 
          onClose={() => setActive(null)}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}