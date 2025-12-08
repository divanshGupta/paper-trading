// frontend/lib/socket.ts
import { io, Socket } from "socket.io-client";

/**
 * IMPORTANT:
 * - No "use client"
 * - No imports from /app or /components
 * - This file is evaluated ONCE globally
 */
export const socket: Socket = io(
  process.env.NEXT_PUBLIC_SOCKET_URL!,
  {
    autoConnect: false,
    transports: ["websocket"],
  }
);
