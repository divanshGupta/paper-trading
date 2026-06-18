// src/config/socket.js
import { Server } from "socket.io";
import { allowedOrigins } from "./corsConfig.js";
import { registerStockHandlers } from "../websocket/stockTicker.js";
import { socketAuth } from "../middlewares/socketAuth.middleware.js";
import {
  socketMessageLimiter,
  socketRateLimiter,
} from "../middlewares/socketRateLimit.middleware.js";
import logger from "../utils/logger.js";

let io = null;

export const initSocket = (server) => {
  logger.info("🧩 Initializing Socket.IO server...");

  io = new Server(server, {
    path: "/socket.io",
    allowEIO3: true, // compatibility for proxies/clients on older EIO
    cors: {
      // Accept empty origin (WS upgrade may not send origin), and allow known origins
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Deny safely — returning false (don't throw)
        return callback(null, false);
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Attach auth middleware
  io.use(socketAuth);

  io.on("connection", (socket) => {
    try {
      // Lightweight per-socket initialization and rate-limiting setup
      // This middleware should not throw for normal reconnects
      socketRateLimiter(socket, (err) => {
        if (err) {
          logger.warn(`Socket blocked: ${err.message}`);
          return socket.disconnect(true);
        }
      });

      const userId = socket.user?.id ?? "anonymous";
      logger.info(`User connected (socket=${socket.id}, user=${userId})`);

      // join user-specific room if we have an id
      if (socket.user?.id) {
        socket.join(socket.user.id);
        logger.info(`User joined room: ${socket.user.id}`);
      }

      // Listen to any event, but only rate-limit *user* events (handled inside limiter)
      socket.onAny((event, ...args) => {
        socketMessageLimiter(socket, event);
      });

      // Register app-specific handlers (market data, orders, etc)
      registerStockHandlers(io, socket);

      socket.on("disconnect", (reason) => {
        logger.warn(`User disconnected: ${userId} (${reason})`);
      });
    } catch (err) {
      logger.error("Socket connection handler error:", err);
      socket.disconnect(true);
    }
  });

  logger.info("Socket.IO initialized, waiting for first connection...");
  return io;
};

export const getIO = () => {
  if (!io) throw new Error("❌ Socket.io not initialized yet.");
  return io;
};

export { io };
