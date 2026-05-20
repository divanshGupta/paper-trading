// import { useMarketStore } from "@/stores/useMarketStore";
// import type { StockPrice } from "@/stores/useMarketStore";

// // component subscribe to one symbol only
// // re-render only when that symbol's price changes
// // not when TCS changes while you're looking at INFY

// export function useStockPrice(symbol: string): StockPrice | null {
//     return useMarketStore((state) => state.prices[symbol] ?? null);
// }

// // for market status
// export function useMarketStatus() {
//     return useMarketStore((state) => ({
//         isMarketOpen: state.isMarketOpen,
//         isConnected: state.isConnected,
//         hasSanpshot: state.hasSnapshot,
//     }));
// }

// // for all prices at once (use sparinglyl - re-renders on any tick)
// export function useAllPrices() {
//   return useMarketStore((state) => state.prices);
// }