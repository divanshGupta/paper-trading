"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

interface RealizedRow {
  symbol: string;
  avgBuy: string;
  avgSell: string;
  buyTrades: number;
  sellTrades: number;
  realizedPnL: string;
  pnlPercent: string;
}

export default function RealizedPnLPage() {
  const [rows, setRows] = useState<RealizedRow[]>([]);

  useEffect(() => {
    const fetchPnL = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch("http://localhost:5500/api/v1/transactions/realized-pnl", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setRows(json.realizedPnL || []);
    };
    fetchPnL();
  }, []);

  const totalPnL = rows.reduce((sum, r) => sum + parseFloat(r.realizedPnL), 0);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Realized Profit & Loss</h1>

      <div className="flex justify-between mb-4">
        <p className="font-medium text-gray-700">
          Total Realized P&L:{" "}
          <span className={totalPnL >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
            ₹{totalPnL.toFixed(2)}
          </span>
        </p>
      </div>

      {rows.length === 0 ? (
        <p>No realized trades yet.</p>
      ) : (
        <table className="border w-full text-center">
          <thead className="bg-gray-100 text-black">
            <tr className="border-b">
              <th className="p-2">Symbol</th>
              <th className="p-2">Buy Qty</th>
              <th className="p-2">Sell Qty</th>
              <th className="p-2">Avg Buy</th>
              <th className="p-2">Avg Sell</th>
              <th className="p-2">PnL ₹</th>
              <th className="p-2">PnL %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol} className="border-b transition">
                <td className="p-2 font-semibold">{r.symbol}</td>
                <td className="p-2">{r.buyTrades}</td>
                <td className="p-2">{r.sellTrades}</td>
                <td className="p-2">₹{r.avgBuy}</td>
                <td className="p-2">₹{r.avgSell}</td>
                <td
                  className={`p-2 font-bold ${
                    parseFloat(r.realizedPnL) >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ₹{r.realizedPnL}
                </td>
                <td
                  className={`p-2 font-bold ${
                    parseFloat(r.pnlPercent) >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {r.pnlPercent}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
