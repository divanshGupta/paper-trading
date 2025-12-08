"use client";

import { useEffect, useMemo, useState } from "react";
import { socket } from "@/utils/socket";
import type { EnrichedPrice, Candle, FlashState } from "@/types";

interface TickUpdate {
  symbol: string;
  price: number;
  [key: string]: unknown;
}

export function useLivePrices() {
  const [prices, setPrices] = useState<EnrichedPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<FlashState>({});

  /* ------------------------------------------
     Build sparkline array for mini chart
  ------------------------------------------ */
  const buildSparkline = (intraday: Candle[] = [], price: number) => {
    const pts = intraday.map((c) => ({
      time: Math.floor(c.tStart / 1000),
      value: c.close,
    }));

    pts.push({ time: Math.floor(Date.now() / 1000), value: price });
    return pts.slice(-120);
  };

  /* ------------------------------------------
     Memoized map lookup for price by symbol
  ------------------------------------------ */
  const byMap = useMemo(() => {
    const m = new Map<string, EnrichedPrice>();
    prices.forEach((p) => m.set(p.symbol, p));
    return m;
  }, [prices]);

  /* ------------------------------------------
     MAIN EFFECT — attach listeners once
     FE always triggers "price:subscribe" after listeners attach
  ------------------------------------------ */
  useEffect(() => {
    if (!socket) return;

    /* --- Snapshot handler --- */
    const handleSnapshot = (snapshot: EnrichedPrice[]) => {
      console.log("📥 SNAPSHOT RECEIVED:", snapshot.length);

      const enriched = snapshot.map((p) => ({
        ...p,
        sparkline: buildSparkline(p.intraday ?? [], p.price),
      }));

      // Initialize flash states
      const flashInit: FlashState = {};
      snapshot.forEach((p) => (flashInit[p.symbol] = null));

      setPrices(enriched);
      setFlash(flashInit);
      setLoading(false);
    };

    /* --- Tick handler --- */
    const handleTicks = (updates: TickUpdate[]) => {
      setPrices((prev) => {
        const updated = [...prev];

        updates.forEach((d) => {
          const idx = updated.findIndex((p) => p.symbol === d.symbol);
          if (idx === -1) return;

          const before = updated[idx].price;
          const after = d.price;

          // Determine visual flash direction
          let movement: "up" | "down" | null = null;
          if (after > before) movement = "up";
          else if (after < before) movement = "down";

          if (movement) {
            setFlash((f) => ({ ...f, [d.symbol]: movement }));
            setTimeout(() => {
              setFlash((f) => ({ ...f, [d.symbol]: null }));
            }, 300);
          }

          updated[idx] = {
            ...updated[idx],
            ...d,
            sparkline: buildSparkline(updated[idx].intraday ?? [], after),
          };
        });

        return updated;
      });
    };

    /* ------------------------------------------
       Attach listeners exactly once
    ------------------------------------------ */
    socket.off("price:snapshot", handleSnapshot);
    socket.off("price:ticks", handleTicks);

    socket.on("price:snapshot", handleSnapshot);
    socket.on("price:ticks", handleTicks);

    /* ------------------------------------------
       Subscribe to snapshot AFTER listeners attach
    ------------------------------------------ */
    const subscribe = () => {
      console.log("📡 Requesting snapshot via price:subscribe");
      socket.emit("price:subscribe");
    };

    if (socket.connected) subscribe();
    socket.on("connect", subscribe);

    /* ------------------------------------------
       Cleanup
    ------------------------------------------ */
    return () => {
      socket.off("connect", subscribe);
      socket.off("price:snapshot", handleSnapshot);
      socket.off("price:ticks", handleTicks);
    };
  }, []);

  return {
    prices,
    flash,
    loading,
    bySymbol: (sym: string) => byMap.get(sym) ?? null,
  };
}
