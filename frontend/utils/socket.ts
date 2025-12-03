// src/utils/socket.ts
import { io, Socket } from "socket.io-client";

const URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5500";

export const socket: Socket = io(URL, {
  transports: ["websocket"],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelayMax: 5000,
});

// expose in browser only (for debugging)
if (typeof window !== "undefined") {
  window.socket = socket; // << fully typed, no "any"
}
