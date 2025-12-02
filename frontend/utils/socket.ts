// src/utils/socket.ts
import { io, Socket } from "socket.io-client";

const URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5500";

// create socket but DO NOT auto-connect
export const socket: Socket = io(URL, {
  transports: ["websocket"],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelayMax: 5000,
});

// helper for dev debug
if (typeof window !== "undefined") {
  // expose for debugging
  (window as any).__SOCKET__ = socket;
}
