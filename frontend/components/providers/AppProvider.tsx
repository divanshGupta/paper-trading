"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import type { AppState } from "@/types";
import { toast } from "sonner";

const AppContext = createContext<{
  state: AppState;
  refresh: () => Promise<void>;
  watchlist: string[];
  toggleWatchlist: (symbol: string) => Promise<void>;
  tradeStock: (symbol: string, price: number, action: "buy" | "sell") => Promise<boolean>;
  buyStock: (symbol: string, price: number) => Promise<boolean>;
  sellStock: (symbol: string, price: number) => Promise<boolean>;
  tradingSymbol: string | null;
  errorSymbol: string | null;
}>(null as any);

// PROVIDER
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    profile: null,
    holdings: [],
    dayPnl: 0,
    realizedToday: 0,
    loading: true,
  });

  const [tradingSymbol, setTradingSymbol] = useState<string | null>(null);

  const [errorSymbol, setErrorSymbol] = useState<string | null>(null);

  const [watchlist, setWatchlist] = useState<string[]>([]);

  // -----------------------------------------------------
  //  Fetch Watchlist Once
  // -----------------------------------------------------
  const fetchWatchlist = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5500/api/v1/watchlist", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      setWatchlist(json.watchlist ?? []);
    } catch (err) {
      console.error("Watchlist fetch error:", err);
    }
  };

  // -----------------------------------------------------
  //  Toggle Watchlist (Optimistic)
  // -----------------------------------------------------
  const toggleWatchlist = async (symbol: string) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) return;

    const currentlySaved = watchlist.includes(symbol);

    // Optimistic UI
    setWatchlist((w) =>
      currentlySaved ? w.filter((s) => s !== symbol) : [...w, symbol]
    );

    // Backend update
    await fetch(
      `http://localhost:5500/api/v1/watchlist/${currentlySaved ? "remove" : "add"}`,
      {
        method: currentlySaved ? "DELETE" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbol }),
      }
    );
  };

  // -----------------------------------------------------
  //  UNIVERSAL TRADE FUNCTION (BUY / SELL)
  // -----------------------------------------------------
  const tradeStock = async (
    symbol: string,
    price: number,
    action: "buy" | "sell"
  ): Promise<boolean> => {

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      toast.error("Please log in to trade");
      return false;
    }

    setTradingSymbol(symbol); // ⬅️ mark this stock as being traded

    try {
      const res = await fetch(
        `http://localhost:5500/api/v1/trade/${action}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ symbol, quantity: 1, price }),
        }
      );

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(payload.message || "Trade failed");
        return false;
      }

      await refresh();
      toast.success(`${action === "buy" ? "Bought" : "Sold"} successfully`);
      return true;
    } catch (err) {
      toast.error("Network error / server offline");
      setErrorSymbol(symbol);
      return false;
    } finally {
      setTradingSymbol(null);
      setErrorSymbol(null);
    }
  };

  // -----------------------------------------------------
  //  UI-FRIENDLY WRAPPERS
  // -----------------------------------------------------
  const buyStock = async (symbol: string, price: number) => {
    return tradeStock(symbol, price, "buy");
  };

  const sellStock = async (symbol: string, price: number) => {
    return tradeStock(symbol, price, "sell");
  };

  // -----------------------------------------------------
  //  Main Fetch (Profile + Holdings + Realized PnL)
  // -----------------------------------------------------
  const refresh = async () => {
    setState((s) => ({ ...s, loading: true }));

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    if (!token) {
      setState({
        profile: null,
        holdings: [],
        dayPnl: 0,
        realizedToday: 0,
        loading: false,
      });
      setWatchlist([]);
      return;
    }

    try {
      const [profileRes, holdingsRes, realizedRes] = await Promise.all([
        fetch("http://localhost:5500/api/v1/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        }),

        fetch("http://localhost:5500/api/v1/portfolio", {
          headers: { Authorization: `Bearer ${token}` },
        }),

        fetch("http://localhost:5500/api/v1/transactions/realized-today", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [profileData, holdingsData, realizedData] = await Promise.all([
        profileRes.json(),
        holdingsRes.json(),
        realizedRes.json(),
      ]);

      setState({
        profile: profileData.user ?? null,
        holdings: holdingsData.holdings ?? [],
        realizedToday: realizedData.realizedToday ?? 0,
        dayPnl: 0,
        loading: false,
      });

      // Load watchlist after
      fetchWatchlist();
    } catch (err) {
      console.error("AppProvider fetch error:", err);
      setState((s) => ({ ...s, loading: false }));
    }
  };

  // -----------------------------------------------------
  //  Mount + Auth Listener
  // -----------------------------------------------------
  useEffect(() => {
    refresh();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        refresh,
        watchlist,
        toggleWatchlist,
        tradeStock,
        buyStock,
        sellStock,
        tradingSymbol,
        errorSymbol,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Hook
export const useApp = () => useContext(AppContext);
