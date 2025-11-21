"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { supabase } from "@/utils/supabaseClient";
import { Price, Candle, PricePoint, FlashState } from "@/types";

export function useLivePrices() {
  const [prices, setPrices] = useState<Price[]>([]);
  const [flash, setFlash] = useState<FlashState>({});
  const socketRef = useRef<Socket | null>(null);

  // -----------------------------
  // Helper: convert intraday OHLC → sparkline [{time, value}]
  // -----------------------------
  const buildSparkline = (intraday: Candle[], price: number) => {
    const points = intraday.map((c) => ({
      time: Math.floor(c.tStart / 1000),
      value: c.close,
    }));

    // Add latest tick price as last “live point”
    if (points.length > 0) {
      points.push({
        time: Math.floor(Date.now() / 1000),
        value: price,
      });
    }

    return points.slice(-120); // keep last 120 points
  };

  // -----------------------------
  // Quick map for O(log n) lookup
  // -----------------------------
  const map = useMemo(() => {
    const m = new Map<string, Price>();
    for (const p of prices) m.set(p.symbol, p);
    return m;
  }, [prices]);

  // -----------------------------
  // Socket Setup
  // -----------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const socket = io("http://localhost:5500", {
        transports: ["websocket"],
        auth: { token },
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("socket connected", socket.id);
      });

      // -----------------------------
      // INITIAL SNAPSHOT
      // -----------------------------
      socket.on("price:snapshot", (snapshot: Price[]) => {
        if (cancelled) return;

        console.log("📥 snapshot received", snapshot);

        const flashInit: FlashState = {};
        snapshot.forEach((p) => (flashInit[p.symbol] = null));

        // attach sparkline
        const enriched = snapshot.map((p) => ({
          ...p,
          sparkline: buildSparkline(p.intraday ?? [], p.price),
        })) as any;

        setFlash(flashInit);
        setPrices(enriched);
      });

      // -----------------------------
      // REAL-TIME TICKS
      // -----------------------------
      socket.on("price:ticks", (diffs) => {
        if (cancelled) return;

        setPrices((prev) => {
          const updated = [...prev];

          diffs.forEach((diff:any) => {
            const idx = updated.findIndex((p) => p.symbol === diff.symbol);
            if (idx === -1) return;

            const before = updated[idx].price;
            const after = diff.price;

            // flash direction
            let move: "up" | "down" | null = null;
            if (after > before) move = "up";
            else if (after < before) move = "down";

            if (move) {
              setFlash((f) => ({ ...f, [diff.symbol]: move }));
              setTimeout(
                () => setFlash((f) => ({ ...f, [diff.symbol]: null })),
                300
              );
            }

            // update object + sparkline
            updated[idx] = {
              ...updated[idx],
              ...diff,
              sparkline: buildSparkline(
                updated[idx].intraday ?? [],
                diff.price
              ),
            };
          });

          return updated;
        });
      });

      socket.on("disconnect", () => console.log("❌ socket disconnected"));
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return {
    prices,
    flash,
    bySymbol: (sym: string) => map.get(sym) || null,
  };
}
