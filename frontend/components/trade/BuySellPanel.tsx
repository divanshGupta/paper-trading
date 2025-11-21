"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { toast } from "sonner";
import { useApp } from "@/components/providers/AppProvider";

interface PanelProps {
  symbol: string;
  price: number;
}

export default function BuySellPanel({ symbol, price }: PanelProps) {
  const [tab, setTab] = useState<"BUY" | "SELL">("BUY");
  const [qty, setQty] = useState("");
  const { refresh } = useApp();

  const handleSubmit = async () => {
    const quantity = Number(qty);

    if (!quantity || quantity <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      toast.error("Session expired! Please login again.");
      return;
    }

    const payload =
      tab === "BUY"
        ? { symbol, quantity, price }      // BUY needs price
        : { symbol, quantity };            // SELL doesn’t need price

    const endpoint =
      tab === "BUY"
        ? "http://localhost:5500/api/v1/trade/buy"
        : "http://localhost:5500/api/v1/trade/sell";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error || "Something went wrong");
      return;
    }

    toast.success(
      tab === "BUY"
        ? "Stock purchased successfully!"
        : "Stock sold successfully!"
    );

    setQty("");     
    refresh(); // refresh portfolio/balance instantly
  };

  const approxRequired =
    (Number(qty) > 0 ? Number(qty) * price : 0).toFixed(2);

  return (
    <div className="w-[360px] sticky top-32 h-fit border rounded-xl p-5 shadow-sm bg-white dark:bg-gray-900">
      <h3 className="text-xl font-semibold mb-1">{symbol}</h3>
      <p className="text-sm text-gray-500 mb-4">Market Price • ₹{price}</p>

      {/* BUY / SELL TAB */}
      <div className="flex gap-4 border-b pb-2 mb-4">
        <button
          onClick={() => {
            setTab("BUY");
            setQty("");
          }}
          className={`pb-2 font-semibold ${
            tab === "BUY"
              ? "text-green-600 border-b-2 border-green-600"
              : "text-gray-500"
          }`}
        >
          Buy
        </button>

        <button
          onClick={() => {
            setTab("SELL");
            setQty("");
          }}
          className={`pb-2 font-semibold ${
            tab === "SELL"
              ? "text-red-600 border-b-2 border-red-600"
              : "text-gray-500"
          }`}
        >
          Sell
        </button>
      </div>

      {/* QUANTITY INPUT */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-1 block">
          Quantity ({tab})
        </label>
        <input
          type="number"
          value={qty}
          min={1}
          onChange={(e) => setQty(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
          placeholder="Enter quantity"
        />
      </div>

      {/* Approx amount */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Approx. Required: ₹{approxRequired}
      </p>

      {/* BUY / SELL BUTTON */}
      <button
        onClick={handleSubmit}
        className={`w-full py-3 rounded-lg text-white font-bold ${
          tab === "BUY"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {tab === "BUY" ? "Buy" : "Sell"}
      </button>
    </div>
  );
}
