"use client";

import useEnrichedStocks from "../hooks/useEnrichedStocks";
import { useState, useMemo, useEffect } from "react";
import { useLivePrices } from "../hooks/useLivePrices";
import { useApp } from "@/components/providers/AppProvider";
import { getMarketStatusIST } from "@/utils/marketTime";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import StockGrid from "@/components/stocks/StockGrid";
import StocksList from "@/components/stocks/StocksList";
import StockFilterTabs from "@/components/stocks/StockFilterTab";
import { Holding, StockFilterValue } from "@/types";

export default function Dashboard() {
  const enriched = useEnrichedStocks();
  const { prices, bySymbol, flash, loading } = useLivePrices();
  const [filter, setFilter] = useState<StockFilterValue>("all");

  const { state, buyStock, sellStock, tradingSymbol } = useApp();
  const { profile, holdings, realizedToday } = state;

  // Market open state must only run on the client
  const [marketOpen, setMarketOpen] = useState(false);
  useEffect(() => {
    setMarketOpen(getMarketStatusIST().marketOpen);
  }, []);

  // Portfolio Value
  const totalValue = holdings.reduce((acc: number, h: Holding) => {
    const p = bySymbol(h.symbol)?.price ?? 0;
    return acc + p * h.quantity;
  }, 0);

  // Unrealized P&L
  const unrealizedPnL = useMemo(() => {
    return holdings.reduce((acc: number, h: Holding) => {
      const p = bySymbol(h.symbol);
      if (!p) return acc;
      return acc + (p.price - p.previousClose) * h.quantity;
    }, 0);
  }, [holdings, prices, bySymbol]);

  const dayPnl = unrealizedPnL + (realizedToday ?? 0);

  // Dashboard stocks
  const dashboardStocks = useMemo(() => {
    switch (filter) {
      case "gainers":
        return enriched
          .filter((s) => s.price > s.previousClose)
          .sort((a, b) => b.changePercent - a.changePercent)
          .slice(0, 6);

      case "losers":
        return enriched
          .filter((s) => s.price < s.previousClose)
          .sort((a, b) => a.changePercent - b.changePercent)
          .slice(0, 6);

      default:
        return enriched.slice(0, 6);
    }
  }, [enriched, filter]);

  return (
    <div className="pt-6 md:pt-10 bg-bg-main text-text min-h-screen">
      <div className="max-w-7xl mx-auto flex gap-6 px-4">
        {/* LEFT */}
        <div className="flex-1">
          <StockGrid />

          <div className="mt-4 mb-3">
            <StockFilterTabs selected={filter} onSelect={setFilter} />
          </div>

          <StocksList
            prices={dashboardStocks}
            flash={flash}
            bySymbol={bySymbol}
            marketOpen={marketOpen}
            tradingSymbol={tradingSymbol}
            onBuy={buyStock}
            onSell={sellStock}
            loading={loading}
          />

          <Link
            href="/stocks"
            className="text-positive text-sm font-semibold inline-flex items-center justify-center mt-3 mb-4"
          >
            <span className="mr-2">See more</span>
            <span className="text-xl">›</span>
          </Link>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="w-[340px] hidden lg:block">
          <Sidebar
            balance={profile?.balance ?? 0}
            totalValue={totalValue}
            dayPnl={dayPnl}
          />
        </aside>
      </div>
    </div>
  );
}
