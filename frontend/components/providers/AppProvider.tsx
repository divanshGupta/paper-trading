"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
} from "react";

import { socket } from "@/lib/socket";
import { supabase } from "@/utils/supabaseClient";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";

import type {
  AppState,
  PortfolioResponse,
  ProfileResponse,
  PortfolioUpdatePayload,
  RealizedTodayResponse,
  WatchlistResponse,
} from "@/types";

interface TradeError {
  message?: string;
}

/* -------------------------------------------------------
   Typed fetch wrapper
   Attaches auth token and parses JSON for every API call
------------------------------------------------------- */
async function apiFetch<T>(
  url: string,
  token?: string | null,
  opts: RequestInit = {}
): Promise<{ ok: boolean; status: number; json: T }> {
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string>),
    "Content-Type": "application/json",
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...opts, headers, cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as T;

  return { ok: res.ok, status: res.status, json };
}

/* -------------------------------------------------------
   Context shape — what useApp() exposes to components
------------------------------------------------------- */
interface AppContextValue {
  state: AppState;
  refresh: () => Promise<void>;
  watchlist: string[];
  toggleWatchlist: (symbol: string) => Promise<void>;
  tradeStock: (symbol: string, price: number, action: "buy" | "sell") => Promise<boolean>;
  buyStock: (symbol: string, price: number) => Promise<boolean>;
  sellStock: (symbol: string, price: number) => Promise<boolean>;
  tradingSymbol: string | null;
}

const AppContext = createContext<AppContextValue | null>(null);

