"use client";

import { useApp } from "@/components/providers/AppProvider";
import useEnrichedStocks from "../hooks/useEnrichedStocks";
import StocksList from "@/components/stocks/StocksList";
import TableSkeleton from "@/components/skeletons/TableSkeleton";

export default function WatchlistPage() {
  const { state, watchlist, buyStock, sellStock, tradingSymbol } = useApp();
  const { loading } = state;

  // ✅ enriched prices instead of raw live prices
  const enriched = useEnrichedStocks();

  // dictionary for bySymbol
  const bySymbol = (symbol: string) =>
    enriched.find((s) => s.symbol === symbol) || null;

  // filter based on watchlist
  const filtered = enriched.filter((s) => watchlist.includes(s.symbol));

  if(!filtered) return <p>No stocks in the watchlist</p>

  return (
    <div className="pt-20 max-w-7xl mx-auto min-h-screen px-4">
      <h1 className="text-2xl font-semibold mb-6">My Watchlist</h1>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : (
        <StocksList
          prices={filtered}
          flash={{}} // ❗ flash is already enriched inside useEnrichedStocks()
          bySymbol={bySymbol}
          marketOpen={true}
          tradingSymbol={tradingSymbol}
          onBuy={buyStock}
          onSell={sellStock}
          disableActions={false}
        />
      )}
    </div>
  );
}
