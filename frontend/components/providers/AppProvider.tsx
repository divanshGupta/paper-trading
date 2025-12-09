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

import { supabase } from "@/utils/supabaseClient";
import { socket } from "@/lib/socket";
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

/* -------------------------------------------------------
   Typed Fetch Wrapper
------------------------------------------------------- */
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

  const res = await fetch(url, { ...opts, headers, cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as T;

  return { ok: res.ok, status: res.status, json };
}

/* -------------------------------------------------------
   Context Types
------------------------------------------------------- */
interface AppContextValue {
  state: AppState;
  refresh: () => Promise<void>;
  watchlist: string[];
  toggleWatchlist: (symbol: string) => Promise<void>;
  tradeStock: (
    symbol: string,
    price: number,
    action: "buy" | "sell"
  ) => Promise<boolean>;
  buyStock: (symbol: string, price: number) => Promise<boolean>;
  sellStock: (symbol: string, price: number) => Promise<boolean>;
  tradingSymbol: string | null;
  errorSymbol: string | null;
}

const AppContext = createContext<AppContextValue | null>(null);

/* -------------------------------------------------------
   PROVIDER
------------------------------------------------------- */
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

  /* -------------------------------------------------------
     CRITICAL: We must wait BOTH:
     1. supabase session restored
     2. socket fully authenticated & ready
  ------------------------------------------------------- */
  const [sessionReady, setSessionReady] = useState(false);
  const [socketReady, setSocketReady] = useState(false);

  /* expose these to children once fully ready */
  const fullyReady = sessionReady && socketReady;

  const BACKEND_URL = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "",
    []
  );

  /* -------------------------------------------------------
     Step 1 — Restore supabase session FIRST
  ------------------------------------------------------- */
  useEffect(() => {
    supabase.auth.getSession().finally(() => setSessionReady(true));
  }, []);

  /* -------------------------------------------------------
     Detect socket readiness ONCE (no loops)
  ------------------------------------------------------- */
  useEffect(() => {
    const markReady = () => setSocketReady(true);
    const markDown = () => setSocketReady(false);

    socket.on("connect", markReady);
    socket.on("disconnect", markDown);

    if (socket.connected) markReady();

    return () => {
      socket.off("connect", markReady);
      socket.off("disconnect", markDown);
    };
  }, []);

  /* -------------------------------------------------------
     Safe Token Getter
  ------------------------------------------------------- */
  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  /* -------------------------------------------------------
     Fetch Watchlist
  ------------------------------------------------------- */
  const fetchWatchlist = useCallback(async () => {
    const token = await getToken();
    if (!token) return setWatchlist([]);

    const { ok, json } = await apiFetch<WatchlistResponse>(
      `${BACKEND_URL}/api/v1/watchlist`,
      token
    );

    if (ok) setWatchlist(json.watchlist ?? []);
  }, [BACKEND_URL, getToken]);

  /* -------------------------------------------------------
     Toggle Watchlist
  ------------------------------------------------------- */
  const toggleWatchlist = useCallback(
    async (symbol: string) => {
      const token = await getToken();
      if (!token) return;

      const exists = watchlist.includes(symbol);

      // optimistic update
      setWatchlist((prev) =>
        exists ? prev.filter((s) => s !== symbol) : [...prev, symbol]
      );

      const { ok } = await apiFetch(
        `${BACKEND_URL}/api/v1/watchlist/${exists ? "remove" : "add"}`,
        token,
        {
          method: exists ? "DELETE" : "POST",
          body: JSON.stringify({ symbol }),
        }
      );

      if (!ok) {
        // rollback
        setWatchlist((prev) =>
          exists ? [...prev, symbol] : prev.filter((s) => s !== symbol)
        );
        toast.error("Failed to update watchlist");
      }
    },
    [watchlist, BACKEND_URL, getToken]
  );

  /* -------------------------------------------------------
     MAIN REFRESH — ONLY when both ready
  ------------------------------------------------------- */
  const refresh = useCallback(async () => {
  const token = await getToken();

  // no session → stop loading immediately
  if (!token) {
    setState({
      profile: null,
      holdings: [],
      realizedToday: 0,
      dayPnl: 0,
      loading: false,
    });
    setWatchlist([]);
    return;
  }

  // start loading
  setState((prev) => ({ ...prev, loading: true }));

  try {
    const [profileRes, holdingsRes, realizedRes] = await Promise.all([
      apiFetch<ProfileResponse>(`${BACKEND_URL}/api/v1/users/profile`, token),
      apiFetch<PortfolioResponse>(`${BACKEND_URL}/api/v1/portfolio`, token),
      apiFetch<RealizedTodayResponse>(
        `${BACKEND_URL}/api/v1/transactions/realized-today`,
        token
      ),
    ]);

    setState({
      profile: profileRes.json.user ?? null,
      holdings: holdingsRes.json.holdings ?? [], // empty array is valid
      realizedToday: realizedRes.json.realizedToday ?? 0,
      dayPnl: 0,
      loading: false, // IMPORTANT FIX
    });
  } catch (err) {
    console.error("Refresh error:", err);

    // even on error → stop showing skeleton
    setState((prev) => ({ ...prev, loading: false }));
  }

  fetchWatchlist();
}, [BACKEND_URL, getToken, fetchWatchlist]);


  /* -------------------------------------------------------
     portfolio:update listener
  ------------------------------------------------------- */
  const handlePortfolioUpdate = useCallback(
    (payload: PortfolioUpdatePayload) => {
      setState((prev) => ({
        ...prev,
        profile: prev.profile
          ? {
              ...prev.profile,
              balance: payload.balance ?? prev.profile.balance,
            }
          : null,
        holdings: payload.holdings ?? prev.holdings,
      }));
    },
    []
  );

  /* attach update listener only when fully ready */
  useEffect(() => {
  if (!sessionReady) return; // <-- do NOT return a cleanup here

  const listener = (payload: PortfolioUpdatePayload) =>
    handlePortfolioUpdate(payload);

  socket.on("portfolio:update", listener);

  return () => {
    socket.off("portfolio:update", listener);
  };
}, [sessionReady, handlePortfolioUpdate]);


  /* -------------------------------------------------------
     Socket reconnect → refresh ONLY once
  ------------------------------------------------------- */
  const handleConnect = useCallback(() => {
  if (!sessionReady) return;
  refresh(); // refresh app state when socket reconnects
}, [sessionReady, refresh]);

