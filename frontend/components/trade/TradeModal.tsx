"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { toast } from "sonner";
import { useLivePrices } from "@/hooks/useLivePrices";
import { TradeModalProps } from "@/types";

export default function TradeModal({
  mode,
  symbol,
  holdingQty = 0,
  balance = 0,
  onClose,
  onSuccess,
}: TradeModalProps) {

  const { bySymbol } = useLivePrices(); // live WebSocket feed
  const liveStock = bySymbol(symbol);
  const price = liveStock?.price ?? null;
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL!;

  const [quantity, setQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const isBuy = mode === "buy";
  const isSell = mode === "sell";

  const total = price ? quantity * price : 0;
  const newBalance = isBuy ? balance - total : balance + total;

  const handleTrade = async () => {
    if (!price) return toast.error("Unable to read live price");
    if (quantity <= 0) return toast.error("Enter a valid quantity");
    if (isSell && quantity > holdingQty)
      return toast.error("You don't have that many shares");

    setLoading(true);

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const url = isBuy
      ? `${BACKEND_URL}/api/v1/trade/buy`
      : `${BACKEND_URL}/api/v1/trade/sell`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ symbol, quantity }),
    });

    setLoading(false);

    const json = await res.json();
    if (!res.ok) return toast.error(json.message);

    toast.success(`${isBuy ? "Bought" : "Sold"} ${quantity} shares of ${symbol}`);

    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-bg-surface backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-bg-elevated p-6 rounded-2xl w-full max-w-sm shadow-xl">
        
        <h2 className="text-lg font-bold mb-1">
          {isBuy ? "Buy" : "Sell"} {symbol}
        </h2>

        <p className="text-sm text-text-secondary mb-3">
          {price ? (
            <>Market Price: <span className="font-semibold">₹{price}</span></>
          ) : (
            "Connecting to price feed…"
          )}
        </p>

        {/* QUANTITY INPUT */}
        <div className="mb-4">
          <label className="text-sm text-text-secondary">Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="border border-border bg-bg-surface outline-none text-text px-3 py-2 rounded-lg w-full mt-1"
            placeholder="Enter quantity"
          />
        </div>

        {/* BUY SECTION */}
        {isBuy && (
          <div className="bg-bg-surface p-3 rounded-lg mb-4 text-sm">
            <div className="flex justify-between">
              <span>Available Balance:</span>
              <span className="font-semibold">₹{balance.toLocaleString()}</span>
            </div>

            <div className="flex justify-between mt-1">
              <span>Total Cost:</span>
              <span className="font-semibold">₹{total.toLocaleString()}</span>
            </div>

            <div className="flex justify-between mt-1">
              <span>Balance After Buy:</span>
              <span className={`${newBalance < 0 ? "text-negative" : ""}`}>
                ₹{newBalance.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* SELL SECTION */}
        {isSell && (
          <div className="bg-bg-surface p-3 rounded-lg mb-4 text-sm">
            <div className="flex justify-between">
              <span>Your Holdings:</span>
              <span className="font-semibold">{holdingQty} shares</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Value:</span>
              <span className="font-semibold">₹{total.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleTrade}
            disabled={loading || !price}
            className={`${isBuy ? "bg-positive" : "bg-negative"} text-text px-4 py-2 rounded-lg w-full font-semibold`}
          >
            {loading ? "Processing…" : isBuy ? "Buy" : "Sell"}
          </button>

          {isSell && (
            <button
              onClick={() => setQuantity(holdingQty)}
              className="bg-gray-200 dark:bg-gray-700 text-text px-4 py-2 rounded-lg"
            >
              Max
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 text-sm text-gray-400 hover:text-gray-500 mx-auto block"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
