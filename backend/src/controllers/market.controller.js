// backend/src/controllers/market.controller.js
import { PRICES, getSnapshot } from "../services/priceEngine.js";
import { savePrices } from "../services/priceStorage.js";

export const resetDailyPrices = async (req, res) => {
  try {
    // Set previousClose to current price for all symbols
    const reset = PRICES.map((s) => ({
      ...s,
      previousClose: s.price,
      todayOpen: s.price,
      high: s.price,
      low: s.price,
      volume: 0,
      intraday: [],
    }));

    // Update in-memory prices
    PRICES.length = 0;
    reset.forEach((s) => PRICES.push(s));

    // Persist to disk
    savePrices(PRICES);

    return res.status(200).json({ message: "Daily reset done", count: PRICES.length });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};