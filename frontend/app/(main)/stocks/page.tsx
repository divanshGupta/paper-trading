"use client";

import { useState, useMemo } from "react";
import { useLivePrices } from "../hooks/useLivePrices";
import { getMarketStatusIST } from "@/utils/marketTime";
import StocksList from "@/components/stocks/StocksList";
import StockFilters from "@/components/stocks/StockFilters";
import StockSorter from "@/components/stocks/StockSorter";
import type { SectorFilter, SortKey } from "@/types";
import StockSearch from "@/components/stocks/StockSearch";

export default function AllStocksPage() {
  const { prices, flash } = useLivePrices();
  const [filter, setFilter] = useState<"all" | "gainers" | "losers">("all");
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState<SectorFilter>("All");
  const [sortKey, setSortKey] = useState<SortKey>("symbol");

// ----------- FILTER + SEARCH + GAINERS/LOSERS --------------
const filtered = useMemo(() => {
  let arr = prices.map((s) => ({
    ...s,
    changePercent:
      s.previousClose > 0
        ? ((s.price - s.previousClose) / s.previousClose) * 100
        : 0,
  }));

  // 1) Sector filter
  if (sector !== "All") {
    arr = arr.filter((s) => s.sector === sector);
  }

  // 2) Search filter
  if (search.trim().length > 0) {
    const q = search.toLowerCase();
    arr = arr.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q)
    );
  }

  // 3) Gainers / Losers filter
if (filter === "gainers") {
  arr = arr
    .filter((s) => s.price > s.previousClose)
    .sort((a, b) => b.changePercent - a.changePercent);
}

if (filter === "losers") {
  arr = arr
    .filter((s) => s.price < s.previousClose)
    .sort((a, b) => a.changePercent - b.changePercent);
}

  return arr;
}, [prices, sector, search, filter]);




  // -----------  SORT -----------
  const sorted = useMemo(() => {
  const arr = [...filtered];

  switch (sortKey) {
    case "price":
      return arr.sort((a, b) => b.price - a.price);

    case "change":
      return arr.sort(
        (a, b) =>
          (b.price - b.previousClose) / b.previousClose -
          (a.price - a.previousClose) / a.previousClose
      );

    case "marketCap":
      return arr.sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));

    case "pe":
      return arr.sort((a, b) => (a.pe ?? 999) - (b.pe ?? 999));

    default:
      return arr.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }
}, [filtered, sortKey]);


  const { marketOpen } = getMarketStatusIST();

  return (
    <div className="pt-10 max-w-6xl mx-auto px-4">
      {/* Page Heading */}
      <h1 className="text-2xl font-semibold mb-6">All Stocks</h1>

      {/* FILTERS + SORT */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
        <StockFilters selected={sector} onSelect={setSector} />
        <StockSearch value={search} onChange={setSearch} fullList={prices}/>
        <StockSorter sortKey={sortKey} onChange={setSortKey} />
      </div>

      <div className="flex gap-3 my-4">
        {["all", "gainers", "losers"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t as "all" | "gainers" | "losers")}
            className={`px-4 py-2 rounded-lg text-sm font-medium
              ${filter === t
                ? "bg-black text-white"
                : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"}
            `}
          >
            {t === "all" ? "All" : t === "gainers" ? "Top Gainers" : "Top Losers"}
          </button>
        ))}
      </div>


      {/* Stocks List */}
      {sorted.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400 text-lg">
          No Stocks Found!
        </div>
      ) : (
        <StocksList
          prices={sorted}
          flash={flash}
          marketOpen={marketOpen}
          tradingSymbol={null}
          onBuy={() => {}}
          onSell={() => {}}
          disableActions={true}
        />
      )}
      
    </div>
  );
}
