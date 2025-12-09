// src/components/providers/PriceFeedProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import type { Candle, EnrichedPrice, FlashState, Price } from "@/types";

/** Types coming from your backend shape */
export interface SnapshotPrice {
  symbol: string;
  price: number;
  previousClose: number;
  intraday?: Candle[];
  sector?: string;
  // any additional fields your backend sends...
}

/** Tick update shape (diff) */
export interface TickUpdate {
  symbol: string;
  price: number;
  previousClose?: number;

  // allow partial updates for the rest
  [key: string]: unknown;
}


/** Provider value type */
interface PriceFeedContextValue {
  prices: EnrichedPrice[];
  flash: FlashState;
  loading: boolean;
  bySymbol: (sym: string) => EnrichedPrice | null;
}

export interface SnapshotPrice extends Price {
  // backend may send intraday candles; frontend turns them into sparkline
  intraday?: Candle[];
}


const PriceContext = createContext<PriceFeedContextValue | null>(null);

/* ----------------------------
   Lightweight sparkline builder
   We keep only small array slices for memory
-----------------------------*/
function buildSparkline(intraday: Candle[] = [], price: number) {
  // build minimal points: intraday can be ignored after sparkline built to save RAM
  const pts = intraday.map((c) => ({ time: Math.floor(c.tStart / 1000), value: c.close }));
  pts.push({ time: Math.floor(Date.now() / 1000), value: price });
  return pts.slice(-120);
}

/* ----------------------------
   Provider
-----------------------------*/
export function PriceFeedProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<EnrichedPrice[]>([]);
  const [flash, setFlash] = useState<FlashState>({});
  const [loading, setLoading] = useState(true);

  // Guard so listeners attach only once per frontend app lifecycle.
  // Useful in dev (Strict Mode / Fast Refresh) where effects may run multiple times.
  const initializedRef = useRef(false);

  useEffect(() => {
    // If socket is not available (server), do nothing
    if (!socket) return;

    // Attach listeners only once
    if (initializedRef.current) return;
    initializedRef.current = true;

    // ---------- Snapshot handler ----------
    const onSnapshot = (snapshot: SnapshotPrice[]) => {
      // Map backend snapshot into EnrichedPrice (include defaults required by your EnrichedPrice type)
      const enriched = snapshot.map((p) => {
        const change = p.price - p.previousClose;
        const changePercent = p.previousClose ? (change / p.previousClose) * 100 : 0;

        const sparkline = buildSparkline(p.intraday ?? [], p.price);

        const base: EnrichedPrice = {
          symbol: p.symbol,
          name: p.name,
          price: p.price,
          previousClose: p.previousClose,
          todayOpen: p.todayOpen,
          high: p.high,
          low: p.low,
          volume: p.volume,
          intraday: [], // drop heavy data
          sparkline,
          sector: p.sector,
          marketCap: p.marketCap,
          pe: p.pe,

          // computed
          change,
          changePercent,

          // portfolio defaults
          holdingQty: 0,
          invested: 0,
          liveValue: 0,
          unrealized: 0,
          isHolding: false,
          flash: null,
        };

        return base;
      });


      // set state once
      setPrices(enriched);

      // init flash map
      const flashInit: FlashState = {};
      enriched.forEach((e) => (flashInit[e.symbol] = null));
      setFlash(flashInit);

      setLoading(false);
    };

    // ---------- Tick handler (batched updates) ----------
    const onTicks = (updates: TickUpdate[]) => {
      setPrices((prev) => {
        // shallow copy
        const arr = prev.slice();
        const flashBatch: Record<string, "up" | "down"> = {};

        updates.forEach((u) => {
          const idx = arr.findIndex((x) => x.symbol === u.symbol);
          if (idx === -1) return;

          const before = arr[idx].price;
          const after = u.price ?? before;

          // compute movement
          if (after > before) flashBatch[u.symbol] = "up";
          else if (after < before) flashBatch[u.symbol] = "down";

          // update price & derived fields
          const holdingQty = arr[idx].holdingQty ?? 0;
          const invested = arr[idx].invested ?? 0;

          arr[idx] = {
            ...arr[idx],
            ...u,
            price: after,
            sparkline: buildSparkline(arr[idx].intraday ?? [], after), // intraday kept empty to save RAM
            liveValue: after * holdingQty,
            unrealized: after * holdingQty - invested,
            isHolding: holdingQty > 0,
          };
        });

        // batch flash updates (single state update)
        if (Object.keys(flashBatch).length > 0) {
          setFlash((prev) => ({ ...prev, ...flashBatch }));

          // reset flashes after 300ms
          setTimeout(() => {
            setFlash((prev) => {
              const copy = { ...prev };
              for (const s of Object.keys(flashBatch)) copy[s] = null;
              return copy;
            });
          }, 300);
        }

        return arr;
      });
    };

    // Attach listeners (use off before on to be defensive)
    socket.off("price:snapshot", onSnapshot);
    socket.off("price:ticks", onTicks);
    socket.on("price:snapshot", onSnapshot);
    socket.on("price:ticks", onTicks);

    // Subscribe logic: use once() and guard on backend as well
    const subscribeOnce = () => {
      if (!socket.connected) {
        // if not connected yet, request connect
        socket.connect();
        return;
      }
      // request snapshot from server
      socket.emit("price:subscribe");
    };

    // use once for connect event so this subscribe code runs only once per socket connection
    socket.once("connect", subscribeOnce);

    // if the socket is already connected (HMR/dev), subscribe now
    if (socket.connected) subscribeOnce();

    // Cleanup on unmount: keep minimal because we only attached once per app lifecycle
    return () => {
      socket.off("price:snapshot", onSnapshot);
      socket.off("price:ticks", onTicks);
      socket.off("connect", subscribeOnce);
      // do not disconnect socket here — keep socket alive across pages
    };
  }, []);

  // fast lookup map
  const byMap = useMemo(() => {
    const m = new Map<string, EnrichedPrice>();
    prices.forEach((p) => m.set(p.symbol, p));
    return m;
  }, [prices]);

  const value: PriceFeedContextValue = {
    prices,
    flash,
    loading,
    bySymbol: (sym) => byMap.get(sym) ?? null,
  };

  return <PriceContext.Provider value={value}>{children}</PriceContext.Provider>;
}

/** Hook */
export function usePriceFeed() {
  const ctx = useContext(PriceContext);
  if (!ctx) throw new Error("usePriceFeed must be used inside <PriceFeedProvider>");
  return ctx;
}
