// server.js
import http from "http";
import { app } from "./app.js";
import { initSocket } from "./config/socket.js";
import logger from "./utils/logger.js";
import { flushAllOpenCandles } from "./services/candleService.js";

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

const PORT = process.env.PORT || 8080;

// Listen
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info("Socket.IO initialized, waiting for first connection...");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", async (err) => {
  console.error(err);

  try {
    await flushAllOpenCandles();
  } catch {}

  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", async (err) => {
  console.error(err);

  try {
    await flushAllOpenCandles();
  } catch {}

  process.exit(1);
});

// Handle termination signals
process.on("SIGTERM", async () => {
  console.log("Flushing candles before shutdown...");

  await flushAllOpenCandles();

  server.close(() => {
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("Flushing candles before shutdown...");

  await flushAllOpenCandles();

  server.close(() => {
    process.exit(0);
  });
});
