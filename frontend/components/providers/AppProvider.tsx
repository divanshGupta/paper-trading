"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { supabase } from "@/utils/supabaseClient";
import { socket } from "@/utils/socket";
import { toast } from "sonner";

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


/* ----------------------------------------
   Safe typed fetch
---------------------------------------- */
async function apiFetch<T>(
  url: string,
  token?: string,
  opts: RequestInit = {}
): Promise<{ ok: boolean; status: number; json: T }> {
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string>),
    "Content-Type": "application/json",
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...opts, headers });
  const json = (await res.json().catch(() => ({}))) as T;

  return { ok: res.ok, status: res.status, json };
}

/* ----------------------------------------
   Context
---------------------------------------- */
interface AppContextValue {
  state: AppState;
  refresh: () => Promise<void>;
  watchlist: string[];
  toggleWatchlist: (symbol: string) => Promise<void>;
  tradeStock: (symbol: string, price: number, action: "buy" | "sell") => Promise<boolean>;
  buyStock: (symbol: string, price: number) => Promise<boolean>;
  sellStock: (symbol: string, price: number) => Promise<boolean>;
  tradingSymbol: string | null;
  errorSymbol: string | null;
}

const AppContext = createContext<AppContextValue | null>(null);

/* ----------------------------------------
   Provider
---------------------------------------- */
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    profile: null,
    holdings: [],
    loading: true,
    realizedToday: 0,
    dayPnl: 0,
  });

  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [tradingSymbol, setTradingSymbol] = useState<string | null>(null);
  const [errorSymbol] = useState<string | null>(null);

  /* ----------------------------------------
     Fetch Watchlist
  ---------------------------------------- */
  const fetchWatchlist = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) return setWatchlist([]);

    const { ok, json } = await apiFetch<WatchlistResponse>(
      "http://localhost:5500/api/v1/watchlist",
      token
    );

    if (ok) setWatchlist(json.watchlist ?? []);
  }, []);

  /* ----------------------------------------
     Toggle Watchlist
  ---------------------------------------- */
  const toggleWatchlist = useCallback(
    async (symbol: string) => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) return;

      const exists = watchlist.includes(symbol);

      // optimistic update
      setWatchlist((w) =>
        exists ? w.filter((s) => s !== symbol) : [...w, symbol]
      );

      const url = `http://localhost:5500/api/v1/watchlist/${exists ? "remove" : "add"}`;
      const method = exists ? "DELETE" : "POST";

      const { ok } = await apiFetch(url, token, {
        method,
        body: JSON.stringify({ symbol }),
      });

      if (!ok) {
        // rollback
        setWatchlist((w) =>
          exists ? [...w, symbol] : w.filter((s) => s !== symbol)
        );
        toast.error("Failed to update watchlist");
      }
    },
    [watchlist]
  );

  /* ----------------------------------------
     Main Refresh (Profile + Holdings + Realized PNL)
  ---------------------------------------- */
  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setState({
        profile: null,
        holdings: [],
        loading: false,
        realizedToday: 0,
        dayPnl: 0,
      });
      return;
    }

    const [profileRes, holdingsRes, realizedRes] = await Promise.all([
      apiFetch<ProfileResponse>("http://localhost:5500/api/v1/users/profile", token),
      apiFetch<PortfolioResponse>("http://localhost:5500/api/v1/portfolio", token),
      apiFetch<RealizedTodayResponse>(
        "http://localhost:5500/api/v1/transactions/realized-today",
        token
      ),
    ]);

    setState({
      profile: profileRes.json.user ?? null,
      holdings: holdingsRes.json.holdings ?? [],
      realizedToday: realizedRes.json.realizedToday ?? 0,
      loading: false,
      dayPnl: 0,
    });

    fetchWatchlist();
  }, [fetchWatchlist]);

/* ----------------------------------------
   Socket: portfolio:update
---------------------------------------- */
const handlePortfolioUpdate = useCallback(
  (payload: PortfolioUpdatePayload) => {
    try {
      setState((prev) => {
        const nextProfile = prev.profile
          ? { ...prev.profile, balance: payload.balance ?? prev.profile.balance }
          : null;

        return {
          ...prev,
          profile: nextProfile,
          holdings: payload.holdings ?? prev.holdings,
        };
      });
    } catch {
      refresh(); // fallback
    }
  },
  [refresh]
);

useEffect(() => {
  socket.on("portfolio:update", handlePortfolioUpdate);

  return () => {
    socket.off("portfolio:update", handlePortfolioUpdate);
  };
}, [handlePortfolioUpdate]);


/* ----------------------------------------
   Socket reconnect → refresh
---------------------------------------- */
const handleConnect = useCallback(() => {
  refresh();
}, [refresh]);

useEffect(() => {
  socket.on("connect", handleConnect);

  return () => {
    socket.off("connect", handleConnect);
  };
}, [handleConnect]);

  /* ----------------------------------------
     Mount + Auth Listener
  ---------------------------------------- */
  useEffect(() => {
    refresh();

    const { data: listener } = supabase.auth.onAuthStateChange(() => refresh());
    return () => listener.subscription?.unsubscribe();
  }, [refresh]);

  /* ----------------------------------------
     Trading
  ---------------------------------------- */
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

    setTradingSymbol(symbol);

    try {
      const url = `http://localhost:5500/api/v1/trade/${action}`;

      const { ok, json } = await apiFetch<TradeError>(url, token, {
        method: "POST",
        body: JSON.stringify({ symbol, price, quantity: 1 }),
      });

      if (!ok) {
        toast.error(json.message ?? "Trade failed");
        return false;
      }

      setTimeout(() => refresh(), 250);
      toast.success(`${action === "buy" ? "Bought" : "Sold"} successfully`);

      return true;
    } catch {
      toast.error("Network Error");
      return false;
    } finally {
      // always executes even if api fails
      setTradingSymbol(null);
    }
  };

  const buyStock = (symbol: string, price: number) =>
    tradeStock(symbol, price, "buy");

  const sellStock = (symbol: string, price: number) =>
    tradeStock(symbol, price, "sell");

  /* ----------------------------------------
     Provider Value
  ---------------------------------------- */
  const value: AppContextValue = {
    state,
    refresh,
    watchlist,
    toggleWatchlist,
    tradeStock,
    buyStock,
    sellStock,
    tradingSymbol,
    errorSymbol,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/* ----------------------------------------
   Hook
---------------------------------------- */
export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
};
