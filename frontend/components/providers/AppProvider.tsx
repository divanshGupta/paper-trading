"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import type { AppState, UserProfile, Holding, Position } from "@/types/index";

const AppContext = createContext<{
  state: AppState;
  refresh: () => Promise<void>;
}>({
  state: {
    profile: null,
    holdings: [],
    loading: true,
  },
  refresh: async () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    profile: null,
    holdings: [],
    loading: true,
  });

  const fetchAll = async () => {
    // Start loading
    setState((s) => ({ ...s, loading: true }));

    // 🔥 1. Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    // ❗ Not authenticated → do NOT fetch anything
    if (!token) {
      console.log("No valid session — skipping all API fetches");
      setState({
        profile: null,
        holdings: [],
        loading: false,
      });
      return;
    }

    // 🔥 2. Fetch all in parallel
    try {
      const [profileRes, holdingsRes] = await Promise.all([
        fetch("http://localhost:5500/api/v1/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5500/api/v1/portfolio", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [profileData, holdingsData] = await Promise.all([
        profileRes.json(),
        holdingsRes.json(),
      ]);

      // 🔥 3. Update state
      setState({
        profile: profileData.user,
        holdings: holdingsData.holdings ?? [],
        loading: false,
      });
    } catch (err) {
      console.error("AppProvider fetch error:", err);

      // Fail safe → no data, but app won't crash
      setState((s) => ({ ...s, loading: false }));
    }
  };

  useEffect(() => {
    // First load
    fetchAll();

    // 🔥 4. React to login/logout
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
