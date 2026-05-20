//frontend/components/providers/SocketProvider.tsx
"use client";

import { useEffect, useRef, ReactNode } from "react";
import { socket } from "@/lib/socket";
import { supabase } from "@/utils/supabaseClient";

export default function SocketProvider({ children }: { children: ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

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

      socket.on("connect", () => {
        console.log("🟢 socket connected:", socket.id);
      });

      socket.on("disconnect", (reason: string) => {
        console.log("🔴 socket disconnected:", reason);
      });

      socket.on("connect_error", (err) => {
        console.log("⚠️ socket connect_error:", err.message);
      });
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
      authSub.subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
