"use client";

import { useEffect, useState, ReactNode } from "react";
import { socket } from "@/utils/socket";
import { supabase } from "@/utils/supabaseClient";

interface SocketConnectError {
  message?: string;
}

export default function SocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;

    const initSocket = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? null;

      if (!token) {
        console.log("[SocketProvider] no auth token → socket not connected");
        return;
      }

      // Attach listeners BEFORE connecting
      const onConnect = () => {
        if (!active) return;
        console.log("[SocketProvider] connected:", socket.id);
        setConnected(true);
      };

      const onConnectError = (err: SocketConnectError) => {
        if (!active) return;
        console.warn("[SocketProvider] connect error:", err?.message ?? err);
        setConnected(false);
      };

      const onDisconnect = (reason: string) => {
        if (!active) return;
        console.warn("[SocketProvider] disconnected:", reason);
        setConnected(false);
      };

      socket.on("connect", onConnect);
      socket.on("connect_error", onConnectError);
      socket.on("disconnect", onDisconnect);

      socket.auth = { token };
      if (!socket.connected) socket.connect();
    };

    initSocket();

    /* ------------------------------------------
       React to Supabase auth changes
    ------------------------------------------ */
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const token = session?.access_token ?? null;

        if (!token) {
          socket.disconnect();
          setConnected(false);
          return;
        }

        socket.auth = { token };
        if (!socket.connected) socket.connect();
      }
    );

    return () => {
      active = false;
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");

      try {
        authListener.subscription.unsubscribe();
      } catch {}
    };
  }, []);

  // IMPORTANT: do NOT block rendering
  return <>{children}</>;
}
