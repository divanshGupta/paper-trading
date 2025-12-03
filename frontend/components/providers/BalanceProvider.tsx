"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/utils/supabaseClient";

interface BalanceContextValue {
  balance: number | null;
  refreshBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextValue | null>(null);

export function BalanceProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number | null>(null);

  const refreshBalance = async () => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;

    const res = await fetch("http://localhost:5500/api/v1/users/balance", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();
    setBalance(json.balance);
  };

  useEffect(() => {
    refreshBalance();
  }, []);

  return (
    <BalanceContext.Provider value={{ balance, refreshBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}

export const useBalance = () => {
  const ctx = useContext(BalanceContext);
  if (!ctx) {
    throw new Error("useBalance must be used inside <BalanceProvider>");
  }
  return ctx;
};
