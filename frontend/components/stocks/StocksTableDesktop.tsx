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
    <div className="hidden md:block overflow-hidden rounded-xl shadow-card dark:bg-dark-surface">
      <table className="w-full border border-gray-200 mb-3">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-800 text-sm text-left">
            <th className="p-3">Symbol</th>
            <th className="p-3">Company</th>
            <th className="p-3">Price</th>
            <th className="p-3">Change</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>

        <tbody>
          {prices.map((s: Price) => {
            const isUp = flash[s.symbol] === "up";
            const isDown = flash[s.symbol] === "down";

            return (
              <tr
                onClick={() => router.push(`/stocks/${s.symbol}`)}
                key={s.symbol}
                className="group border-t border-gray-200 dark:border-gray-700 text-sm hover:shadow-md hover:border-gray-300"
              >
                {/* SYMBOL */}
                <td className="p-3 font-semibold text-light-text dark:text-dark-text">
                  <div className="relative flex items-center gap-2">
                    <span>{s.symbol}</span>
                    {/* bookmard only visible on hover */}
                      <WatchlistButton symbol={s.symbol} />
                  </div>
                </td>

                {/* COMPANY NAME */}
                <td className="p-3 text-light-text-secondary dark:text-dark-text-secondary">
                  {s.name}
                </td>

                {/* PRICE */}
                <td
                  className={`p-3 font-medium transition-all ${
                    isUp
                      ? "bg-green-100 dark:bg-green-900 text-positive"
                      : isDown
                      ? "bg-red-100 dark:bg-red-900 text-negative"
                      : "text-light-text dark:text-dark-text"
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
                <td className="p-3 flex items-start gap-3">
                  {/* BUY */}
                  <button
                    disabled={tradingSymbol === s.symbol || !marketOpen}
                    onClick={() => onBuy(s.symbol, s.price)}
                    className={`px-4 py-2 rounded-md text-white text-sm font-medium transition ${
                      !marketOpen || tradingSymbol === s.symbol
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-400 hover:bg-brand-dark"
                    }`}
                  >
                    {tradingSymbol === s.symbol ? "Processing..." : "Buy"}
                  </button>

                  {/* SELL */}
                  <button
                    disabled={tradingSymbol === s.symbol || !marketOpen}
                    onClick={() => onSell(s.symbol, s.price)}
                    className={`px-4 py-2 rounded-md text-white text-sm font-medium transition ${
                      !marketOpen || tradingSymbol === s.symbol
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600"
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
