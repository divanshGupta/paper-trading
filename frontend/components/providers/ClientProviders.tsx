"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { useAuthStore } from "@/stores/useAuthStore";
import SocketProvider from "@/components/providers/SocketProvider";
import { PriceFeedProvider } from "@/components/providers/PriceFeedProvider";
import { AppProvider } from "@/components/providers/AppProvider";
import ToastProvider from "@/components/providers/ToastProvider";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <SocketProvider>
        <PriceFeedProvider>
          <AppProvider>
            <ToastProvider />
            {children}
          </AppProvider>
        </PriceFeedProvider>
      </SocketProvider>
    </ThemeProvider>
  );
}