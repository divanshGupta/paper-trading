"use client";
import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function BuyModal({ symbol, holdingQty, onClose, onSuccess }: any) {
  const [quantity, setQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleSell = async (qty: number) => {
    if (qty <= 0) return alert("Enter a valid quantity");
    if (qty > holdingQty) return alert("You don’t have that many shares");

    setLoading(true);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    console.log("SELL DEBUG:", { symbol, qty, holdingQty });

    const res = await fetch("http://localhost:5500/api/v1/trade/sell", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ symbol, quantity: qty }),
    });

    setLoading(false);
    const json = await res.json();

    if (res.ok) {
      alert(`Sold ${qty} shares of ${symbol}`);
      onSuccess?.();
      onClose?.();
    } else {
      alert(json.message || "Sell failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white text-black p-6 rounded-xl w-80 shadow-xl">
        <h2 className="text-lg font-bold mb-3">Sell {symbol}</h2>

        <input
          type="number"
          className="border px-3 py-2 rounded w-full mb-3"
          placeholder="Enter quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />

        <div className="flex justify-between">
          <button
            onClick={() => handleSell(quantity)}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded w-[48%]"
          >
            {loading ? "Selling..." : "Sell"}
          </button>

          <button
            onClick={() => handleSell(holdingQty)}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded w-[48%]"
          >
            {loading ? "Selling..." : "Square Off Full"}
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 text-gray-500 underline w-full text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
