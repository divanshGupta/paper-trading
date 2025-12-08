"use client";

import { useApp } from "@/components/providers/AppProvider";
import useEnrichedStocks from "../hooks/useEnrichedStocks";
import StocksList from "@/components/stocks/StocksList";
import { useLivePrices } from "../hooks/useLivePrices";
import { getMarketStatusIST } from "@/utils/marketTime";

export default function WatchlistPage() {
  const { watchlist, buyStock, sellStock, tradingSymbol } = useApp();
  const { flash, loading } = useLivePrices();

  // ✅ enriched prices instead of raw live prices
  const enriched = useEnrichedStocks();
  const { marketOpen } = getMarketStatusIST();

  // dictionary for bySymbol
  const bySymbol = (symbol: string) =>
    enriched.find((s) => s.symbol === symbol) || null;

  // filter based on watchlist
  const filtered = enriched.filter((s) => watchlist.includes(s.symbol));

  if(!filtered) return <p>No stocks in the watchlist</p>

  return (
    <div className="max-w-7xl mx-auto min-h-screen px-4">
      <h1 className="text-2xl font-semibold mb-6">My Watchlist</h1>
        {filtered.length === 0 ? (
          <p className="text-text-secondary">Nothing in your watchlist yet.</p>
        ) : (
          <StocksList
            prices={filtered}
            flash={flash}
            bySymbol={bySymbol}
            marketOpen={marketOpen}
            tradingSymbol={tradingSymbol}
            onBuy={buyStock}
            onSell={sellStock}
            loading={loading}   // important
          />
        )}
    </div>
  );
}
