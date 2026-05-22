// frontend/components/stocks/StocksTableDesktop.tsx

"use client";
import React, { useEffect, useState} from "react";
import { ArrowUp, ArrowDown, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

import useEnrichedStocks from "@/hooks/useEnrichedStocks";
import { useApp } from "../providers/AppProvider";
import { getMarketStatusIST } from "@/utils/marketTime";

import WatchlistButton from "./WatchlistButton";

function MovementArrow({ dir }: { dir: "up" | "down" | null }) {
  if (dir === "up") return <ArrowUp size={16} className="text-positive" />;
  if (dir === "down") return <ArrowDown size={16} className="text-negative" />;
  return null;
}

// only receive filter + slice config - no prices
type Props = {
  symbols?: string[];
}

export default function StocksTableDesktop({ symbols }: Props) {
  const router = useRouter();
  const enriched = useEnrichedStocks();
  const { buyStock, sellStock, tradingSymbol } = useApp();
  const [marketOpen, setMarketOpen] = useState(false);

  useEffect(() => {
    setMarketOpen(getMarketStatusIST().marketOpen);
  }, [])

  // if symbols list privded, filter to those only 
  const prices = symbols ? enriched.filter((s) => symbols.includes(s.symbol)) : enriched;

  return (
    <div className="hidden md:block w-full overflow-hidden rounded-xl shadow-card">
      <table className="w-full border border-border mb-3">
        <thead>
          <tr className="bg-bg-elevated text-sm text-left">
            <th className="p-3">Symbol</th>
            <th className="p-3">Company</th>
            <th className="p-3">Price</th>
            <th className="p-3">Change</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>

        <tbody className="bg-bg-surface">
          {prices.map((s) => {
            const isUp = s.change > 0;
            const isDown = s.change < 0;

            return (
              <tr
                onClick={() => router.push(`/stocks/${s.symbol}`)}
                key={s.symbol}
                className="group border-t border-border text-sm hover:bg-bg-elevated"
              >
                <td className="p-3 font-semibold text-text">
                  <div className="relative flex gap-2">
                    <span>{s.symbol}</span>
                    <WatchlistButton symbol={s.symbol} />
                  </div>
                </td>

                <td className="p-3 text-text-secondary">{s.name}</td>

                <td
                  className={`p-3 font-medium text-text-secondary`}
                >
                  ₹{s.price}
                </td>
                <td className={`p-3 text-sm gap-2 ${
                  isUp
                  ? "text-positive"
                  : "text-negative"
              
                }`}>
                  <MovementArrow dir={isUp ? "up" : isDown ? "down" : null} />
                  <span>{s.change.toFixed(2)}</span>
                  <span className="text-xs">
                    ({s.changePercent.toFixed(2)}%)
                  </span>
                </td>

                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  {!marketOpen ? (
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border text-text-secondary text-xs font-semibold select-none cursor-help shadow-sm w-fit"
                      title="Market is closed. Trading hours: 9:15 AM - 3:30 PM IST (Mon-Fri)"
                    >
                      <Clock size={14} className="text-text-secondary opacity-70" />
                      <span>Market Closed</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-6">
                      <button
                        disabled={tradingSymbol === s.symbol}
                        onClick={() => {
                          buyStock(s.symbol, s.price);
                        }}
                        className={`px-4 py-2 rounded-md text-text text-sm font-medium transition ${
                          tradingSymbol === s.symbol
                            ? "bg-bg-elevated border border-border cursor-not-allowed"
                            : "bg-positive"
                        }`}
                      >
                        {tradingSymbol === s.symbol ? (
                          <span className="animate-pulse">Processing...</span>
                        ) : (
                          "Buy"
                        )}
                      </button>

                      <button
                        disabled={tradingSymbol === s.symbol}
                        onClick={() => {
                          sellStock(s.symbol, s.price);
                        }}
                        className={`px-4 py-2 rounded-md text-text text-sm font-medium transition ${
                          tradingSymbol === s.symbol
                            ? "bg-bg-elevated border border-border cursor-not-allowed"
                            : "bg-negative"
                        }`}
                      >
                        {tradingSymbol === s.symbol ? (
                          <span className="animate-pulse">Processing...</span>
                        ) : (
                          "Sell"
                        )}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
