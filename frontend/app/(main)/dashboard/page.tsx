// app/(main)/dashboard/page.tsx
"use client";

import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import useEnrichedStocks from "../hooks/useEnrichedStocks";
import { useState, useMemo } from "react";
import { useLivePrices } from "../hooks/useLivePrices";
import { useApp } from "@/components/providers/AppProvider";
import { toast } from "sonner";
import { getMarketStatusIST } from "@/utils/marketTime";
import Sidebar from "@/components/dashboard/Sidebar";
import StockGrid from "@/components/dashboard/StockGrid";
import StocksList from "@/components/stocks/StocksList";
import Link from "next/link";
import StockFilterTabs from "@/components/stocks/StockFilterTab";


export default function Dashboard() {

  const enriched = useEnrichedStocks();

  const { prices, bySymbol, flash } = useLivePrices();
  const [tradingSymbol, setTradingSymbol] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "gainers" | "losers">("all");

  const { state, refresh } = useApp();
  const { profile, holdings, realizedToday } = state;

  const router = useRouter();
  const { marketOpen } = getMarketStatusIST();

  // portfolio total value (live)
  const totalValue = holdings.reduce((acc: number, h: any) => {
    const p = bySymbol(h.symbol)?.price ?? 0;
    return acc + p * h.quantity;
  }, 0);

  // unrealized PnL (quick)
  const unrealizedPnL = useMemo(() => {
    return holdings.reduce((acc: number, h: any) => {
      const p = bySymbol(h.symbol);
      if (!p) return acc;
      const diff = p.price - p.previousClose;
      return acc + diff * h.quantity;
    }, 0);
  }, [holdings, prices]);

  const dayPnl = unrealizedPnL + (realizedToday ?? 0);

  const tradeStock = async (symbol: string, price: number, action: "buy" | "sell") => {
    setTradingSymbol(symbol);

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setTradingSymbol(null);
      return router.replace("/login");
    }

    try {
      const endpoint = action === "buy" ? "buy" : "sell";
      const res = await fetch(`http://localhost:5500/api/v1/trade/${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbol, quantity: 1, price }),
      });

      const payload = await res.json().catch(() => ({}));

      if (res.ok) {
        await refresh();
        toast.success(`${action === "buy" ? "Bought" : "Sold"} successfully!`);
      } else {
        toast.error(payload.message || "Something went wrong");
      }
    } catch (err) {
      toast.error("Network error / server offline");
    } finally {
      setTradingSymbol(null);
    }
  };

  const dashboardStocks = useMemo(() => {
    switch (filter) {
      case "gainers":
        return enriched
          .filter(s => s.price > s.previousClose)
          .sort((a,b)=> b.changePercent - a.changePercent)
          .slice(0,6);

      case "losers":
        return enriched
          .filter(s => s.price < s.previousClose)
          .sort((a,b)=> a.changePercent - b.changePercent)
          .slice(0,6);

      default:
        return enriched.slice(0,6);
    }
  }, [enriched, filter]);

  return (
    <div className="pt-6 md:pt-10 bg-bg-main text-text min-h-screen">
      <div className="max-w-7xl mx-auto flex gap-6 px-4">
        {/* LEFT */}
        <div className="flex-1">
          <StockGrid />

          <div className="mt-4 mb-3">
            <StockFilterTabs select={filter} onSelect={setFilter} />
          </div>

          <StocksList
            prices={dashboardStocks}
            flash={flash}
            bySymbol={bySymbol}
            marketOpen={marketOpen}
            tradingSymbol={tradingSymbol}
            onBuy={(symbol, price) => tradeStock(symbol, price, "buy")}
            onSell={(symbol, price) => tradeStock(symbol, price, "sell")}
          />

          <Link
            href="/stocks"
            className="text-positive text-sm font-semibold inline-flex items-center justify-center mt-3 mb-4"
          >
            <span className="mr-2">See more</span>
            <span className="text-xl">›</span>
          </Link>
        </div>

        {/* RIGHT • SIDEBAR */}
        <aside className="w-[340px] hidden lg:block">
          <Sidebar balance={profile?.balance ?? 0} totalValue={totalValue} dayPnl={dayPnl} />
        </aside>
      </div>
    </div>
  );
}
