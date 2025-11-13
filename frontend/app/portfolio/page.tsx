"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import { useLivePrices } from "../hooks/useLivePrices";
import { toast } from "sonner";
import { useBalance } from "../../components/providers/BalanceProvider";
import SellModal from "@/components/SellModal";

export default function PortfolioPage() {

  const { balance, refreshBalance } = useBalance();
  const [holdings, setHoldings] = useState<any[]>([]);
  const [activeSell, setActiveSell] = useState<any | null>(null);
  const router = useRouter();

  const { prices, bySymbol, flash } = useLivePrices();

  useEffect(() => {
    const fetchPortfolio = async () => {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) return router.replace("/login");

      const res = await fetch("http://localhost:5500/api/v1/portfolio", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      setHoldings(json.holdings);
    };

    fetchPortfolio();
  }, [router]);

  const totalValue = holdings.reduce((acc, h) => {
    const p = bySymbol(h.symbol)?.price ?? 0;
    return acc + p * h.quantity;
  }, 0);


  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Your Portfolio</h1>
      <p className="mb-6 text-lg font-semibold">Total Portfolio Value: ₹{totalValue.toFixed(2)}</p>
      <div className="text-xl font-semibold text-white">Balance: ₹{balance}</div>

      {holdings.length === 0 && <p>No holdings yet.</p>}

      {holdings.length > 0 && (
        <table className="border w-full">
          <thead>
            <tr className="border-b bg-gray-100 text-gray-700">
              <th className="p-2">Symbol</th>
              <th className="p-2">Quantity</th>
              <th className="p-2">Avg Price</th>
              <th className="p-2">Market Price</th>
              <th className="p-2">P&L</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map(h => {
              const marketPrice = bySymbol(h.symbol)?.price ?? 0;
              const pnl = (marketPrice - h.avgPrice) * h.quantity;

              return (
                <tr key={h.id} className="border-b">
                  <td className="p-2 font-semibold">{h.symbol}</td>
                  <td className="p-2">{h.quantity}</td>
                  <td className="p-2">₹{h.avgPrice}</td>
                  <td className={`p-2 transition duration-300 ${
                      flash[h.symbol] === "up" ? "bg-green-200" : flash[h.symbol] === "down" ? "bg-red-200" : ""
                    }`}>₹{marketPrice}</td>
                  <td className={`p-2 font-bold ${pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
                  </td>

                  <td>
                    <button
                      className="text-sm text-white bg-red-600 px-3 py-1 rounded"
                      onClick={() => setActiveSell({ symbol: h.symbol, quantity: h.quantity })}
                    >
                      Sell
                    </button>
                  </td>

                  {activeSell && (
                    <SellModal
                      symbol={activeSell.symbol}
                      holdingQty={activeSell.quantity}
                      onClose={() => setActiveSell(null)}
                      onSuccess={refreshBalance}
                    />
                  )}

                  <td className="p-2">
                    <button
                      className="bg-red-600 text-white px-3 py-1 rounded"
                      onClick={async () => {
                        const session = await supabase.auth.getSession();
                        const token = session.data.session?.access_token;
                        if (!token) return router.replace("/login");

                        await fetch("http://localhost:5500/api/v1/trade/squareoff", {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                          },
                          body: JSON.stringify({
                            symbol: h.symbol,
                            price: marketPrice // from live hook bySymbol
                          })
                        });

                        // re-fetch portfolio after done
                        const res = await fetch("http://localhost:5500/api/v1/portfolio", {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        const json = await res.json();
                        setHoldings(json.holdings);

                        //toast or alert
                        toast.info("Square off completed!");
                        refreshBalance();    // ✅ update balance instantly
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
    </div>
  );
};