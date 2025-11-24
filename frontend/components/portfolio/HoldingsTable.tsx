"use client";

import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import SellModal from "../trade/SellModal";

export default function HoldingsTable({ holdings, flash, onSuccess }: any) {
  const router = useRouter();
  const [active, setActive] = useState<null | { symbol: string; holdingQty: number }>(null);

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
          {holdings.map((h: any) => {
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
                    className="px-3 py-1 bg-brand text-white rounded-lg hover:bg-brand-dark"
                    onClick={() => setActive({ symbol: h.symbol, holdingQty: h.quantity })}
                  >
                    Sell
                  </button>
                </td>

                {/* EXIT BUTTON */}
                <td className="py-3 text-center">
                  <button
                    onClick={async () => {
                      const { data } = await supabase.auth.getSession();
                      const token = data.session?.access_token;
                      if (!token) return router.replace("/login");

                      const res = await fetch("http://localhost:5500/api/v1/trade/squareoff", {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${token}`,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          symbol: h.symbol,
                          price: h.livePrice,
                        }),
                      });

                      const json = await res.json();
                      if (res.ok) {
                        toast.success("Square-off completed!");
                        onSuccess?.();
                      } else {
                        toast.error(json.message || "Failed");
                      }
                    }}
                    className="px-3 py-1 bg-negative text-white rounded-lg hover:bg-red-700"
                  >
                    Exit
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
          symbol={active.symbol}
          holdingQty={active.holdingQty}
          onClose={() => setActive(null)}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}
