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
import StockTable from "@/components/dashboard/StockTable";
import { ArrowDown, ArrowUp } from "lucide-react";
import StocksList from "../../../components/stocks/StocksList";
import Link from "next/link";
import StockFilterTabs from "@/components/stocks/StockFilterTab";

export default function Dashboard() {
  const { prices, bySymbol, flash } = useLivePrices();
  const [tradingSymbol, setTradingSymbol] = useState<string | null>(null);
  // this state is for gainer/loser filter
  const [filter, setFilter] = useState<"all" | "gainers" | "losers">("all");

  const { state, refresh } = useApp();
  const { profile, holdings, loading, realizedToday } = state

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

  const { marketOpen } = getMarketStatusIST();

  const router = useRouter();

  // 🔥 Your movementArrow function lives HERE
  const movementArrow = (symbol: string) => {
    const f = flash[symbol];
    if (f === "up") return <ArrowUp size={18} className="text-green-500" />;
    if (f === "down") return <ArrowDown size={18} className="text-red-500" />;
    return null;
  };

  // buy / sell function
  const tradeStock = async (symbol: string, price: number, action: "buy" | "sell") => {
    setTradingSymbol(symbol); // lock this symbol buttons

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
        refresh(); //refreshBalance changed to refresh of AppProvider
        toast.success(`${action === "buy" ? "Bought" : "Sold"} successfully!`);
        setTradingSymbol(null);
        return { success: true };
      }

      if (res.status === 403 && payload.error === "Insufficient Funds") {
        toast.error(payload.message || "Insufficient funds");
        setTradingSymbol(null);
        return { success: false };
      }

      toast.error(payload.message || "Something went wrong");
      setTradingSymbol(null);
      return { success: false };
    } catch (err) {
      toast.error("Network error / server offline");
      setTradingSymbol(null);
      return { success: false };
    }
  };

  const dashboardStocks = useMemo(() => {
    let arr = prices.map((s) => ({
      ...s,
      changePercent:
        s.previousClose > 0
          ? ((s.price - s.previousClose) / s.previousClose) * 100
          : 0,
    }));

    if (filter === "gainers") {
      return [...arr].sort((a, b) => b.changePercent - a.changePercent).slice(0, 6);
    }

    if (filter === "losers") {
      return [...arr].sort((a, b) => a.changePercent - b.changePercent).slice(0, 6);
    }

    return arr.slice(0, 6);
  }, [prices, filter]);


  return (
    <div className="pt-10">
      <div className="max-w-7xl mx-auto flex gap-6">
        {/* Left content */}
        <div className="flex-1 min-w-0">
          {/* Stocks Grid */}
          <StockGrid />

          {/* Gainers / Losers / Trending */}
          <div className="flex gap-3 mb-4">
            <button onClick={() => setFilter("all")}>All</button>
            <button onClick={() => setFilter("gainers")}>Top Gainers</button>
            <button onClick={() => setFilter("losers")}>Top Losers</button>
          </div>

          {/* ✅ Show table if prices available */}
    
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
              className="text-blue-400 text-sm font-semibold inline-flex items-center justify-center mt-3 mb-4"
              >
              <span className="mr-2">See more</span>
              <span className="text-xl">›</span>
          </Link>

        </div>

        {/* right content */}
        <Sidebar balance={profile?.balance ?? 0} totalValue={totalValue} dayPnl={dayPnl}/>
      </div>
    </div>
  );
}
