// server.js
import http from 'http';
import { app } from './app.js';
import { initSocket } from './config/socket.js';
import { PORT } from './config/env.js';
import logger from './utils/logger.js';

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Listen
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info("Socket.IO initialized, waiting for first connection...");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("⚠️ Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  process.exit(1);
});

// Handle termination signals
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("🟢 Process terminated!");
  });
});
