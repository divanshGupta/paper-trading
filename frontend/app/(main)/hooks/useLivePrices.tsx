"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { supabase } from "@/utils/supabaseClient";
import { ArrowUp, ArrowDown } from "lucide-react";

type Price = {
  symbol: string;
  name?: string;
  price: number;
  previousClose: number;
  todayOpen: number;
};

export function useLivePrices() {
  const [prices, setPrices] = useState<Price[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // flash effect for red/green blinking on price movement
  const [flash, setFlash] = useState<{ [symbol: string]: "up" | "down" | null }>({});

  // fast lookup map
  const map = useMemo(() => {
    const m = new Map<string, Price>();
    for (const p of prices) m.set(p.symbol, p);
    return m;
  }, [prices]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return; // not logged in

      const s = io("http://localhost:5500", {
        transports: ["websocket"],
        auth: { token },
      });
      socketRef.current = s;

      s.on("connect", () => {
        console.log("socket connected", s.id);
      });

      /**
       * 🔥 1) FULL SNAPSHOT (includes previousClose & todayOpen)
       */
      s.on("price:snapshot", (arr: Price[]) => {
        if (!cancelled) setPrices(arr);
      });

      /**
       * 🔥 2) TICK UPDATES (just changed symbols)
       *     Now includes previousClose & todayOpen
       */
      s.on(
        "price:ticks",
        (
          diffs: Array<{
            symbol: string;
            price: number;
            previousClose: number;
            todayOpen: number;
          }>
        ) => {
          if (cancelled) return;

          setPrices((prev) =>
            prev.map((p) => {
              const found = diffs.find((d) => d.symbol === p.symbol);
              if (!found) return p;

              // detect direction (for flashing)
              const direction =
                found.price > p.price
                  ? "up"
                  : found.price < p.price
                  ? "down"
                  : null;

              if (direction) {
                setFlash((f) => ({ ...f, [p.symbol]: direction }));

                setTimeout(() => {
                  setFlash((f) => ({ ...f, [p.symbol]: null }));
                }, 300);
              }

              return {
                ...p,
                price: found.price,
                previousClose: found.previousClose,
                todayOpen: found.todayOpen,
              };
            })
          );
        }
      );

      s.on("disconnect", () => {
        console.log("socket disconnected");
      });
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  /**
   * 🔥  Compute arrow movement for UI
   *  Example usage:
   *    const arrow = movementArrow(symbol)
   */
  const movementArrow = (symbol: string) => {
    const dir = flash[symbol];

    if (dir === "up") return <ArrowUp size={14} className="text-green-500" />;
    if (dir === "down") return <ArrowDown size={14} className="text-red-500" />;

    return null;
  };

  return {
    prices,
    flash,
    bySymbol: (sym: string) => map.get(sym) || null,
    movementArrow,
  };
}
