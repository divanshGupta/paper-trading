// backend/src/services/candleService.js

import { prisma } from "../utils/db";
import { round2 } from "../utils/stockUtils";

// Interval durations in milliseconds
const INTERVALS = {
  "1min": 60 * 1000,
  "5min": 5 * 60 * 1000,
  "15min": 15 * 60 * 1000,
  "1hour": 60 * 60 * 1000,
  "1day": 24 * 60 * 60 * 1000,
};

// In-memory candle buffer — one open candle per symbol per interval
// Structure: { "TCS:1min": { open, high, low, close, volume, tStart } }
const openCandles = {};

/**
 * Called on every price tick from priceEngine
 * Builds candles in memory, flushes to DB when interval ends
 */
export async function processTick(symbol, price, volume) {
  const now = Date.now();

  for (const [interval, duration] of Object.entries(INTERVALS)) {
    const key = `${symbol}:${interval}`;
    const tStart = new Date(Math.floor(now / duration) * duration);
    const tEnd = new Date(tStart.getTime() + duration);

    if (!openCandles[key]) {
      // New candle — open it
      openCandles[key] = {
        symbol,
        interval,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: volume ?? 0,
        tStart,
        tEnd,
      };
    } else {
      const candle = openCandles[key];

      // Check if current tick belongs to new candle
      if (now >= candle.tEnd.getTime()) {
        // Flush closed candle to DB
        await flushCandle(candle);

        // Open new candle
        openCandles[key] = {
          symbol,
          interval,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: volume ?? 0,
          tStart,
          tEnd,
        };
      } else {
        // Update existing candle
        candle.high = Math.max(candle.high, price);
        candle.low = Math.min(candle.low, price);
        candle.close = price;
        candle.volume += volume ?? 0;
      }
    }
  }
}

/**
 * Persist a closed candle to PostgreSQL
 */
async function flushCandle(candle) {
  try {
    await prisma.candle.upsert({
      where: {
        symbol_interval_tStart: {
          symbol: candle.symbol,
          interval: candle.interval,
          tStart: candle.tStart,
        },
      },
      update: {
        high: round2(candle.high),
        low: round2(candle.low),
        close: round2(candle.close),
        volume: candle.volume,
        tEnd: candle.tEnd,
      },
      create: {
        symbol: candle.symbol,
        interval: candle.interval,
        open: round2(candle.open),
        high: round2(candle.high),
        low: round2(candle.low),
        close: round2(candle.close),
        volume: candle.volume,
        tStart: candle.tStart,
        tEnd: candle.tEnd,
      },
    });
  } catch (err) {
    console.error(
      `Failed to flush candle ${candle.symbol}:${candle.interval}`,
      err,
    );
  }
}

/**
 * Get candles for a symbol + interval
 * Returns last N candles sorted ascending (oldest first for charts)
 */
export async function getCandles(symbol, interval, limit = 500) {
  const candles = await prisma.candle.findMany({
    where: { symbol: symbol.toUpperCase(), interval },
    orderBy: { tStart: "desc" },
    take: limit,
  });

  // Reverse so oldest is first (LightweightCharts expects ascending time)
  return candles.reverse();
}

/**
 * Get current open (in-progress) candle for a symbol
 * Frontend uses this to render the live-updating last candle
 */
export function getOpenCandle(symbol, interval) {
  return openCandles[`${symbol}:${interval}`] ?? null;
}
