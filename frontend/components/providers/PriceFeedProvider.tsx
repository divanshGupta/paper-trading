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
import type { EnrichedPrice, FlashState, Candle, Price } from "@/types";

// ---------------------------------------------
// Backend payload types
// ---------------------------------------------
export interface SnapshotPrice {
  symbol: string;
  price: number;
  previousClose: number;
  intraday: Candle[];
  sector?: string;
}

export interface TickUpdate {
  symbol: string;
  price: number;
  previousClose?: number;
  sector?: string;
  [key: string]: unknown;
}

// ---------------------------------------------
// Context type
// ---------------------------------------------
interface PriceFeedContextValue {
  prices: EnrichedPrice[];
  flash: FlashState;
  loading: boolean;
  bySymbol: (sym: string) => EnrichedPrice | null;
}

const PriceContext = createContext<PriceFeedContextValue | null>(null);

// ---------------------------------------------
// Sparkline utility
// ---------------------------------------------
function buildSparkline(intraday: Candle[] = [], price: number) {
  const pts = intraday.map((c) => ({
    time: Math.floor(c.tStart / 1000),
    value: c.close,
  }));
  pts.push({ time: Math.floor(Date.now() / 1000), value: price });
  return pts.slice(-120);
}

// ---------------------------------------------
// Provider
// ---------------------------------------------
export function PriceFeedProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<EnrichedPrice[]>([]);
  const [flash, setFlash] = useState<FlashState>({});
  const [loading, setLoading] = useState(true);

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    console.log("🔥 PriceFeedProvider initialized");

    // ---------------------------
    // Snapshot handler
    // ---------------------------
    const onSnapshot = (snapshot: Price[]) => {
        console.log("📥 SNAPSHOT:", snapshot.length, "symbols");

        const enriched: EnrichedPrice[] = snapshot.map((p) => {
            const change = p.price - p.previousClose;
            const changePercent = p.previousClose
            ? (change / p.previousClose) * 100
            : 0;

            return {
            ...p,

            // override/build sparkline
            sparkline: buildSparkline(p.intraday ?? [], p.price),

            // computed price properties
            change,
            changePercent,

            // portfolio defaults (user-specific later overrides)
            holdingQty: 0,
            invested: 0,
            liveValue: 0,
            unrealized: 0,
            isHolding: false,

            flash: null,
            };
        });

        setPrices(enriched);

        // Initialize flash states
        const flashInit: FlashState = {};
        enriched.forEach((p) => (flashInit[p.symbol] = null));
        setFlash(flashInit);

        setLoading(false);
        };


    // ---------------------------
    // Tick handler
    // ---------------------------
    const onTicks = (diffs: TickUpdate[]) => {
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

            const updated = {
                ...arr[idx],
                ...u,
                sparkline: buildSparkline(arr[idx].intraday ?? [], after),

                // KEEP portfolio fields
                holdingQty: arr[idx].holdingQty,
                invested: arr[idx].invested,
                liveValue: after * arr[idx].holdingQty,
                unrealized: after * arr[idx].holdingQty - arr[idx].invested,
                isHolding: arr[idx].holdingQty > 0,
            };

            arr[idx] = updated;
            });

            return arr;
        });
        };


    // Attach listeners
    socket.on("price:snapshot", onSnapshot);
    socket.on("price:ticks", onTicks);

    // Subscribe ONCE
    const subscribeOnce = () => {
      console.log("📡 Subscribing to price feed");
      socket.emit("price:subscribe");
    };

    socket.once("connect", subscribeOnce);

    if (socket.connected) subscribeOnce();

    // Cleanup
    return () => {
      socket.off("price:snapshot", onSnapshot);
      socket.off("price:ticks", onTicks);
      socket.off("connect", subscribeOnce);
    };
  }, []);

  // Lookup map
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

export function usePriceFeed() {
  const ctx = useContext(PriceContext);
  if (!ctx) throw new Error("usePriceFeed must be used inside provider");
  return ctx;
}
