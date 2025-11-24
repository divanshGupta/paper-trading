"use client";
import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { toast } from "sonner";

export default function SellModal({ symbol, holdingQty, onClose, onSuccess }: any) {

  const [quantity, setQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleSell = async (sellQty: number) => {

    if (sellQty <= 0) return toast.error("Enter a valid quantity");
    if (sellQty > holdingQty) return toast.error("You don’t have that many shares");

    setLoading(true);

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const res = await fetch("http://localhost:5500/api/v1/trade/sell", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ symbol, quantity: sellQty }) // ✔ FIXED
    });

    setLoading(false);
    const json = await res.json();

    if (res.ok) {
      toast.success(`Sold ${sellQty} shares of ${symbol}`);
      onSuccess?.();
      onClose?.();
    } else {
      alert(json.message || "Sell failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-surface p-6 rounded-xl w-80">
        <h2 className="text-lg font-bold mb-3">Sell {symbol}</h2>

        <input
          type="number"
          className="border px-3 py-2 rounded w-full mb-3 dark:bg-gray-800"
          placeholder="Enter quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />

        <div className="flex gap-2">
          <button
            onClick={() => handleSell(quantity)}
            className="bg-red-600 text-white px-4 py-2 rounded w-1/2"
          >
            Sell
          </button>

          <button
            onClick={() => handleSell(holdingQty)}
            className="bg-green-600 text-white px-4 py-2 rounded w-1/2"
          >
            Full Exit
          </button>
        </div>

        <button onClick={onClose} className="mt-4 text-sm underline text-gray-400">
          Cancel
        </button>
      </div>
    </div>
  );
}
