"use client";

import { useParams } from "next/navigation";
import { useLivePrices } from "@/app/(main)/hooks/useLivePrices";
import { ArrowUp, ArrowDown } from "lucide-react";
import BuySellPanel from "@/components/trade/BuySellPanel";
import { useApp } from "@/components/providers/AppProvider";
import WatchlistButton from "@/components/stocks/WatchlistButton";
import StockCard from "@/components/dashboard/StockCard";

export default function StockInfoPage() {
  const { symbol } = useParams() as { symbol: string };
  const { prices, bySymbol, flash } = useLivePrices();

  const { watchlist, toggleWatchlist} = useApp();
  
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

  function Stat({ label, value }: { label: string; value: any }) {
    return (
      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-semibold mt-1">{value}</p>
      </div>
    );
  }


  return (
    <div className="max-w-7xl mx-auto px-6 py-6 flex gap-10 pt-10">
      {/* LEFT AREA — STOCK NAME + PRICE + CHART */}
      <div className="flex-1">
        {/* HEADER */}
        <div className="group relative flex items-start justify-between">
          <div>

            <h1 className="text-3xl font-bold mb-2">{stock.name}</h1>

            <p className="text-gray-400 text-sm">{stock.symbol}</p>

            <div className="mt-4 flex gap-4">
              <p className="text-4xl font-semibold">₹{stock.price}</p>

              <div className={`mt-1 flex items-center gap-1 text-lg font-medium ${dayColor}`}>
                {dayChange >= 0 ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                {dayChange >= 0 && "+"}
                {dayChange.toFixed(2)} ({dayChangePct.toFixed(2)}%)
              </div>
            </div>
          </div>

          <WatchlistButton symbol={symbol} alwaysVisible />
        </div>


        {/* CHART PLACEHOLDER */}
        <div className="mt-8 h-[380px] w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-inner flex items-center justify-center">
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

        {/* KEY STATS */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Stat label="Sector" value={stock.sector || "—"} />
          <Stat label="Market Cap" value={stock.marketCap ? `₹${(stock.marketCap/1000).toFixed(1)}K Cr` : "—"} />
          <Stat label="PE Ratio" value={stock.pe ?? "—"} />

          <Stat label="Today’s Open" value={`₹${stock.todayOpen}`} />
          <Stat label="Previous Close" value={`₹${stock.previousClose}`} />
          <Stat label="Day High" value={`₹${stock.high}`} />
          <Stat label="Day Low" value={`₹${stock.low}`} />

          <Stat label="Volume" value={stock.volume?.toLocaleString() ?? "—"} />
        </div>


        {/* RELATED STOCKS */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Similar Stocks</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.values(prices)
              .filter(s => s.symbol !== stock.symbol && s.sector === stock.sector)
              .slice(0, 4)
              .map(s => (
                <StockCard
                  key={s.symbol}
                  symbol={s.symbol}
                  name={s.name || s.symbol}
                  price={s.price}
                  previousClose={s.previousClose || s.price}
                  flash={flash[s.symbol]}
                  sparkline={s.sparkline ?? []}
                />
              ))}
          </div>
        </div>


      </div>

      {/* RIGHT AREA — BUY / SELL PANEL */}
      <div className="w-[360px]">
        <BuySellPanel symbol={stock.symbol} price={stock.price} />
      </div>
    </div>
  );
}
