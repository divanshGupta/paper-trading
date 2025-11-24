"use client";

import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useLivePrices } from "../hooks/useLivePrices";
import { useApp } from "@/components/providers/AppProvider";
import { toast } from "sonner";
import { getMarketStatusIST } from "@/utils/marketTime";
import Sidebar from "@/components/dashboard/Sidebar";
import StockGrid from "@/components/dashboard/StockGrid";
import StocksList from "@/components/stocks/StocksList";
import Link from "next/link";

export default function Dashboard() {
  const { prices, bySymbol, flash } = useLivePrices();
  const [tradingSymbol, setTradingSymbol] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "gainers" | "losers">("all");

  const { state, refresh } = useApp();
  const { profile, holdings, realizedToday } = state;

  const router = useRouter();
  const { marketOpen } = getMarketStatusIST();

  const totalValue = holdings.reduce((acc, h) => {
    const p = bySymbol(h.symbol)?.price ?? 0;
    return acc + p * h.quantity;
  }, 0);

  const unrealizedPnL = useMemo(() => {
    return holdings.reduce((acc, h) => {
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
        refresh();
        toast.success(`${action === "buy" ? "Bought" : "Sold"} successfully!`);
      } else {
        toast.error(payload.message || "Something went wrong");
      }
    } catch (err) {
      toast.error("Network error / server offline");
    }

    setTradingSymbol(null);
  };

  // --- FINAL FILTER LOGIC ---
  const dashboardStocks = useMemo(() => {
    const arr = prices.map((s) => ({
      ...s,
      changePercent:
        s.previousClose > 0
          ? ((s.price - s.previousClose) / s.previousClose) * 100
          : 0,
    }));

    switch (filter) {
      case "gainers":
        return [...arr].sort((a, b) => b.changePercent - a.changePercent).slice(0, 6);

      case "losers":
        return [...arr].sort((a, b) => a.changePercent - b.changePercent).slice(0, 6);

      default:
        return arr.slice(0, 6);
    }
  }, [prices, filter]);

  return (
    <div className="pt-10 bg-bg-main text-text">
      <div className="max-w-7xl mx-auto flex gap-6">

        {/* LEFT */}
        <div className="flex-1 min-w-0">

          <StockGrid />

          {/* FILTER BUTTONS */}
          <div className="flex gap-2 mb-4">
            {["all", "gainers", "losers"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition border
                  ${filter === f 
                    ? "bg-bg-elevated text-text border border-border" 
                    : "bg-bg-main border border-border "}
                `}
              >
                {f === "all" ? "All" : f === "gainers" ? "Top Gainers" : "Top Losers"}
              </button>
            ))}
          </div>

          <StocksList
            prices={dashboardStocks}
            flash={flash}
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
        <Sidebar balance={profile?.balance ?? 0} totalValue={totalValue} dayPnl={dayPnl} />
      </div>
    </div>
  );
}
