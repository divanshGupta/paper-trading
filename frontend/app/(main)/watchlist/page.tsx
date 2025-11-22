"use client";

import { useApp } from "@/components/providers/AppProvider";
import { useLivePrices } from "../hooks/useLivePrices";
import StocksList from "@/components/stocks/StocksList";

export default function WatchlistPage() {
  const { watchlist } = useApp();
  const { prices, flash } = useLivePrices();

  // Filter live prices by saved watchlist symbols
  const filtered = prices.filter((s) => watchlist.includes(s.symbol));

  return (
    <div className="pt-20 max-w-6xl mx-auto px-4">
      <h1 className="text-2xl font-semibold mb-6">My Watchlist</h1>

      {filtered.length === 0 ? (
        <p className="text-gray-400">Nothing in your watchlist yet.</p>
      ) : (
        <StocksList
          prices={filtered}
          flash={flash}
          marketOpen={true}
          tradingSymbol={null}
          onBuy={() => {}}
          onSell={() => {}}
          disableActions={false}
        />
      )}
    </div>
  );
}
