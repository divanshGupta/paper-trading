//frontend/components/providers/SocketProvider.tsx
"use client";

import { useEffect, useRef, ReactNode } from "react";
import { socket } from "@/lib/socket";
import { supabase } from "@/utils/supabaseClient";
import { useServerErrorStore } from "@/stores/useServerErrorStore";
import { verifyBackendHealth } from "@/lib/healthCheck";

export default function SocketProvider({ children }: { children: ReactNode }) {
  const initialized = useRef(false);

  const disconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let lastHealthCheck = 0;
    const throttledVerifyHealth = async () => {
      const now = Date.now();
      if (now - lastHealthCheck < 10000) return; // 10s throttle
      lastHealthCheck = now;
      await verifyBackendHealth();
    };

    const handleConnect = () => {
        console.log("🟢 socket connected");
        
        if (disconnectTimeoutRef.current) {
          clearTimeout(disconnectTimeoutRef.current);
        }

        // backend healthy
        useServerErrorStore.getState().setServerError(false);
    }

      const handleDisconnect = () => {

        disconnectTimeoutRef.current = setTimeout(() => {
  
          verifyBackendHealth();
        }, 5000);
    }

      const handleConnectError = (err: Error) => {

        console.log("⚠️ socket connect_error:", err.message);
  
        // Verify if the API is actually down before showing Server Unavailable
        throttledVerifyHealth();
    }

    console.log("🚀 SocketProvider initialized once");

    const setup = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      // ⛔ FIX: Do NOT connect if no token (user not logged in)
      if (!token) {
        console.log("⚠️ No auth session → socket not connecting.");
        return;
      }

      // Attach token & connect
      socket.auth = { token };
      socket.connect();

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", handleConnectError);
    };

    setup();

    // 🔥 AUTH CHANGE HANDLER (fix logout)
    const { data: authSub } = supabase.auth.onAuthStateChange(
      (_evt, session) => {
        const token = session?.access_token ?? null;

        // NO TOKEN → USER LOGGED OUT
        if (!token) {
          console.log("🔌 authStateChange: logged out → closing socket.");
          socket.auth = {};      // remove token
          socket.disconnect();
          return;
        }

        // TOKEN AVAILABLE → USER LOGGED IN / REFRESHED TOKEN
        console.log("🔑 authStateChange: new token detected → reconnecting.");
        socket.auth = { token };

        if (!socket.connected) socket.connect();
      }
    );

    return () => {
      // cleanup 
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
      }

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);

      authSub.subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
