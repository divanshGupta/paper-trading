"use client";

import { useMemo } from "react";
import { useLivePrices } from "./useLivePrices";
import { useApp } from "@/components/providers/AppProvider";
import { EnrichedPrice, Price } from "@/types";

export default function useEnrichedStocks() {
  const { prices, flash, bySymbol } = useLivePrices();
  const { state } = useApp();
  const { holdings } = state;

  const enriched: EnrichedPrice[] = useMemo(() => {
    return prices.map((s: Price) => {
      const change = s.price - s.previousClose;
      const changePercent = s.previousClose
        ? (change / s.previousClose) * 100
        : 0;
      const holding = holdings.find((h) => h.symbol === s.symbol);
      const holdingQty = holding?.quantity ?? 0;
      const invested = holding ? holding.avgPrice * holding.quantity : 0;
      const liveValue = s.price * holdingQty;
     

      return {
        ...s,

        change,
        changePercent,

        // portfolio
        holdingQty,
        invested,
        liveValue,
        unrealized: liveValue - invested,
        isHolding: holdingQty > 0,

        // FIX: ensure flash never becomes undefined
        flash: flash[s.symbol] ?? null,
      };
    });
  }, [prices, flash, holdings]);

  return enriched;
}
