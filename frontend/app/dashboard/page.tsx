"use client";

import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useLivePrices } from "../hooks/useLivePrices";
import { toast } from "sonner";
import { useBalance } from "../providers/BalanceProvider";
import { getMarketStatusIST } from "@/utils/marketTime";
import MarketClock from "@/components/MarketClock";
import Link from "next/link";

export default function Dashboard() {
  const { balance, refreshBalance } = useBalance();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // 👈 New loading state
  const { prices, flash } = useLivePrices();
  const [tradingSymbol, setTradingSymbol] = useState<string | null>(null);

  const { marketOpen } = getMarketStatusIST();

  const router = useRouter();

  // On component mount, check for session and set email
  useEffect(() => {
    async function getSessionEmail() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Correctly set the email state here
        setEmail(session.user.email || null);
      } else {
        // Redirect to login if no session is found on load
        router.replace("/login");
      }
      setLoading(false); // Stop loading after check
    }
      getSessionEmail();
  }, [router]); // Dependency array includes router, though an empty array is often used for simple mount effects.

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
        refreshBalance();
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
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Live Market</h1>
      <div className="text-xl font-semibold text-white">Balance: ₹{balance}</div>
      
      {/* ✅ Market status banner (always visible) */}
      {!marketOpen ? (
        <div className="bg-red-100 text-red-700 p-3 text-center rounded mb-4 font-medium flex gap-4 justify-center">
          <div className="">🚫 Market Closed — Opens at 9:15 AM, Closes at 3:30 PM</div>
          <MarketClock />
        </div>
      ) : (
        <div className="bg-green-100 text-green-700 p-3 text-center rounded mb-4 font-medium">
          ✅ Market Open — Trading Live
        </div>
      )}

      {/* ✅ Show table if prices available */}
      {prices.length > 0 ? (
        <table className="border w-full">
          <thead>
            <tr className="border-b bg-gray-100 text-black">
              <th className="p-2">Symbol</th>
              <th className="p-2">Company</th>
              <th className="p-2">Price</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {prices.map(s => (
              <tr key={s.symbol} className="border-b">
                <td className="p-2 font-semibold">{s.symbol}</td>
                <td className="p-2">{s.name}</td>
                <td className={`p-2 transition duration-300 ${
                  flash[s.symbol] === "up" ? "bg-green-200" : flash[s.symbol] === "down" ? "bg-red-200" : ""
                }`}>₹{s.price}</td>
                <td className="p-2 flex items-center gap-4">
                  <button
                    disabled={tradingSymbol === s.symbol}
                    className={`px-4 py-2 rounded text-white ${
                      !marketOpen || tradingSymbol === s.symbol
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                    onClick={() => tradeStock(s.symbol, s.price, "buy")}
                  >
                    {tradingSymbol === s.symbol ? "Processing..." : "Buy"}
                  </button>

                  <button
                    disabled={!marketOpen || tradingSymbol === s.symbol}
                    className={`px-4 py-2 rounded text-white ${
                      !marketOpen || tradingSymbol === s.symbol
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                    onClick={() => tradeStock(s.symbol, s.price, "sell")}
                  >
                    {tradingSymbol === s.symbol ? "Processing..." : "Sell"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center text-gray-500">Loading market data...</p>
      )}

      <button className="mt-6 underline text-blue-500"
        onClick={() => router.push("/portfolio")}
      >
        View Portfolio
      </button>

      <Link href="/orders" className="text-blue-600 hover:underline ml-4">Orders</Link>
      <Link href="/realized-pnl" className="text-blue-600 hover:underline ml-4">Realized PnL</Link>
      <Link href="/profile" className="text-red-600 hover:underline ml-4">Profile</Link>


      <p className="mt-6 border px-3 py-2 rounded text-gray-300">Logged in as {email}</p>
      <button className="mt-6 border px-3 py-2 rounded" onClick={() => supabase.auth.signOut().then(() => router.replace("/login"))}>
        Logout
      </button>
    </div>
  );
}
