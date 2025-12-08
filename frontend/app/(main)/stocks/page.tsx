// app/(main)/stocks/page.tsx
"use client";

import { useState, useMemo } from "react";
import useEnrichedStocks from "../../../hooks/useEnrichedStocks";
import { getMarketStatusIST } from "@/utils/marketTime";
import { useApp } from "@/components/providers/AppProvider";
import StocksList from "@/components/stocks/StocksList";
import StockFilters from "@/components/stocks/StockFilters";
import StockSorter from "@/components/stocks/StockSorter";
import StockSearch from "@/components/stocks/StockSearch";
import StockFilterTabs from "@/components/stocks/StockFilterTab";
import type { SectorFilter, SortKey } from "@/types";
import { useLivePrices } from "../../../hooks/useLivePrices";

export default function AllStocksPage() {
  const { loading } = useLivePrices();
  const enriched = useEnrichedStocks();
  const { sellStock, buyStock, tradingSymbol } = useApp();
  const [filter, setFilter] = useState<"all" | "gainers" | "losers">("all");
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState<SectorFilter>("All");
  const [sortKey, setSortKey] = useState<SortKey>("symbol");
  const { marketOpen } = getMarketStatusIST();

  // Filter + search + gainer/loser
  const filtered = useMemo(() => {
    let arr = enriched.slice();

    if (sector !== "All") arr = arr.filter((s) => s.sector === sector);

    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((s) => s.symbol.toLowerCase().includes(q) || (s.name || "").toLowerCase().includes(q));
    }

    if (filter === "gainers") {
      arr = arr.filter((s) => s.price > s.previousClose).sort((a, b) => b.changePercent - a.changePercent);
    }

    if (filter === "losers") {
      arr = arr.filter((s) => s.price < s.previousClose).sort((a, b) => a.changePercent - b.changePercent);
    }

    return arr;
  }, [enriched, sector, search, filter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortKey) {
      case "price":
        return arr.sort((a, b) => b.price - a.price);
      case "change":
        return arr.sort((a, b) => b.changePercent - a.changePercent);
      case "marketCap":
        return arr.sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
      case "pe":
        return arr.sort((a, b) => (a.pe ?? 999) - (b.pe ?? 999));
      default:
        return arr.sort((a, b) => a.symbol.localeCompare(b.symbol));
    }
  }, [filtered, sortKey]);

  return (
    <div className="max-w-7xl mx-auto px-4 mb-4">
      <h1 className="text-2xl font-semibold mb-6">All Stocks</h1>

      <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
        <StockFilters selected={sector} onSelect={setSector} />
        <StockSearch value={search} onChange={setSearch} fullList={enriched} />
        <StockSorter sortKey={sortKey} onChange={setSortKey} />
      </div>

      <StockFilterTabs selected={filter} onSelect={setFilter} />

      {sorted.length === 0 ? (
        <div className="text-center py-20 text-text-secondary text-lg">No Stocks Found!</div>
      ) : (
        <StocksList
          prices={sorted}
          flash={Object.fromEntries(sorted.map(s => [s.symbol, s.flash]))}
          bySymbol={(sym) => enriched.find(p => p.symbol === sym) ?? null}
          marketOpen={marketOpen}
          tradingSymbol={tradingSymbol}
          onBuy={buyStock}
          onSell={sellStock}
          disableActions={false}
          loading={loading}
        />
      )}
    </div>
  );
}
