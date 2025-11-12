import { startPriceEngine, getSnapshot } from "../services/priceEngine.js";

export function registerStockHandlers(io, socket) {
  // ensure engine is running once globally
  startPriceEngine(io);

  // send latest to this client immediately
  socket.emit("price:snapshot", getSnapshot());

  // (Optional) allow client to ping or resubscribe later
  socket.on("price:resubscribe", () => {
    socket.emit("price:snapshot", getSnapshot());
  });
}
