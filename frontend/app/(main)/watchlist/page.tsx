"use client";

import { useApp } from "@/components/providers/AppProvider";
import useEnrichedStocks from "../../../hooks/useEnrichedStocks";
import StocksList from "@/components/stocks/StocksList";

export default function WatchlistPage() {
  const { watchlist } = useApp();

  // ✅ enriched prices instead of raw live prices
  const enriched = useEnrichedStocks();

  // filter based on watchlist
  const filtered = enriched.filter((s) => watchlist.includes(s.symbol));

  return (
    <div className="max-w-7xl mx-auto min-h-screen px-4">
      <h1 className="text-2xl font-semibold mb-6">My Watchlist</h1>
        {filtered.length === 0 ? (
          <p className="text-text-secondary">Nothing in your watchlist yet.</p>
        ) : (
          <StocksList
            symbols={filtered.map((s) => s.symbol)}
          />
        )}
    </div>
  );
}
