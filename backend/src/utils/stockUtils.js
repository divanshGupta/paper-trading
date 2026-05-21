import { PRICES } from "../services/priceEngine.js";

/**
 * Helper — find a live stock by symbol (case-insensitive)
 */
export function findLiveStock(symbol) {
  if (!symbol) return null;
  return PRICES.find(
    (s) => s.symbol && s.symbol.toUpperCase() === String(symbol).toUpperCase()
  );
}

/**
 * Round to 2 decimals and return number
 */
export function round2(v) {
  return Math.round(Number(v) * 100) / 100;
}