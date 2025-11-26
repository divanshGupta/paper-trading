"use client";

import React from "react";
import { StocksListProps, Price } from "@/types";;
import { ArrowUp, ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";
import WatchlistButton from "./WatchlistButton";

function MovementArrow({ dir }: { dir: "up" | "down" | null }) {
  if (dir === "up") return <ArrowUp size={16} className="text-green-500" />;
  if (dir === "down") return <ArrowDown size={16} className="text-red-500" />;
  return null;
}

export default function StocksTableDesktop({
  prices,
  flash,
  marketOpen,
  tradingSymbol,
  onBuy,
  onSell,
}: StocksListProps) {

    const router = useRouter();

  return (
    <div className="hidden md:block overflow-hidden rounded-xl shadow-card">
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
          {prices.map((s: Price) => {
            const isUp = flash[s.symbol] === "up";
            const isDown = flash[s.symbol] === "down";

            return (
              <tr
                onClick={() => router.push(`/stocks/${s.symbol}`)}
                key={s.symbol}
                className="group border-t border-border text-sm hover:bg-bg-elevated"
              >
                {/* SYMBOL */}
                <td className="p-3 font-semibold text-text">
                  <div className="relative flex gap-2">
                    <span>{s.symbol}</span>
                    {/* bookmard only visible on hover */}
                      <WatchlistButton symbol={s.symbol} />
                  </div>
                </td>

                {/* COMPANY NAME */}
                <td className="p-3 text-text-secondary">
                  {s.name}
                </td>

                {/* PRICE */}
                <td
                  className={`p-3 font-medium transition-all ${
                    isUp
                      ? "text-positive"
                      : isDown
                      ? "text-negative"
                      : "text-text-secondary"
                  }`}
                >
                  ₹{s.price}
                </td>

                {/* CHANGE */}
                <td className="p-3 text-sm gap-2">
                  <MovementArrow
                    dir={isUp ? "up" : isDown ? "down" : null}
                  />

                  {typeof s.previousClose === "number" ? (
                    <span>{(s.price - s.previousClose).toFixed(2)}</span>
                  ) : (
                    <span>—</span>
                  )}
                </td>

                {/* ACTION BUTTONS */}
                <td className="p-3 flex items-start gap-6">
                  {/* BUY */}
                  <button
                    disabled={tradingSymbol === s.symbol || !marketOpen}
                    onClick={() => onBuy(s.symbol, s.price)}
                    className={`px-4 py-2 rounded-md text-text text-sm font-medium transition ${
                      !marketOpen || tradingSymbol === s.symbol
                        ? "bg-bg-elevated border border-border cursor-not-allowed"
                        : "bg-positive"
                    }`}
                  >
                    {tradingSymbol === s.symbol ? "Processing..." : "Buy"}
                  </button>

                  {/* SELL */}
                  <button
                    disabled={tradingSymbol === s.symbol || !marketOpen}
                    onClick={() => onSell(s.symbol, s.price)}
                    className={`px-4 py-2 rounded-md text-text text-sm font-medium transition ${
                      !marketOpen || tradingSymbol === s.symbol
                        ? "bg-bg-elevated border border-border cursor-not-allowed"
                        : "bg-negative"
                    }`}
                  >
                    {tradingSymbol === s.symbol ? "Processing..." : "Sell"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
