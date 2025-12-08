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
   Typed Fetch Wrapper
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

  const res = await fetch(url, { ...opts, headers, cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as T;

  return { ok: res.ok, status: res.status, json };
}

/* ----------------------------------------
   Context Types
---------------------------------------- */
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

  // Ensure we do not call refresh until Supabase has restored session from storage
  const [sessionReady, setSessionReady] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

  /* ----------------------------------------
     Step 1: Hydrate Supabase session FIRST
     - This prevents refresh() running with a null token on hard reload.
  ---------------------------------------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await supabase.auth.getSession(); // ensures session is read from storage
      } catch (e) {
        // ignore - we'll still mark ready so app functions
      } finally {
        if (mounted) setSessionReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ----------------------------------------
     Safe Token Getter (stable)
  ---------------------------------------- */
  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  /* ----------------------------------------
     Fetch Watchlist
  ---------------------------------------- */
  const fetchWatchlist = useCallback(async () => {
    const token = await getToken();
    if (!token) return setWatchlist([]);

    const { ok, json } = await apiFetch<WatchlistResponse>(
      `${BACKEND_URL}/api/v1/watchlist`,
      token
    );

    if (ok) setWatchlist(json.watchlist ?? []);
  }, [BACKEND_URL, getToken]);

  /* ----------------------------------------
     Toggle Watchlist (optimistic update)
  ---------------------------------------- */
  const toggleWatchlist = useCallback(
    async (symbol: string) => {
      const token = await getToken();
      if (!token) return;

      const exists = watchlist.includes(symbol);

      // optimistic update
      setWatchlist((prev) =>
        exists ? prev.filter((s) => s !== symbol) : [...prev, symbol]
      );

      const url = `${BACKEND_URL}/api/v1/watchlist/${exists ? "remove" : "add"}`;
      const method = exists ? "DELETE" : "POST";

      const { ok } = await apiFetch(url, token, {
        method,
        body: JSON.stringify({ symbol }),
      });

      if (!ok) {
        // rollback on failure
        setWatchlist((prev) =>
          exists ? [...prev, symbol] : prev.filter((s) => s !== symbol)
        );
        toast.error("Failed to update watchlist");
      }
    },
    [watchlist, BACKEND_URL, getToken]
  );

  /* ----------------------------------------
     Step 2: Main Refresh — only after sessionReady is true
     - loads profile, holdings and realized PnL in parallel
  ---------------------------------------- */
  const refresh = useCallback(async () => {
    if (!sessionReady) return;

    const token = await getToken();
    if (!token) {
      // logged out → reset state (do not leave 'loading' true)
      setState({
        profile: null,
        holdings: [],
        loading: false,
        realizedToday: 0,
        dayPnl: 0,
      });
      setWatchlist([]);
      return;
    }

    // show loading while fetching
    setState((s) => ({ ...s, loading: true }));

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
        holdings: holdingsRes.json.holdings ?? [],
        realizedToday: realizedRes.json.realizedToday ?? 0,
        loading: false,
        dayPnl: 0,
      });
    } catch (err) {
      // on network / parsing errors, don't leave UI in permanent loading
      console.error("refresh error:", err);
      setState((s) => ({ ...s, loading: false }));
    } finally {
      // fetch watchlist after main refresh (non-blocking)
      fetchWatchlist();
    }
  }, [sessionReady, BACKEND_URL, fetchWatchlist, getToken]);

  /* ----------------------------------------
     Step 3: Socket portfolio:update
     - attach listener only when sessionReady
     - TS-safe no-op cleanup when not ready
  ---------------------------------------- */
  const handlePortfolioUpdate = useCallback((payload: PortfolioUpdatePayload) => {
    setState((prev) => {
      const newProfile = prev.profile
        ? { ...prev.profile, balance: payload.balance ?? prev.profile.balance }
        : null;

      return {
        ...prev,
        profile: newProfile,
        holdings: payload.holdings ?? prev.holdings,
      };
    });
  }, []);

  useEffect(() => {
    if (!sessionReady) return () => {};

    const listener = (payload: PortfolioUpdatePayload) => handlePortfolioUpdate(payload);

    socket.on("portfolio:update", listener);
    return () => {
      socket.off("portfolio:update", listener);
    };
  }, [sessionReady, handlePortfolioUpdate]);

  /* ----------------------------------------
     Step 4: Socket connect → refresh
     - When socket reconnects, refresh state (only if sessionReady)
  ---------------------------------------- */
  const handleConnect = useCallback(() => {
    if (sessionReady) refresh();
  }, [sessionReady, refresh]);

  useEffect(() => {
    if (!sessionReady) return () => {};

    const listener = () => handleConnect();
    socket.on("connect", listener);

    return () => {
      socket.off("connect", listener);
    };
  }, [sessionReady, handleConnect]);

  /* ----------------------------------------
     Step 5: Initial Load + Auth Change
     - run refresh after sessionReady is true
     - subscribe to auth changes and refresh accordingly
     - unsubscribe defensively (supports different supabase return shapes)
  ---------------------------------------- */
  useEffect(() => {
    if (sessionReady) refresh();

    const sub = supabase.auth.onAuthStateChange(() => {
      // when auth changes (login/logout), re-run refresh
      refresh();
    });

    return () => {
      try {
        // supabase v2: sub.data.subscription.unsubscribe()
        // older shapes: if sub is a function, call it
        // we handle both shapes defensively
        // @ts-ignore
        if (sub?.data?.subscription?.unsubscribe) sub.data.subscription.unsubscribe();
        // @ts-ignore
        else if (typeof sub === "function") sub();
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, [sessionReady, refresh]);

  /* ----------------------------------------
     Trading helpers (buy/sell)
     - uses the same apiFetch helper
  ---------------------------------------- */
  const tradeStock = useCallback(
    async (symbol: string, price: number, action: "buy" | "sell") => {
      const token = await getToken();
      if (!token) {
        toast.error("Please log in to trade");
        return false;
      }

      setTradingSymbol(symbol);

      try {
        const url = `${BACKEND_URL}/api/v1/trade/${action}`;
        const { ok, json } = await apiFetch<TradeError>(url, token, {
          method: "POST",
          body: JSON.stringify({ symbol, price, quantity: 1 }),
        });

        if (!ok) {
          toast.error(json.message ?? "Trade failed");
          return false;
        }

        // small delay to allow backend to persist then refresh
        setTimeout(() => refresh(), 220);

        toast.success(action === "buy" ? "Bought" : "Sold");

        return true;
      } catch (err) {
        console.error("tradeStock error:", err);
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
  if (!ctx) throw new Error("useApp must be inside <AppProvider>");
  return ctx;
};
