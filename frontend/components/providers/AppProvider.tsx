"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import type { AppState } from "@/types";

const AppContext = createContext<{
  state: AppState;
  refresh: () => Promise<void>;
  watchlist: string[];
  toggleWatchlist: (symbol: string) => Promise<void>;
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

  const [watchlist, setWatchlist] = useState<string[]>([]);

  // -------------------------
  // Fetch Watchlist Once
  // -------------------------
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

  // -------------------------
  // Toggle Watchlist (Optimistic)
  // -------------------------
  const toggleWatchlist = async (symbol: string) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) return;

    const currentlySaved = watchlist.includes(symbol);

    // 1️⃣ Optimistic UI
    setWatchlist((w) =>
      currentlySaved ? w.filter((s) => s !== symbol) : [...w, symbol]
    );

    // 2️⃣ Backend Sync
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

  // -------------------------
  // Main Fetch (profile, holdings, realized PnL)
  // -------------------------
  const fetchAll = async () => {
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

      // Update main state
      setState({
        profile: profileData.user ?? null,
        holdings: holdingsData.holdings ?? [],
        realizedToday: realizedData.realizedToday ?? 0,
        dayPnl: 0,
        loading: false,
      });

      // Load watchlist AFTER main data
      fetchWatchlist();
    } catch (err) {
      console.error("AppProvider fetch error:", err);
      setState((s) => ({ ...s, loading: false }));
    }
  };

  // -------------------------
  // Mount + Login/Logout Listener
  // -------------------------
  useEffect(() => {
    fetchAll();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchAll();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AppContext.Provider value={{ state, refresh: fetchAll, watchlist, toggleWatchlist }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook
export const useApp = () => useContext(AppContext);
