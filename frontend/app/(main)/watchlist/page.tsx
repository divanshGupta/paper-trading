"use client";

import { useApp } from "@/components/providers/AppProvider";
import useEnrichedStocks from "../hooks/useEnrichedStocks";
import StocksList from "@/components/stocks/StocksList";
import { useLivePrices } from "../hooks/useLivePrices";

export default function WatchlistPage() {
  const { state, watchlist, buyStock, sellStock, tradingSymbol } = useApp();
  const { flash, loading } = useLivePrices();

  // ✅ enriched prices instead of raw live prices
  const enriched = useEnrichedStocks();

  // dictionary for bySymbol
  const bySymbol = (symbol: string) =>
    enriched.find((s) => s.symbol === symbol) || null;

  // filter based on watchlist
  const filtered = enriched.filter((s) => watchlist.includes(s.symbol));

  if(!filtered) return <p>No stocks in the watchlist</p>

  return (
    <div className="pt-10 md:pt-20 max-w-7xl mx-auto min-h-screen px-4">
      <h1 className="text-2xl font-semibold mb-6">My Watchlist</h1>
        {filtered.length === 0 ? (
          <p className="text-gray-400">Nothing in your watchlist yet.</p>
        ) : (
          <StocksList
            prices={filtered}
            flash={flash}
            bySymbol={bySymbol}
            marketOpen={true}
            tradingSymbol={tradingSymbol}
            onBuy={buyStock}
            onSell={sellStock}
            loading={loading}   // important
          />
        )}
    </div>
  );
}
