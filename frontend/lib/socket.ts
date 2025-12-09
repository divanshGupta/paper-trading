// src/utils/socket.ts
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "";

// Persist instance across module re-evaluations
let socketInstance: Socket | null = null;

function createSocket(): Socket | null {
  if (typeof window === "undefined") return null;

  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      autoConnect: false, // we'll control connect explicitly from provider
      withCredentials: true,
    });

    // Optional: small debug logs
    socketInstance.on("connect", () => {
      // eslint-disable-next-line no-console
      console.log("⚡ socket connected:", socketInstance?.id);
    });
    socketInstance.on("disconnect", (reason) => {
      // eslint-disable-next-line no-console
      console.log("⚡ socket disconnected:", reason);
    });

    // expose for debugging (dev only)
    // @ts-ignore
    if (typeof window !== "undefined") window.__SOCKET__ = socketInstance;
  }

  return socketInstance;
}

// Export a non-null asserted socket for client usage.
// The provider / hooks are client-only, so this cast is safe.
export const socket: Socket = createSocket() as Socket;

// Also export factory in case someone prefers lazy init
export const getSocket = () => createSocket() as Socket;
