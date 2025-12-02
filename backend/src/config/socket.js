import { Server } from "socket.io";
import { allowedOrigins } from "./corsConfig.js";
import { registerStockHandlers } from "../websocket/stockTicker.js";
import { socketAuth } from "../middlewares/socketAuth.middleware.js";
import { socketMessageLimiter, socketRateLimiter } from "../middlewares/socketRateLimit.middleware.js";
import logger from "../utils/logger.js";

let io = null;

export const initSocket = (server) => {
  logger.info("🧩 Initializing Socket.IO server...");

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    },
  });

  // AUTH MIDDLEWARE
  io.use(socketAuth);

  io.on("connection", (socket) => {
    // RATE LIMIT DURING CONNECTION
    socketRateLimiter(socket, (err) => {
      if (err) {
        logger.warn(`Socket blocked: ${err.message}`);
        return socket.disconnect(true);
      }
    });

    const userId = socket.user.id;

    logger.info(`User connected (socket=${socket.id}, user=${userId})`);

    // --------------------------
    // ⭐ USER ROOM JOIN (CRITICAL)
    // --------------------------
    socket.join(userId);
    logger.info(`User joined room: ${userId}`);

    // Protect incoming messages
    socket.onAny((event, ...args) => {
      socketMessageLimiter(socket);
    });

    // Register market data handlers
    registerStockHandlers(io, socket);

    socket.on("disconnect", () => {
      logger.warn(`User disconnected: ${userId}`);
    });
  });

  return io;
};

// SAFE EXPORT
export const getIO = () => {
  if (!io) throw new Error("❌ Socket.io not initialized yet.");
  return io;
};

export { io };  // still allow direct import for backwards compatibility
