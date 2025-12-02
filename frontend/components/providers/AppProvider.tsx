// components/providers/AppProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabaseClient";
import { socket } from "@/utils/socket";
import type { AppState } from "@/types";
import { toast } from "sonner";

const AppContext = createContext<any>(null);

// Helper: safe JSON fetch wrapper
async function apiFetch(url: string, token?: string, opts: RequestInit = {}) {
  const headers = { ...(opts.headers || {}) } as Record<string, string>;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  const res = await fetch(url, { ...opts, headers });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

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
  //  Fetch Watchlist (robust)
  // -----------------------------------------------------
  const fetchWatchlist = useCallback(async () => {
    try {
      const { data: { session } = {} as any } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setWatchlist([]);
        return;
      }

      const { ok, json, status } = await apiFetch("http://localhost:5500/api/v1/watchlist", token);
      if (ok) {
        setWatchlist(json.watchlist ?? []);
      } else if (status === 401) {
        // unauthorized - clear local watchlist
        setWatchlist([]);
      } else {
        console.warn("Watchlist fetch failed:", json);
      }
    } catch (err) {
      console.error("Watchlist fetch error:", err);
    }
  }, []);

  // -----------------------------------------------------
  //  Toggle Watchlist (Optimistic with rollback)
  // -----------------------------------------------------
  const toggleWatchlist = useCallback(async (symbol: string) => {
    const { data: { session } = {} as any } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    const currentlySaved = watchlist.includes(symbol);
    // optimistic update
    setWatchlist((w) => (currentlySaved ? w.filter((s) => s !== symbol) : [...w, symbol]));

    try {
      const url = `http://localhost:5500/api/v1/watchlist/${currentlySaved ? "remove" : "add"}`;
      const method = currentlySaved ? "DELETE" : "POST";
      const { ok } = await apiFetch(url, token, {
        method,
        body: JSON.stringify({ symbol }),
      });

      if (!ok) {
        // rollback optimistic update
        setWatchlist((w) => (currentlySaved ? [...w, symbol] : w.filter((s) => s !== symbol)));
        toast.error("Failed to update watchlist");
      }
    } catch (err) {
      // rollback
      setWatchlist((w) => (currentlySaved ? [...w, symbol] : w.filter((s) => s !== symbol)));
      console.error("toggleWatchlist error:", err);
      toast.error("Network error");
    }
  }, [watchlist]);

  // -----------------------------------------------------
  //  Main Fetch (Profile + Holdings + Realized PnL)
  //  Called on mount, reconnect, auth changes or manually
  // -----------------------------------------------------
  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));

    try {
      const { data: { session } = {} as any } = await supabase.auth.getSession();
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

      const [profileRes, holdingsRes, realizedRes] = await Promise.all([
        apiFetch("http://localhost:5500/api/v1/users/profile", token),
        apiFetch("http://localhost:5500/api/v1/portfolio", token),
        apiFetch("http://localhost:5500/api/v1/transactions/realized-today", token),
      ]);

      const profileData = profileRes.json ?? {};
      const holdingsData = holdingsRes.json ?? {};
      const realizedData = realizedRes.json ?? {};

      setState({
        profile: profileData.user ?? null,
        holdings: holdingsData.holdings ?? [],
        realizedToday: realizedData.realizedToday ?? 0,
        dayPnl: 0,
        loading: false,
      });

      // fetch watchlist after auth & profile
      fetchWatchlist();
    } catch (err) {
      console.error("AppProvider refresh error:", err);
      setState((s) => ({ ...s, loading: false }));
    }
  }, [fetchWatchlist]);

  // -----------------------------------------------------
  //  Real-time portfolio update handler (socket)
  // -----------------------------------------------------
  useEffect(() => {
    const onPortfolioUpdate = (payload: any) => {
      try {
        // payload expected: { holdings, balance }
        setState((prev) => {
          const nextProfile = prev.profile ? { ...prev.profile } : null;
          if (payload.balance != null && nextProfile) {
            nextProfile.balance = payload.balance;
          }
          return {
            ...prev,
            holdings: payload.holdings ?? prev.holdings,
            profile: nextProfile ?? prev.profile,
          };
        });
      } catch (err) {
        console.error("Error applying portfolio:update payload:", err);
        // fallback to full refresh
        refresh();
      }
    };

    // Attach listener (socket may already be connected)
    try {
      socket.on("portfolio:update", onPortfolioUpdate);
    } catch (err) {
      console.warn("Socket attach failed (portfolio:update):", err);
    }

    return () => {
      try {
        socket.off("portfolio:update", onPortfolioUpdate);
      } catch (err) {
        // ignore
      }
    };
  }, [refresh]);

  // -----------------------------------------------------
  //  Reconnect handler: re-sync state when socket connects
  // -----------------------------------------------------
  useEffect(() => {
    const onConnect = () => {
      // re-sync from server on reconnect; this solves race conditions
      refresh();
    };

    try {
      socket.on("connect", onConnect);
    } catch (err) {
      console.warn("Socket on(connect) attach failed:", err);
    }

    return () => {
      try {
        socket.off("connect", onConnect);
      } catch (err) {
        // ignore
      }
    };
  }, [refresh]);

  // -----------------------------------------------------
  //  Mount + Auth Listener
  // -----------------------------------------------------
  useEffect(() => {
    refresh();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [refresh]);

  // -----------------------------------------------------
  //  Trading helpers
  // -----------------------------------------------------
  const tradeStock = async (symbol: string, price: number, action: "buy" | "sell") => {
    const { data: { session } = {} as any } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      toast.error("Please log in to trade");
      return false;
    }

    setTradingSymbol(symbol);
    try {
      const url = `http://localhost:5500/api/v1/trade/${action}`;
      const { ok, json } = await apiFetch(url, token, {
        method: "POST",
        body: JSON.stringify({ symbol, quantity: 1, price }),
      });

      if (!ok) {
        toast.error(json?.message || "Trade failed");
        return false;
      }

      // rely on socket 'portfolio:update' for instant UI update, but also do a full refresh
      // as a fallback to ensure consistency
      try {
        // small delay to allow backend to emit; still call refresh to be safe
        setTimeout(() => refresh(), 250);
      } catch (e) {
        refresh();
      }

      toast.success(`${action === "buy" ? "Bought" : "Sold"} successfully`);
      return true;
    } catch (err) {
      console.error("tradeStock error:", err);
      toast.error("Network error / server offline");
      setErrorSymbol(symbol);
      return false;
    } finally {
      setTradingSymbol(null);
      setErrorSymbol(null);
    }
  };

  const buyStock = (symbol: string, price: number) => tradeStock(symbol, price, "buy");
  const sellStock = (symbol: string, price: number) => tradeStock(symbol, price, "sell");

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

export const useApp = () => useContext(AppContext);
