"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useLivePrices } from "@/hooks/useLivePrices";
import { useApp } from "@/components/providers/AppProvider";
import { ArrowUp, ArrowDown } from "lucide-react";
import BuySellPanel from "@/components/trade/BuySellPanel";
import WatchlistButton from "@/components/stocks/WatchlistButton";
import StockCard from "@/components/stocks/StockCard";
import Sparkline from "@/components/chart/Sparkline";
import TradeModal from "@/components/trade/TradeModal";
import { Holding, TradeAction } from "@/types";

export default function StockInfoPage() {
  const { state, refresh } = useApp();
  const { profile, holdings = [] } = state;

  const { symbol } = useParams() as { symbol: string };
  const { prices, bySymbol, flash } = useLivePrices();

  const [tradeMode, setTradeMode] = useState<TradeAction | null>(null);

  // ---------------------------------------
  // 🔥 ENRICHED HOLDINGS (REAL-TIME DATA)
  // ---------------------------------------
  const enrichedHoldings = useMemo(() => {
    return holdings.map((h: Holding) => {
      const live = bySymbol(h.symbol);
      const livePrice = live?.price ?? 0;
      const value = livePrice * h.quantity;
      const invested = h.avgPrice * h.quantity;
      const unrealized = value - invested;

      return {
        ...h,
        livePrice,
        value,
        invested,
        unrealized,
        flash: flash[h.symbol],
      };
    });
  }, [holdings, bySymbol, flash]);

  // Current stock from websocket
  const stock = bySymbol(symbol);

  if (!stock) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading stock data...
      </div>
    );
  }

  // Get live holding for the opened stock
  const holding = enrichedHoldings.find((h: Holding) => h.symbol === symbol);
  const holdingQty = holding?.quantity ?? 0;
  // const avgPrice = holding?.avgPrice ?? null;

  const dayChange = stock.price - (stock.previousClose ?? stock.price);
  const dayChangePct = (dayChange / (stock.previousClose ?? stock.price)) * 100;
  const dayColor = dayChange >= 0 ? "text-green-600" : "text-red-600";

  function Stat({ label, value }: { label: string; value: string | number | null | undefined }) {
    return (
      <div className="p-4 rounded-lg bg-bg-surface border border-border">
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="text-lg font-semibold mt-1 text-text">{value}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 md:gap-6 mb-8 px-3 sm:px-4">

      {/* LEFT AREA */}
      <div className="flex-1">
        {/* HEADER */}
        <div className="group relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

          <div>
            <h1 className="text-text text-xl sm:text-2xl md:text-3xl font-bold">
              {stock.name}
            </h1>

            <p className="text-text-secondary text-xs sm:text-sm">{stock.symbol}</p>

            {/* PRICE */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-text text-2xl sm:text-3xl font-semibold">
                ₹{stock.price}
              </p>

              <div
                className={`flex items-center gap-1 text-sm sm:text-lg font-medium ${dayColor}`}
              >
                {dayChange >= 0 ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                {dayChange >= 0 && "+"}
                {dayChange.toFixed(2)} ({dayChangePct.toFixed(2)}%)
              </div>
            </div>
          </div>

          <WatchlistButton symbol={symbol} alwaysVisible />
        </div>

        {/* CHART */}
        <div className="mt-6 h-[240px] sm:h-[300px] md:h-[380px] w-full rounded-xl border border-border bg-bg-surface flex items-center justify-center">
          <Sparkline
            data={stock.sparkline}
            positive={stock.price >= stock.previousClose}
          />
        </div>

        {/* TIME BUTTONS */}
        <div className="mt-4 flex flex-wrap justify-between gap-2 sm:gap-3">
          {["1D", "1W", "1M", "3M", "6M", "1Y", "5Y", "All"].map((t) => (
            <button
              key={t}
              className="px-2 sm:px-4 py-1 rounded-full border text-text-secondary text-xs sm:text-sm border-border hover:bg-bg-elevated"
            >
              {t}
            </button>
          ))}
        </div>

        {/* KEY STATS */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <Stat label="Sector" value={stock.sector || "—"} />
          <Stat label="Market Cap" value={stock.marketCap ? `₹${(stock.marketCap / 1000).toFixed(1)}K Cr` : "—"} />
          <Stat label="PE Ratio" value={stock.pe ?? "—"} />

          <Stat label="Today's Open" value={`₹${stock.todayOpen}`} />
          <Stat label="Previous Close" value={`₹${stock.previousClose}`} />
          <Stat label="Day High" value={`₹${stock.high}`} />
          <Stat label="Day Low" value={`₹${stock.low}`} />

          <Stat label="Volume" value={stock.volume?.toLocaleString() ?? "—"} />
        </div>

        {/* RELATED STOCKS */}
        <div className="mt-10">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Similar Stocks</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {Object.values(prices)
              .filter((s) => s.symbol !== stock.symbol && s.sector === stock.sector)
              .slice(0, 4)
              .map((s) => (
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

        {/* MOBILE BUY/SELL BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-bg-surface border-t border-border p-3 flex gap-3">
          <button
            onClick={() => setTradeMode("buy")}
            className="flex-1 py-3 rounded-lg bg-green-600 text-white font-semibold text-sm"
          >
            Buy
          </button>

          <button
            onClick={() => setTradeMode("sell")}
            className="flex-1 py-3 rounded-lg bg-red-600 text-white font-semibold text-sm"
          >
            Sell
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="hidden md:block w-[340px] lg:w-[360px]">
        <BuySellPanel symbol={stock.symbol} price={stock.price} />
      </div>

      {/* MODAL */}
      {tradeMode && (
        <TradeModal
          mode={tradeMode}
          symbol={stock.symbol}
          holdingQty={holdingQty}
          balance={profile?.balance}
          onClose={() => setTradeMode(null)}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
