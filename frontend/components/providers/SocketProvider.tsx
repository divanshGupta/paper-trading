"use client";

import { useEffect, useState, ReactNode } from "react";
import { socket } from "@/utils/socket";
import { supabase } from "@/utils/supabaseClient";

interface SocketConnectError {
  message: string;
  type?: string;
  description?: string;
  data?: unknown;
}

export default function SocketProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let currentToken: string | null = null;

    const connect = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token ?? null;
        if (!token) {
          console.warn("SocketProvider: no token, not connecting");
          return;
        }

        // update token or reconnect if needed
        if (token !== currentToken) {
          currentToken = token;
          socket.auth = { token };
          if (!socket.connected) socket.connect();
        }

        const onConnect = () => {
          console.info("[SocketProvider] connected", socket.id);
          if (mounted) setReady(true);
        };

        const onConnectError = (err: SocketConnectError) => {
          console.warn("[SocketProvider] connect_error:", err.message);
        };

        socket.on("connect", onConnect);
        socket.on("connect_error", onConnectError);

      } catch (err) {
        console.error("SocketProvider.connect error:", err);
      }
    };

    connect();

    // auth listener
    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      const token = session?.access_token ?? null;

      if (!token) {
        socket.disconnect();
        currentToken = null;
        setReady(false);
        return;
      }

      socket.auth = { token };
      if (!socket.connected) socket.connect();
    });

    return () => {
      mounted = false;
      socket.off("connect");
      socket.off("connect_error");

      try {
        authSub.subscription.unsubscribe();
      } catch {}
    };
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
