"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import type { AppState } from "@/types";

const AppContext = createContext<{
  state: AppState;
  refresh: () => Promise<void>;
}>({
  state: {
    profile: null,
    holdings: [],
    dayPnl: 0,
    realizedToday: 0,
    loading: true,
  },
  refresh: async () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    profile: null,
    holdings: [],
    dayPnl: 0,
    realizedToday: 0,
    loading: true,
  });

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
      return;
    }

    try {
      // Fetch profile, holdings, and realizedToday
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

      setState((prev) => ({
        ...prev,
        profile: profileData.user ?? null,
        holdings: holdingsData.holdings ?? [],
        realizedToday: realizedData.realizedToday ?? 0,
        loading: false,
      }));
    } catch (err) {
      console.error("AppProvider fetch error:", err);

      setState((s) => ({ ...s, loading: false }));
    }
  };

  useEffect(() => {
    fetchAll();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchAll();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AppContext.Provider value={{ state, refresh: fetchAll }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
