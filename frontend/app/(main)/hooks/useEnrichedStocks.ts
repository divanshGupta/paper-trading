"use client";


import { useMemo } from "react";
import type { Price, FlashState, Holding, EnrichedPrice } from "@/types";


/**
* Returns enriched stock objects (prices + live + holdings info)
* prices: Price[] (from price engine / socket)
* holdings: Holding[] (from AppProvider)
* bySymbol: helper to lookup latest live price (optional)
* flash: FlashState map
*/
export function useEnrichedStocks(
  prices: Price[] = [],
  holdings: Holding[] = [],
  bySymbol?: (sym: string) => Price | undefined,
  flash: FlashState = {}
): EnrichedPrice[] {
  return useMemo(() => {
    const holdingMap: Record<string, Holding> = {};
    for (const h of holdings || []) holdingMap[h.symbol] = h;


    return (prices || []).map((p) => {
      const live = bySymbol ? bySymbol(p.symbol) : p;
      const price = live?.price ?? p.price ?? 0;
      const previousClose = p.previousClose ?? price;
      const change = price - previousClose;
      const changePercent = previousClose ? (change / previousClose) * 100 : 0;


      const h = holdingMap[p.symbol] ?? null;
      const holdingQty = h?.quantity ?? 0;
      const avgPrice = h?.avgPrice ?? 0;
      const invested = holdingQty * avgPrice;
      const liveValue = holdingQty * price;
      const unrealized = liveValue - invested;


      return {
        ...p,
        price,
        previousClose,
        change,
        changePercent,
        sparkline: p.sparkline ?? p.intraday?.map(c => ({ time: c.tStart, value: c.close })) ?? [],
        flash: flash[p.symbol] ?? null,


        // holding enrichment
        holdingQty,
        avgPrice,
        invested,
        liveValue,
        unrealized,
      } as EnrichedPrice;
    });
  }, [prices, holdings, bySymbol, flash]);
}