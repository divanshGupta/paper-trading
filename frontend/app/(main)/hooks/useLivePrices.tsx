// src/app/(main)/hooks/useLivePrices.tsx OR src/hooks/useLivePrices.tsx
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

  const buildSparkline = (intraday: Candle[] = [], price: number) => {
    const pts = intraday.map((c) => ({ time: Math.floor(c.tStart / 1000), value: c.close }));
    pts.push({ time: Math.floor(Date.now() / 1000), value: price });
    return pts.slice(-120);
  };

  const byMap = useMemo(() => {
    const m = new Map<string, EnrichedPrice>();
    prices.forEach((p) => m.set(p.symbol, p));
    return m;
  }, [prices]);

  useEffect(() => {
    // wait until socket is connected
    if (!socket || !socket.connected) return;

    console.info("useLivePrices: attaching listeners", socket.id);

    const onSnapshot = (snapshot: EnrichedPrice[]) => {
      const enriched = snapshot.map((p) => ({ ...p, sparkline: buildSparkline(p.intraday ?? [], p.price) }));
      const flashInit: FlashState = {};
      snapshot.forEach((p) => (flashInit[p.symbol] = null));
      setPrices(enriched);
      setFlash(flashInit);
      setLoading(false);
    };

    const onTicks = (diffs: TickUpdate[]) => {
      setPrices((prev) => {
        const copy = prev.slice();
        diffs.forEach((d) => {
          const idx = copy.findIndex((p) => p.symbol === d.symbol);
          if (idx === -1) return;
          const before = copy[idx].price;
          const after = d.price;
          let move: "up" | "down" | null = null;
          if (after > before) move = "up";
          else if (after < before) move = "down";
          if (move) {
            setFlash((f) => ({ ...f, [d.symbol]: move }));
            setTimeout(() => setFlash((f) => ({ ...f, [d.symbol]: null })), 300);
          }
          copy[idx] = { ...copy[idx], ...d, sparkline: buildSparkline(copy[idx].intraday ?? [], d.price) };
        });
        return copy;
      });
    };

    socket.on("price:snapshot", onSnapshot);
    socket.on("price:ticks", onTicks);

    // request a resubscribe/snapshot in case server missed initial send
    socket.emit("price:resubscribe");

    return () => {
      socket.off("price:snapshot", onSnapshot);
      socket.off("price:ticks", onTicks);
    };
  }, []); // re-run when socket.connect state changes

  return {
    prices,
    flash,
    loading,
    bySymbol: (sym: string) => byMap.get(sym) ?? null,
  };
}
