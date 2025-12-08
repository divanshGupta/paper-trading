"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { socket } from "@/lib/socket";
import type { EnrichedPrice, FlashState, Candle } from "@/types";

const PriceContext = createContext<any>(null);

// ---------------------------------------------
// Utility: Build sparkline
// ---------------------------------------------
function buildSparkline(intraday: Candle[] = [], price: number) {
  const pts = intraday.map((c) => ({
    time: Math.floor(c.tStart / 1000),
    value: c.close,
  }));
  pts.push({ time: Math.floor(Date.now() / 1000), value: price });
  return pts.slice(-120);
}

export function PriceFeedProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<EnrichedPrice[]>([]);
  const [flash, setFlash] = useState<FlashState>({});
  const [loading, setLoading] = useState(true);

  // prevent duplicate listeners
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    console.log("🔥 PriceFeedProvider: initialized");

    // -----------------------------
    // Snapshot
    // -----------------------------
    const onSnapshot = (snapshot: EnrichedPrice[]) => {
      console.log("📥 SNAPSHOT:", snapshot.length, "symbols");

      const enriched = snapshot.map((p) => ({
        ...p,
        sparkline: buildSparkline(p.intraday ?? [], p.price),
      }));

      const flashInit: FlashState = {};
      enriched.forEach((p) => (flashInit[p.symbol] = null));

      setPrices(enriched);
      setFlash(flashInit);
      setLoading(false);
    };

    // -----------------------------
    // Ticks (diff updates)
    // -----------------------------
    const onTicks = (diffs: any[]) => {
      setPrices((prev) => {
        const arr = [...prev];

        diffs.forEach((u) => {
          const idx = arr.findIndex((x) => x.symbol === u.symbol);
          if (idx < 0) return;

          const before = arr[idx].price;
          const after = u.price;

          const movement =
            after > before ? "up" : after < before ? "down" : null;

          if (movement) {
            setFlash((f) => ({ ...f, [u.symbol]: movement }));
            setTimeout(() => {
              setFlash((f) => ({ ...f, [u.symbol]: null }));
            }, 300);
          }

          arr[idx] = {
            ...arr[idx],
            ...u,
            sparkline: buildSparkline(arr[idx].intraday ?? [], u.price),
          };
        });

        return arr;
      });
    };

    // Attach listeners ONCE
    socket.on("price:snapshot", onSnapshot);
    socket.on("price:ticks", onTicks);

    // subscribe immediately if connected
    if (socket.connected) socket.emit("price:subscribe");

    // resubscribe after reconnect
    socket.on("connect", () => {
      console.log("🔄 Reconnected → resubscribe to price feed");
      socket.emit("price:subscribe");
    });
  }, []);

  // ---------------------------------------------
  // Lookup map
  // ---------------------------------------------
  const byMap = useMemo(() => {
    const map = new Map<string, EnrichedPrice>();
    prices.forEach((p) => map.set(p.symbol, p));
    return map;
  }, [prices]);

  const value = {
    prices,
    flash,
    loading,
    bySymbol: (sym: string) => byMap.get(sym) ?? null,
  };

  return <PriceContext.Provider value={value}>{children}</PriceContext.Provider>;
}

export function usePriceFeed() {
  const ctx = useContext(PriceContext);
  if (!ctx) throw new Error("usePriceFeed must be used inside provider");
  return ctx;
}
