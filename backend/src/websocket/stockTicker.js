// backend/src/websocket/stockTicker.js
import { startPriceEngine, getSnapshot } from "../services/priceEngine.js";

let engineStarted = false;

export function registerStockHandlers(io, socket) {
  // -------------------------
  // ⭐ Start Engine Once
  // -------------------------
  if (!engineStarted) {
    startPriceEngine(io);
    engineStarted = true;
    console.log("📈 Market price engine started.");
  }

  // -------------------------
  // ⭐ Client-controlled subscription
  // Frontend ALWAYS calls socket.emit("price:subscribe")
  // after attaching listeners — guaranteed no missed snapshot
  // -------------------------
  socket.on("price:subscribe", () => {
    console.log("📡 Sending fresh snapshot to", socket.id);
    socket.emit("price:snapshot", getSnapshot());
  });

  // -------------------------
  // ⭐ Optional re-subscribe (manual refresh)
  // -------------------------
  socket.on("price:resubscribe", () => {
    socket.emit("price:snapshot", getSnapshot());
  });
}

// 1. startPriceEngine runs ONCE globally
// No more:
// Multiple intervals
// Duplicate ticks
// Memory leaks
// Stuttering live price feed

// 2. Snapshot always accurate
// Guaranteed that snapshot is sent ONLY after engine is running.

// 3. Clean separation of concerns
// priceEngine.js produces ticks
// stockTicker.js distributes ticks
// socket.js handles rooms
// Controllers emit portfolio updates