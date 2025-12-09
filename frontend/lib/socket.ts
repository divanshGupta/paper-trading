// src/utils/socket.ts
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "";

// Persist instance across module re-evaluations
let socketInstance: Socket | null = null;

declare global {
  interface Window {
    __SOCKET__?: Socket;
  }
}

function createSocket(): Socket | null {
  if (typeof window === "undefined") return null;

  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      autoConnect: false,
      withCredentials: true,
    });

    socketInstance.on("connect", () => {
      console.log("⚡ socket connected:", socketInstance?.id);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("⚡ socket disconnected:", reason);
    });

    // expose for debugging (dev only)
    window.__SOCKET__ = socketInstance;
  }

  return socketInstance;
}

// Export a non-null asserted socket for client usage.
export const socket: Socket = createSocket() as Socket;

// Also export factory in case someone prefers lazy init
export const getSocket = () => createSocket() as Socket;
