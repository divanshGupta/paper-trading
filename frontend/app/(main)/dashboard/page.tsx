"use client";

import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useLivePrices } from "../hooks/useLivePrices";
import { useApp } from "@/components/providers/AppProvider";
import { toast } from "sonner";
import { useBalance } from "@/components/providers/BalanceProvider";
import { getMarketStatusIST } from "@/utils/marketTime";
import Sidebar from "@/components/layout/Sidebar";
import StockGrid from "@/components/layout/StockGrid";
import StockTable from "@/components/layout/StockTable";
import Link from "next/link";

export default function Dashboard() {
  // const { balance, refreshBalance } = useBalance();
  // const [loading, setLoading] = useState(true); // 👈 New loading state
  const { prices, flash, bySymbol, movementArrow } = useLivePrices();
  const [tradingSymbol, setTradingSymbol] = useState<string | null>(null);
  // const [holdings, setHoldings] = useState<any[]>([]);

  const { state, refresh } = useApp();
  const { profile, holdings, loading } = state;

  const { marketOpen } = getMarketStatusIST();

  const router = useRouter();

  // useEffect(() => {
  //   const fetchPortfolio = async () => {
  //     const session = await supabase.auth.getSession();
  //     const token = session.data.session?.access_token;

  //     if (!token) return router.replace("/login");

  //     const res = await fetch("http://localhost:5500/api/v1/portfolio", {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     const json = await res.json();
  //     setHoldings(json.holdings);
  //   };

  //   fetchPortfolio();
  // }, [router]);

  const totalValue = holdings.reduce((acc, h) => {
    const p = bySymbol(h.symbol)?.price ?? 0;
    return acc + p * h.quantity;
  }, 0);


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

  return (
    <div className="pt-20">
      <div className="max-w-7xl mx-auto flex gap-6">
        {/* Left content */}
        <div className="flex-1 min-w-0">
          {/* Stocks Grid */}
          <StockGrid />

          {/* Gainers / Losers / Trending */}
          <StockTable />

          {/* ✅ Show table if prices available */}
          {prices.length > 0 ? (
            <div className="w-full">

              {/* Desktop Table */}
              <div className="hidden md:block overflow-hidden rounded-xl shadow-card dark:bg-dark-surface">
                <table className="w-full border border-gray-200 mb-3">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-800 text-left text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      <th className="p-3">Symbol</th>
                      <th className="p-3">Company</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {prices.map((s) => {
                      const isUp = flash[s.symbol] === "up";
                      const isDown = flash[s.symbol] === "down";

                      return (
                        <tr
                          key={s.symbol}
                          className="border-t border-gray-200 dark:border-gray-700 text-sm"
                        >
                          <td className="p-3 font-semibold text-light-text dark:text-dark-text">
                            {s.symbol}
                          </td>

                          <td className="p-3 text-light-text-secondary dark:text-dark-text-secondary">
                            {s.name}
                          </td>

                          <td
                            className={`p-3 font-medium transition-all ${
                              isUp
                                ? "bg-green-100 dark:bg-green-900 text-positive"
                                : isDown
                                ? "bg-red-100 dark:bg-red-900 text-negative"
                                : "text-light-text dark:text-dark-text"
                            }`}
                          >
                            ₹{s.price} {movementArrow(s.symbol)}
                          </td>

                          <td className="p-3 flex items-center gap-3">
                            {/* BUY BUTTON */}
                            <button
                              disabled={tradingSymbol === s.symbol || !marketOpen}
                              onClick={() => tradeStock(s.symbol, s.price, "buy")}
                              className={`px-4 py-2 rounded-md text-white text-sm font-medium transition ${
                                !marketOpen || tradingSymbol === s.symbol
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-brand hover:bg-brand-dark"
                              }`}
                            >
                              {tradingSymbol === s.symbol ? "Processing..." : "Buy"}
                            </button>

                            {/* SELL BUTTON */}
                            <button
                              disabled={tradingSymbol === s.symbol || !marketOpen}
                              onClick={() => tradeStock(s.symbol, s.price, "sell")}
                              className={`px-4 py-2 rounded-md text-white text-sm font-medium transition ${
                                !marketOpen || tradingSymbol === s.symbol
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-red-500 hover:bg-red-600"
                              }`}
                            >
                              {tradingSymbol === s.symbol ? "Processing..." : "Sell"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <Link 
                  href="/" 
                  className='text-blue-400 text-sm font-semibold inline-flex items-center justify-center'
                  >
                    {/* Wrap the text to ensure it's a solid element for Flexbox to align */}
                    <span className="leading-none mr-2">See more</span> 
                    <span className="text-xl">›</span>
                </Link>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden flex flex-col gap-4">
                {prices.map((s) => {
                  const isUp = flash[s.symbol] === "up";
                  const isDown = flash[s.symbol] === "down";

                  return (
                    <div
                      key={s.symbol}
                      className="
                        rounded-xl p-4 shadow-card bg-light-surface dark:bg-dark-surface
                        border border-gray-200 dark:border-gray-700
                      "
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-base font-semibold">{s.symbol}</p>
                          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            {s.name}
                          </p>
                        </div>

                        <div
                          className={`
                            px-3 py-2 rounded-md text-sm font-semibold transition-all
                            ${
                              isUp
                                ? "bg-green-100 dark:bg-green-900 text-positive"
                                : isDown
                                ? "bg-red-100 dark:bg-red-900 text-negative"
                                : "text-light-text dark:text-dark-text"
                            }
                          `}
                        >
                          ₹{s.price}
                        </div>
                      </div>

                      <div className="flex gap-4 mt-4">
                        <button
                          disabled={tradingSymbol === s.symbol || !marketOpen}
                          onClick={() => tradeStock(s.symbol, s.price, "buy")}
                          className={`flex-1 px-4 py-2 rounded-md text-white font-medium ${
                            !marketOpen || tradingSymbol === s.symbol
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-brand hover:bg-brand-dark"
                          }`}
                        >
                          {tradingSymbol === s.symbol ? "Processing..." : "Buy"}
                        </button>

                        <button
                          disabled={tradingSymbol === s.symbol || !marketOpen}
                          onClick={() => tradeStock(s.symbol, s.price, "sell")}
                          className={`flex-1 px-4 py-2 rounded-md text-white font-medium ${
                            !marketOpen || tradingSymbol === s.symbol
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-red-500 hover:bg-red-600"
                          }`}
                        >
                          {tradingSymbol === s.symbol ? "Processing..." : "Sell"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">Loading market data...</p>
          )}
        </div>

        {/* right content */}
        <Sidebar balance={profile?.balance ?? 0} totalValue={totalValue} />
      </div>
    </div>
  );
}
