import type { Socket } from "socket.io-client";

declare global {
  interface Window {
    socket?: Socket;
  }
}

declare module "*.css";

export {};