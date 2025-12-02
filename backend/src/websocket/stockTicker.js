// websocket/stockTicker.js
import { startPriceEngine, getSnapshot } from "../services/priceEngine.js";

let engineStarted = false;

export function registerStockHandlers(io, socket) {
  // -------------------------
  // ⭐ START PRICE ENGINE ONCE
  // -------------------------
  if (!engineStarted) {
    startPriceEngine(io);
    engineStarted = true;
    console.log("📈 Market price engine started.");
  }

  // -------------------------
  // ⭐ SEND INITIAL SNAPSHOT
  // -------------------------
  socket.emit("price:snapshot", getSnapshot());

  // -------------------------
  // ⭐ OPTIONAL RESUBSCRIBE
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