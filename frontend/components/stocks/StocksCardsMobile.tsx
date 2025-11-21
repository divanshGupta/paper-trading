import React from "react";
import { StocksListProps } from "@/types";
import Link from "next/link";

export function StocksCardsMobile({
  prices,
  flash,
  marketOpen,
  tradingSymbol,
  onBuy,
  onSell,
}: StocksListProps) {
  return (
    <div className="md:hidden flex flex-col gap-4">
      {prices.map((s) => {
        const isUp = flash[s.symbol] === "up";
        const isDown = flash[s.symbol] === "down";

        return (
          <Link href={`/stocks/${s.symbol}`} key={s.symbol}>
            <div
                key={s.symbol}
                className="rounded-xl p-4 shadow-card bg-light-surface dark:bg-dark-surface border border-gray-200 dark:border-gray-700"
            >
                <div className="flex justify-between items-center">
                <div>
                    <p className="text-base font-semibold">{s.symbol}</p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {s.name}
                    </p>
                </div>

                <div
                    className={`px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                    isUp
                        ? "bg-green-100 dark:bg-green-900 text-positive"
                        : isDown
                        ? "bg-red-100 dark:bg-red-900 text-negative"
                        : "text-light-text dark:text-dark-text"
                    }`}
                >
                    ₹{s.price}
                </div>
                </div>

                <div className="flex gap-4 mt-4">
                <button
                    disabled={tradingSymbol === s.symbol || !marketOpen}
                    onClick={() => onBuy(s.symbol, s.price)}
                    className={`flex-1 px-4 py-2 rounded-md text-white font-medium ${
                    !marketOpen || tradingSymbol === s.symbol
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-brand hover:bg-brand-dark"
                    }`}
                >
                    {tradingSymbol === s.symbol ? "Processing..." : "Buy"}
                </button>

                <button
                    disabled={tradingSymbol === s.symbol || !marketOpen}
                    onClick={() => onSell(s.symbol, s.price)}
                    className={`flex-1 px-4 py-2 rounded-md text-white font-medium ${
                    !marketOpen || tradingSymbol === s.symbol
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                >
                    {tradingSymbol === s.symbol ? "Processing..." : "Sell"}
                </button>
                </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
