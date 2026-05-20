import { create } from "zustand";
import { socket } from "@/lib/socket";


// Types

export type StockPrice = {
  symbol: string;
  price: number;
  previousClose: number;
  todayOpen: number;
  high: number;
  low: number;
  volume: number;
};

type MarketState = {
  prices: Record<string, StockPrice>; // { "TCS": { price: 3200, ... } }
  isMarketOpen: boolean;
  isConnected: boolean;
  hasSnapshot: boolean; // true once first snapshot arrives

  // actions
  initializeSocket: () => void;
  cleanup: () => void;
};

// Store

export const useMarketStore = create<MarketState>((set, get) => ({
  prices: {},
  isMarketOpen: false,
  isConnected: false,
  hasSnapshot: false,

  initializeSocket: () => {
    // Don't attach duplicate listeners
    socket.off("price:snapshot");
    socket.off("price:ticks");
    socket.off("market:status");

    // Full snapshot on first connect
    socket.on("price:snapshot", (data: StockPrice[]) => {
      const map: Record<string, StockPrice> = {};
      data.forEach((stock) => {
        map[stock.symbol] = stock;
      });

      set({ prices: map, hasSnapshot: true });
    });

    // Diff-only ticks every 2 seconds
    // Only update symbols that actually changed
    socket.on("price:ticks", (diffs: StockPrice[]) => {
      set((state) => {
        const updated = { ...state.prices };
        diffs.forEach((diff) => {
          updated[diff.symbol] = {
            ...updated[diff.symbol], // keep existing fields
            ...diff,                 // overwrite with new values
          };
        });
        return { prices: updated };
      });
    });

    // Market open/close status
    socket.on("market:status", ({ open }: { open: boolean }) => {
      set({ isMarketOpen: open });
    });

    // Track connection state
    socket.on("connect", () => {
      set({ isConnected: true });
      // Request snapshot on reconnect if we lost it
      if (!get().hasSnapshot) {
        socket.emit("price:subscribe");
      }
    });

    socket.on("disconnect", () => {
      set({ isConnected: false });
    });

    // Request initial snapshot if already connected
    if (socket.connected) {
      set({ isConnected: true });
      socket.emit("price:subscribe");
    }
  },

  cleanup: () => {
    socket.off("price:snapshot");
    socket.off("price:ticks");
    socket.off("market:status");
  },
}));