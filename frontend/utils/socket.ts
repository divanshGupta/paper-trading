// src/utils/socket.ts
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";

export const socket: Socket = io(SOCKET_URL, {
  path: "/socket.io",
  transports: ["websocket"],
  autoConnect: false,
  withCredentials: true,
  // keep reconnection defaults; no infinite spam in UI
});

// expose for debugging (dev only)
if (typeof window !== "undefined") {
  // @ts-ignore
  window.socket = socket;
}
