"use client";

import AuthGuard from "../../../hooks/authGaurd";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { RealizedRow } from "@/types";
import RealizedCard from "@/components/realized-pnl/realizedCard";

function RealizedPnLPage() {
  const [rows, setRows] = useState<RealizedRow[]>([]);

  // Freeze the env var so it's not considered a dependency
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL as string;

  useEffect(() => {
    let mounted = true;

    const fetchPnL = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;

        if (!token) return;

        const res = await fetch(`${BACKEND_URL}/api/v1/transactions/realized-pnl`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json();

        if (mounted) {
          setRows(json.realizedPnL || []);
        }
      } catch (err) {
        console.error("Realized PnL fetch error:", err);
      }
    };

    fetchPnL();

    return () => {
      mounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPnL = rows.reduce((sum, r) => sum + r.realizedPnL, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto px-4">

      {/* Total Summary */}
      {rows.length > 0 && (
        <div className="mb-6 text-lg">
          Total Realized P&L:{" "}
          <span
            className={`font-bold ${
              totalPnL >= 0 ? "text-positive" : "text-negative"
            }`}
          >
            ₹{totalPnL.toFixed(2)}
          </span>
        </div>
      )}

      {/* MOBILE — CARD VIEW */}
      <div className="md:hidden space-y-4">
        {rows.map((r) => (
          <RealizedCard key={r.symbol} row={r} />
        ))}
      </div>

      {/* DESKTOP - Table View */}
      <div className="hidden md:block bg-bg-surface border border-border rounded-xl p-6">

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold mb-4">Your Holdings</h2>
          <div className="flex justify-between mb-4">
            <p className="font-medium text-text-secondary">
              Total Realized P&L:{" "}
              <span className={totalPnL >= 0 ? "text-positive font-bold" : "text-negative font-bold"}>
                ₹{totalPnL.toFixed(2)}
              </span>
            </p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-secondary border-b border-border">
              <th className="py-3 text-left">Symbol</th>
              <th className="py-3 text-left">Buy Qty</th>
              <th className="py-3 text-left">Sell Qty</th>
              <th className="py-3 text-left">Avg Buy</th>
              <th className="py-3 text-left">Avg Sell</th>
              <th className="py-3 text-left">PnL ₹</th>
              <th className="py-3 text-left">PnL %</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol} className="border-b border-border hover:bg-bg-elevated transition">
                <td className="py-3 font-semibold">{r.symbol}</td>
                <td className="py-3">{r.buyQty}</td>
                <td className="py-3">{r.sellQty}</td>
                <td className="py-3">₹{r.avgBuy}</td>
                <td className="py-3">₹{r.avgSell}</td>
                <td className={`p-3 font-bold ${r.realizedPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹{r.realizedPnL}
                </td>
                <td className={`p-3 font-bold ${r.pnlPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {r.pnlPercent}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
}

const ProtectedPnlPage = () => (
  <AuthGuard>
    <RealizedPnLPage />
  </AuthGuard>
);

export default ProtectedPnlPage;