useEffect(() => {
  if (!sessionReady) return;

  const listener = () => handleConnect();

  socket.on("connect", listener);

  return () => {
    socket.off("connect", listener);
  };
}, [sessionReady, handleConnect]);


  /* -------------------------------------------------------
     Auth change → refresh
  ------------------------------------------------------- */
  useEffect(() => {
    if (!sessionReady) return;

    const sub = supabase.auth.onAuthStateChange(() => refresh());

    return () => {
      sub?.data?.subscription?.unsubscribe?.();
    };
  }, [sessionReady, refresh]);

  /* -------------------------------------------------------
     Trading
  ------------------------------------------------------- */
  const tradeStock = useCallback(
    async (
    symbol: string,
    price: number,
    action: "buy" | "sell"
  ): Promise<boolean> => {
      const token = await getToken();
      if (!token) {
        toast.error("Please log in to trade");
        return false;
      }

      setTradingSymbol(symbol);

      try {
        const { ok, json } = await apiFetch<TradeError>(
          `${BACKEND_URL}/api/v1/trade/${action}`,
          token,
          {
            method: "POST",
            body: JSON.stringify({ symbol, price, quantity: 1 }),
          }
        );

        if (!ok) {
          toast.error(json.message ?? "Trade failed");
          return false;
        }

        setTimeout(() => refresh(), 200);
        toast.success(action === "buy" ? "Bought" : "Sold");

        return true;
      } catch (err) {
        toast.error("Network Error");
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

  /* -------------------------------------------------------
     PROVIDER VALUE
  ------------------------------------------------------- */
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

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside <AppProvider>");
  return ctx;
};
