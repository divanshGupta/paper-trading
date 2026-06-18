// backend/src/controllers/candleController.js
// Add this to your existing candleController.js file

import { RSI } from "technicalindicators";
import { getCandles } from "../services/candleService.js";

const VALID_INTERVALS = ["1min", "5min", "15min", "1hour", "1day"];

const INTERVAL_LIMITS = {
  "1min": 375,
  "5min": 375,
  "15min": 480,
  "1hour": 720,
  "1day": 365,
};

const DEFAULT_RSI_PERIOD = 14;

/**
 * GET /api/v1/candles/:symbol/rsi?interval=1min&period=14
 *
 * RSI needs `period` closes to produce its first value, so the
 * returned array is shorter than the candle count by `period`.
 * We align each RSI value to its corresponding candle's tStart
 * so the frontend can plot it on the same time axis as the chart.
 */
export const getRSI = async (req, res) => {
  try {
    const { symbol } = req.params;
    const interval = req.query.interval ?? "1min";
    const period = parseInt(req.query.period, 10) || DEFAULT_RSI_PERIOD;

    if (!VALID_INTERVALS.includes(interval)) {
      return res.status(400).json({
        message: `Invalid interval. Use: ${VALID_INTERVALS.join(", ")}`,
      });
    }

    if (period < 2 || period > 100) {
      return res.status(400).json({
        message: "Period must be between 2 and 100",
      });
    }

    const limit = INTERVAL_LIMITS[interval];
    const candles = await getCandles(symbol.toUpperCase(), interval, limit);

    // Not enough data to compute even one RSI value
    if (candles.length <= period) {
      return res.status(200).json({
        symbol: symbol.toUpperCase(),
        interval,
        period,
        rsi: [],
        message: `Need more than ${period} candles to compute RSI (have ${candles.length})`,
      });
    }

    const closes = candles.map((c) => c.close);
    const rsiValues = RSI.calculate({ period, values: closes });

    // RSI output is offset by `period` relative to the input candles.
    // rsiValues[0] corresponds to candles[period], rsiValues[1] to candles[period + 1], etc.
    const rsi = rsiValues.map((value, i) => ({
      time: candles[i + period].tStart,
      value: Number(value.toFixed(2)),
    }));

    return res.status(200).json({
      symbol: symbol.toUpperCase(),
      interval,
      period,
      rsi,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};