/* -------------------------------------------------------
   AppProvider
   
   Responsibilities:
   - Fetch and cache user profile, holdings, realized P&L, watchlist
   - Expose trade actions (buy/sell)
   - React to socket events (portfolio updates, reconnects)
   - React to auth changes (login/logout) via useAuthStore

   What it does NOT do:
   - Manage auth tokens (useAuthStore handles that)
   - Manage live stock prices (PriceFeedProvider handles that)
   - Connect/disconnect socket (SocketProvider handles that)
------------------------------------------------------- */
export function AppProvider({ children }: { children: ReactNode }) {

  // Token comes from Zustand store — no Supabase call needed here.
  // isReady becomes true once the store has resolved the initial session.
  const { token, isReady } = useAuthStore();

  const [state, setState] = useState<AppState>({
    profile: null,
    holdings: [],
    loading: true,
    realizedToday: 0,
    dayPnl: 0,
  });

  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [tradingSymbol, setTradingSymbol] = useState<string | null>(null);

  const BACKEND_URL = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "", []);

  // Synchronous — reads from Zustand memory, zero network cost.
  // Named getToken for consistency with apiFetch call sites.
  const getToken = useCallback(() => token, [token]);

  /* -------------------------------------------------------
     Fetch watchlist separately so refresh() stays fast
  ------------------------------------------------------- */
  const fetchWatchlist = useCallback(async () => {
    const t = getToken();
    if (!t) return setWatchlist([]);

    const { ok, json } = await apiFetch<WatchlistResponse>(
      `${BACKEND_URL}/api/v1/watchlist`,
      t
    );

    if (ok) setWatchlist(json.watchlist ?? []);
  }, [BACKEND_URL, getToken]);

  /* -------------------------------------------------------
     Toggle watchlist with optimistic update
     Rolls back on failure so UI stays consistent
  ------------------------------------------------------- */
  const toggleWatchlist = useCallback(
    async (symbol: string) => {
      const t = getToken();
      if (!t) return;

      const exists = watchlist.includes(symbol);

      // Update UI immediately before the API responds
      setWatchlist((prev) =>
        exists ? prev.filter((s) => s !== symbol) : [...prev, symbol]
      );

      const { ok } = await apiFetch(
        `${BACKEND_URL}/api/v1/watchlist/${exists ? "remove" : "add"}`,
        t,
        {
          method: exists ? "DELETE" : "POST",
          body: JSON.stringify({ symbol }),
        }
      );

      // Rollback if API failed
      if (!ok) {
        setWatchlist((prev) =>
          exists ? [...prev, symbol] : prev.filter((s) => s !== symbol)
        );
        toast.error("Failed to update watchlist");
      }
    },
    [watchlist, BACKEND_URL, getToken]
  );

  /* -------------------------------------------------------
     Main refresh — fetches all user data in parallel
     Called on: initial load, socket reconnect, auth change, post-trade
  ------------------------------------------------------- */
  const refresh = useCallback(async () => {
    const t = getToken();

    // Not logged in — clear state immediately, don't hang on loading
    if (!t) {
      setState({ profile: null, holdings: [], realizedToday: 0, dayPnl: 0, loading: false });
      setWatchlist([]);
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    try {
      // Fire all three requests in parallel — much faster than sequential
      const [profileRes, holdingsRes, realizedRes] = await Promise.all([
        apiFetch<ProfileResponse>(`${BACKEND_URL}/api/v1/users/profile`, t),
        apiFetch<PortfolioResponse>(`${BACKEND_URL}/api/v1/portfolio`, t),
        apiFetch<RealizedTodayResponse>(`${BACKEND_URL}/api/v1/transactions/realized-today`, t),
      ]);

      setState({
        profile: profileRes.json.user ?? null,
        holdings: holdingsRes.json.holdings ?? [],
        realizedToday: realizedRes.json.realizedToday ?? 0,
        dayPnl: 0,
        loading: false,
      });
    } catch (err) {
      console.error("Refresh error:", err);
      setState((prev) => ({ ...prev, loading: false }));
    }

    // Watchlist fetched separately — doesn't block main state
    fetchWatchlist();
  }, [BACKEND_URL, getToken, fetchWatchlist]);

  /* -------------------------------------------------------
     Initial data load
     Runs once when auth store signals session is ready
  ------------------------------------------------------- */
  useEffect(() => {
    if (!isReady) return;
    refresh();
  }, [isReady]); // intentionally only depends on isReady

  /* -------------------------------------------------------
     Portfolio socket updates
     Backend emits this after every trade so balance and
     holdings update instantly without a full refresh
  ------------------------------------------------------- */
  useEffect(() => {
    if (!isReady) return;

    const handlePortfolioUpdate = (payload: PortfolioUpdatePayload) => {
      setState((prev) => ({
        ...prev,
        profile: prev.profile
          ? { ...prev.profile, balance: payload.balance ?? prev.profile.balance }
          : null,
        holdings: payload.holdings ?? prev.holdings,
      }));
    };

    socket.on("portfolio:update", handlePortfolioUpdate);
    return () => { socket.off("portfolio:update", handlePortfolioUpdate); };
  }, [isReady]);

  /* -------------------------------------------------------
     Socket reconnect → re-fetch data
     Handles cases where user regains connection after being offline
  ------------------------------------------------------- */
  useEffect(() => {
    if (!isReady) return;

    const handleReconnect = () => refresh();

    socket.on("connect", handleReconnect);
    return () => { socket.off("connect", handleReconnect); };
  }, [isReady, refresh]);

  /* -------------------------------------------------------
     Auth state change → re-fetch or clear
     Covers: login on another tab, token refresh, logout
     Note: logout clears token in useAuthStore, which sets
     token to null here, which makes refresh() clear state
  ------------------------------------------------------- */
  useEffect(() => {
    if (!isReady) return;

    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
    return () => { sub.subscription.unsubscribe(); };
  }, [isReady, refresh]);

  /* -------------------------------------------------------
     Trade actions
  ------------------------------------------------------- */
  const tradeStock = useCallback(
    async (symbol: string, price: number, action: "buy" | "sell"): Promise<boolean> => {
      const t = getToken();
      if (!t) { toast.error("Please log in to trade"); return false; }

      setTradingSymbol(symbol);

      try {
        const { ok, json } = await apiFetch<TradeError>(
          `${BACKEND_URL}/api/v1/trade/${action}`,
          t,
          { method: "POST", body: JSON.stringify({ symbol, price, quantity: 1 }) }
        );

        if (!ok) { toast.error(json.message ?? "Trade failed"); return false; }

        // Small delay lets backend finish writing before we re-fetch
        setTimeout(() => refresh(), 200);
        toast.success(action === "buy" ? "Bought!" : "Sold!");
        return true;
      } catch {
        toast.error("Network error");
        return false;
      } finally {
        setTradingSymbol(null);
      }
    },
    [BACKEND_URL, getToken, refresh]
  );

  const buyStock = useCallback(
    (symbol: string, price: number) => tradeStock(symbol, price, "buy"),
    [tradeStock]
  );

  const sellStock = useCallback(
    (symbol: string, price: number) => tradeStock(symbol, price, "sell"),
    [tradeStock]
  );

  return (
    <AppContext.Provider value={{
      state,
      refresh,
      watchlist,
      toggleWatchlist,
      tradeStock,
      buyStock,
      sellStock,
      tradingSymbol,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside <AppProvider>");
  return ctx;
};