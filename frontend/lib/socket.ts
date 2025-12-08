// socket.ts
import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL!;

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  path: "/socket.io",
  autoConnect: true, // allow FE to manage subscription manually
});

// IMPORTANT: prevent duplicate listeners
socket.on("connect", () => {
  console.log("⚡ Connected:", socket.id);
});
