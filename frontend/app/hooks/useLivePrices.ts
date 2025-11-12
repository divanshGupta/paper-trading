"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { supabase } from "@/utils/supabaseClient";

type Price = { symbol: string; name?: string; price: number };

export function useLivePrices() {
  const [prices, setPrices] = useState<Price[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const [flash, setFlash] = useState<{[symbol:string]: "up" | "down" | null}>({});


  // local fast lookup
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
      if (!token) return; // user must be logged in for our socket auth

      const s = io("http://localhost:5500", {
        transports: ["websocket"],
        auth: { token },
      });
      socketRef.current = s;

      s.on("connect", () => {
        console.log("socket connected", s.id);
      });

      s.on("price:snapshot", (arr: Price[]) => {
        if (!cancelled) setPrices(arr);
      });

      // fetching prices from backend and detects up/down here
      s.on("price:ticks", (diffs: Array<{ symbol: string; price: number }>) => {
        if (cancelled) return;

        setPrices(prev =>
          prev.map(p => {
            const found = diffs.find(d => d.symbol === p.symbol);
            if (!found) return p;

            // detect direction
            const direction = found.price > p.price ? "up" : found.price < p.price ? "down" : null;

            if (direction) {
              setFlash(f => ({ ...f, [p.symbol]: direction }));
              setTimeout(() => {
                setFlash(f => ({ ...f, [p.symbol]: null }));
              }, 300);
            }

            return { ...p, price: found.price };
          })
        );
      });

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

  return { prices, bySymbol: (sym: string) => map.get(sym) || null, flash };
}
