// src/components/providers/SocketProvider.tsx
"use client";

import { useEffect, useState } from "react";
import { socket } from "@/utils/socket";
import { supabase } from "@/utils/supabaseClient";

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let currentToken: string | null = null;

    const connect = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token ?? null;
        if (!token) {
          console.warn("SocketProvider: no session token, not connecting socket");
          return;
        }

        // if token changed (login), update auth and (re)connect
        if (token !== currentToken) {
          currentToken = token;
          socket.auth = { token };
          if (!socket.connected) socket.connect();
        }

        // wait for connect event
        const onConnect = () => {
          console.info("[SocketProvider] connected", socket.id);
          if (mounted) setReady(true);
        };

        const onConnectError = (err: any) => {
          console.warn("[SocketProvider] connect_error", err?.message ?? err);
        };

        socket.on("connect", onConnect);
        socket.on("connect_error", onConnectError);

      } catch (err) {
        console.error("SocketProvider.connect error", err);
      }
    };

    // initial connect attempt
    connect();

    // subscribe to auth changes and reconnect with new token
    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      const token = session?.access_token ?? null;
      // if user signed out, disconnect
      if (!token) {
        socket.disconnect();
        currentToken = null;
        setReady(false);
        return;
      }
      // otherwise reconnect with new token
      socket.auth = { token };
      if (!socket.connected) socket.connect();
    });

    return () => {
      mounted = false;
      socket.off("connect");
      socket.off("connect_error");
      try { authSub.subscription.unsubscribe(); } catch {}
      // Do NOT forcibly disconnect here on route changes inside SPA,
      // only disconnect on full page unload (let the browser/OS handle).
    };
  }, []);

  // Block rendering until socket is connected (prevents race)
  if (!ready) return null;

  return <>{children}</>;
}
