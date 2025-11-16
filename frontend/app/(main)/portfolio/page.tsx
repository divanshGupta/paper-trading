"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import { useLivePrices } from "../hooks/useLivePrices";
import { useApp } from "@/components/providers/AppProvider";
import { toast } from "sonner";
import SellModal from "@/components/SellModal";

export default function PortfolioPage() {
  const router = useRouter();
  const { state, refresh } = useApp();
  const { profile, holdings = [], loading } = state;

  const { bySymbol, flash } = useLivePrices();

  const [activeSell, setActiveSell] = useState<{
    symbol: string;
    quantity: number;
  } | null>(null);

  // ✅ Memoized total portfolio value
  const totalValue = useMemo(() => {
    return holdings.reduce((acc, h) => {
      const price = bySymbol(h.symbol)?.price ?? 0;
      return acc + price * h.quantity;
    }, 0);
  }, [holdings, bySymbol]);

  // Redirect if not logged in (profile = null)
  if (!loading && !profile) {
    router.replace("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="p-8 animate-pulse">
        <h1 className="text-2xl font-bold mb-4">Loading Portfolio...</h1>
        <div className="h-6 w-48 bg-gray-300 rounded mb-4"></div>
        <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Your Portfolio</h1>

      <p className="mb-6 text-lg font-semibold">
        Total Portfolio Value: ₹{totalValue.toFixed(2)}
      </p>

      <p className="text-xl font-semibold mb-6">
        Balance: ₹{profile?.balance ?? 0}
      </p>

      {holdings.length === 0 && (
        <p className="text-gray-500 text-lg">You have no holdings yet.</p>
      )}

      {holdings.length > 0 && (
        <table className="w-full border rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-left">
              <th className="p-2">Symbol</th>
              <th className="p-2">Quantity</th>
              <th className="p-2">Avg Price</th>
              <th className="p-2">Market Price</th>
              <th className="p-2">P&L</th>
              <th className="p-2">Sell</th>
              <th className="p-2">Exit</th>
            </tr>
          </thead>

          <tbody>
            {holdings.map((h) => {
              const marketPrice = bySymbol(h.symbol)?.price ?? 0;
              const pnl = (marketPrice - h.avgPrice) * h.quantity;

              return (
                <tr key={h.id} className="border-b">
                  <td className="p-2 font-semibold">{h.symbol}</td>
                  <td className="p-2">{h.quantity}</td>
                  <td className="p-2">₹{h.avgPrice}</td>

                  <td
                    className={`p-2 transition duration-300 ${
                      flash[h.symbol] === "up"
                        ? "bg-green-200"
                        : flash[h.symbol] === "down"
                        ? "bg-red-200"
                        : ""
                    }`}
                  >
                    ₹{marketPrice}
                  </td>

                  <td
                    className={`p-2 font-bold ${
                      pnl >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {pnl >= 0 ? "+" : ""}
                    {pnl.toFixed(2)}
                  </td>

                  {/* SELL BUTTON */}
                  <td className="p-2">
                    <button
                      className="text-sm text-white bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
                      onClick={() =>
                        setActiveSell({
                          symbol: h.symbol,
                          quantity: h.quantity,
                        })
                      }
                    >
                      Sell
                    </button>
                  </td>

                  {/* EXIT (Square-off) BUTTON */}
                  <td className="p-2">
                    <button
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                      onClick={async () => {
                        const { data } = await supabase.auth.getSession();
                        const token = data.session?.access_token;

                        if (!token) return router.replace("/login");

                        const res = await fetch(
                          "http://localhost:5500/api/v1/trade/squareoff",
                          {
                            method: "POST",
                            headers: {
                              Authorization: `Bearer ${token}`,
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              symbol: h.symbol,
                              price: marketPrice,
                            }),
                          }
                        );

                        const json = await res.json();
                        
                        if(res.ok) {
                          toast.info("Square-off completed!");
                          refresh(); // 🔥 update holdings + balance + profile
                        } else {
                          alert(json.message || "Sell failed");
                        }

                        
                      }}
                    >
                      Exit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* 🔥 SELL MODAL OUTSIDE MAP (correct placement) */}
      {activeSell && (
        <SellModal
          symbol={activeSell.symbol}
          holdingQty={activeSell.quantity}
          onClose={() => setActiveSell(null)}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
