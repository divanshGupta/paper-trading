"use client";

import { useParams } from "next/navigation";
import { useLivePrices } from "@/app/(main)/hooks/useLivePrices";
import { ArrowUp, ArrowDown } from "lucide-react";
import BuySellPanel from "@/components/trade/BuySellPanel";

export default function StockInfoPage() {
  const { symbol } = useParams() as { symbol: string };
  const { bySymbol, flash } = useLivePrices();

  const stock = bySymbol(symbol);

  if (!stock) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading stock data...
      </div>
    );
  }

  const dayChange = stock.price - (stock.previousClose ?? stock.price);
  const dayChangePct = (dayChange / (stock.previousClose ?? stock.price)) * 100;

  const dayColor = dayChange >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 flex gap-10 pt-10">
      {/* LEFT AREA — STOCK NAME + PRICE + CHART */}
      <div className="flex-1">
        {/* NAME */}
        <div className="mb-3">
          <h1 className="text-3xl font-bold">{stock.name ?? stock.symbol}</h1>
        </div>

        {/* PRICE SECTION */}
        <div className="mt-4">
          <p className="text-4xl font-semibold">₹{stock.price}</p>

          <div className={`mt-1 flex items-center gap-1 text-lg font-medium ${dayColor}`}>
            {dayChange >= 0 ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
            {dayChange >= 0 && "+"}
            {dayChange.toFixed(2)} ({dayChangePct.toFixed(2)}%)
          </div>
        </div>

        {/* CHART PLACEHOLDER */}
        <div className="mt-8 h-[380px] w-full rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Chart coming soon…</span>
        </div>

        {/* TIME RANGE BUTTONS */}
        <div className="mt-4 flex gap-3">
          {["1D", "1W", "1M", "3M", "6M", "1Y", "3Y", "5Y", "All"].map((t) => (
            <button
              key={t}
              className="px-4 py-1 rounded-full border text-sm
              border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT AREA — BUY / SELL PANEL */}
      <div className="w-[360px]">
        <BuySellPanel symbol={stock.symbol} price={stock.price} />
      </div>
    </div>
  );
}
