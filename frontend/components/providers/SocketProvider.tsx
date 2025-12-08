// frontend/components/providers/SocketProvider.tsx
"use client";

import { useEffect, useRef, ReactNode } from "react";
import { socket } from "@/lib/socket";
import { supabase } from "@/utils/supabaseClient";

export default function SocketProvider({ children }: { children: ReactNode }) {
  // Prevent multiple initializations
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return; // 🔥 Prevent re-running on navigation
    initialized.current = true;

    console.log("🚀 SocketProvider initialized once");

    const setup = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (token) {
        socket.auth = { token };
      }

      socket.on("connect", () => {
        console.log("🟢 socket connected:", socket.id);
      });

      socket.on("disconnect", (reason) => {
        console.log("🔴 socket disconnected:", reason);
      });

      socket.on("connect_error", (err) => {
        console.log("⚠️ socket connect_error:", err.message);
      });

      socket.connect();
    };

    setup();

    // Supabase auth changes
    const { data: authSub } = supabase.auth.onAuthStateChange(
      (_evt, session) => {
        const token = session?.access_token ?? null;

        if (!token) {
          socket.disconnect();
          return;
        }

        socket.auth = { token };
        if (!socket.connected) socket.connect();
      }
    );

    return () => {
      // NEVER detach socket listeners here (provider persists across app lifecycle)
      authSub.subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
