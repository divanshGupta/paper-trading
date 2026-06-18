// backend/src/websocket/stockTicker.js
import { startPriceEngine, getSnapshot } from "../services/priceEngine.js";

/**
 * Ensures market engine starts only once
 */
let engineStarted = false;

/**
 * Track which sockets already subscribed to snapshot
 * Prevents duplicate snapshot spam caused by FE re-renders / multiple emits
 */
const subscribedSockets = new Set();

/**
 * Register all stock price socket handlers
 */
export function registerStockHandlers(io, socket) {
  console.log("⚡ Client connected:", socket.id);

  // -----------------------------------------------
  // ⭐ 1. Start Engine Once Globally
  // -----------------------------------------------
  if (!engineStarted) {
    startPriceEngine(io);
    engineStarted = true;
    console.log("📈 Price engine started.");
  }

  // -----------------------------------------------
  // ⭐ 2. Handle Subscription (Prevent Duplicates)
  // -----------------------------------------------
  socket.on("price:subscribe", () => {
    // CASE: Already subscribed → DO NOTHING
    if (subscribedSockets.has(socket.id)) {
      console.log("⏭  Duplicate subscription ignored:", socket.id);
      return;
    }

    // CASE: First time subscription → send snapshot
    subscribedSockets.add(socket.id);

    console.log("📡 Sending snapshot →", socket.id);
    socket.emit("price:snapshot", getSnapshot());
  });

  // -----------------------------------------------
  // ⭐ 3. Manual Re-subscribe (Optional)
  // -----------------------------------------------
  socket.on("price:resubscribe", () => {
    console.log("🔄 Manual resubscribe → snapshot sent to", socket.id);
    socket.emit("price:snapshot", getSnapshot());
  });

  // -----------------------------------------------
  // ⭐ 4. Clean Up When Client Disconnects
  // -----------------------------------------------
  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
    subscribedSockets.delete(socket.id);
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
