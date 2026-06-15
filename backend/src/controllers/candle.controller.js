import { getCandles, getOpenCandle } from "../services/candleService";

const VALID_INTERVALS = ["1min", "5min", "15min", "1hour", "1day"];

const INTERVAL_LIMITS = {
  "1min": 375, // 1 full trading day
  "5min": 375, // 1 week
  "15min": 480, // 1 month
  "1hour": 720, // 3 months
  "1day": 365, // 1 year
};

export const getCandleData = async (req, res) => {
  try {
    const { symbol } = req.params;
    const interval = req.query.interval ?? "1min";

    if (!VALID_INTERVALS.includes(interval)) {
      return res.status(400).json({
        message: `Invalid interval. Use: ${VALID_INTERVALS.join(", ")}`,
      });
    }

    const limit = INTERVAL_LIMITS[interval];
    const candles = await getCandles(symbol.toUpperCase(), interval, limit);
    const openCandle = getOpenCandle(symbol.toUpperCase(), interval);

    return res.status(200).json({
      symbol: symbol.toUpperCase(),
      interval,
      candles,
      openCandle, // live candle being built right now
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
