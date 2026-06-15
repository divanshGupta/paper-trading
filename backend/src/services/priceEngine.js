// backend/src/services/priceEngine.js
import { isMarketOpen } from "../utils/marketTimes.js";
import { loadPrices, savePrices } from "./priceStorage.js";
import logger from "../utils/logger.js";
import { DEFAULT_PRICES } from "../config/stocksData.js";
import { processTick } from "./candleService";

/**
 * Advanced Fake Market Engine
 *
 * Goals:
 *  - Realistic tick simulation with volatility profiles
 *  - Persist prices to disk so server restarts do not reset last prices
 *  - Keep previousClose / todayOpen for day P&L
 *  - Maintain per-symbol intraday OHLC (for sparkline / mini charts)
 *  - Circuit-breaker that prevents insane one-tick jumps
 *  - "News events" that spike volatility occasionally
 *  - Efficient diff-only broadcasting over socket.io
 *
 * Notes:
 *  - This is a DEV-only market engine. When you integrate a real market feed,
 *    you can remove this file and plug the real feed into the same WebSocket endpoints.
 */

/* -------------------------
   Basic config (tweakable)
   ------------------------- */
const STORAGE_SAVE_INTERVAL_MS = 5000; // how often we save PRICES to disk
const TICK_INTERVAL_MS = 2000; // tick frequency when market is open
const MARKET_STATUS_BROADCAST_MS = 60_000; // broadcast market open/close every minute
const INTRADAY_CANDLE_INTERVAL_MS = 60_000; // aggregate OHLC every minute
const MAX_INTRADAY_POINTS = 120; // keep last N per symbol (for sparklines)
const NEWS_EVENT_PROBABILITY = 0.01; // per minute probability of a news event
const NEWS_EVENT_DURATION_TICKS = 6; // number of ticks the news event affects volatility
const SAVE_ON_EACH_TICK = false; // set true for maximum safety; false to save at interval
const MEAN_REVERSION_STRENGTH = 0.02; // how strongly price pulls back to fair value
// In DEFAULT_PRICES, add fairValue to each stock
// This is the "true" price the stock gravitates toward
// e.g. TCS fairValue: 3047 (starting price)

/* -------------------------
   Load persisted prices if present, otherwise seed defaults
   PRICES will be mutated by engine and saved back to disk periodically.
   Each symbol object shape in PRICES:
   {
     symbol, name, price,
     previousClose, todayOpen,
     high, low, volume,
     intraday: [{ tStart, open, high, low, close, volume }, ...]  // per-minute candles
   }
   ------------------------- */
export let PRICES = initializePrices();

/* -------------------------
   Internal engine state
   ------------------------- */
let tickIntervalHandle = null;
let saveIntervalHandle = null;
let candleIntervalHandle = null;
let marketStatusIntervalHandle = null;
let lastMarketOpenState = isMarketOpen();
let activeNewsEvents = {}; // symbol -> { remainingTicks, volatilityMultiplier }
let lastTickTimestamp = Date.now();

/* -------------------------
   Utility helpers
   ------------------------- */
function nowISO() {
  return new Date().toISOString();
}

function initializePrices() {
  // try disk load first
  try {
    const fromDisk = loadPrices?.();
    if (fromDisk && Array.isArray(fromDisk) && fromDisk.length > 0) {
      // ensure shape for older files
      return fromDisk.map((s) => ({
        ...s,
        high: s.high ?? s.price,
        low: s.low ?? s.price,
        volume: s.volume ?? 0,
        intraday: Array.isArray(s.intraday) ? s.intraday : [],
      }));

      // ✅ FIX: If market is already open on startup and todayOpen date
      // doesn't match today, treat current price as the open
      if (isMarketOpen()) {
        const today = new Date().toDateString();
        return loaded.map((s) => {
          const openDate = s.todayOpenDate; // we'll store this (see fix 2)
          if (openDate !== today) {
            return {
              ...s,
              previousClose: s.price,
              todayOpen: s.price,
              todayOpenDate: today,
              intraday: [],
              high: s.price,
              low: s.price,
              volume: 0,
            };
          }
          return s;
        });
      }

      return loaded;
    }
  } catch (err) {
    logger.warn(
      nowISO(),
      "Failed to load prices from disk — falling back to defaults",
      err,
    );
  }

  // fallback to defaults
  return DEFAULT_PRICES.map((s) => ({
    ...s,
    high: s.price,
    low: s.price,
    volume: 0,
    intraday: [],
  }));
}

/* -------------------------
   Volatility profiles
   - Different symbols can have different base volatility multipliers.
   - e.g., tech = higher, banks = lower
   ------------------------- */
const VOL_PROFILES = {
  default: 0.005, // 0.5% typical tick amplitude
  tech: 0.01, // 1.0% for higher volatility
  infra: 0.004, // 0.4% lower volatility
  largecap: 0.003,
};

function profileForSymbol(symbol) {
  // naive grouping — tweak to your taste
  const tech = ["TCS", "INFY"];
  const infra = ["ADANI", "BPCL"];
  const largecap = ["RELIANCE", "HDFCBANK", "MARUTI"];

  if (tech.includes(symbol)) return "tech";
  if (infra.includes(symbol)) return "infra";
  if (largecap.includes(symbol)) return "largecap";
  return "default";
}

/* -------------------------
   Circuit breaker per-symbol
   - prevents extremely large single-tick jumps
   - we cap per-tick change to a configured percentage
   ------------------------- */
const CIRCUIT_BREAKER_PCT = 0.1; // 10% max one-tick move
const CIRCUIT_LOCK_MS = 10_000; // if triggered, lock further movement for this symbol for 10s
const circuitLocks = new Map(); // symbol -> unlockTimestamp

function isCircuitLocked(symbol) {
  const ts = circuitLocks.get(symbol);
  return ts && Date.now() < ts;
}

function triggerCircuitLock(symbol) {
  circuitLocks.set(symbol, Date.now() + CIRCUIT_LOCK_MS);
}

/* -------------------------
   News event simulation
   - occasionally we apply a temporary volatility multiplier to some symbols
   ------------------------- */
function maybeSpawnNewsEvent() {
  if (Math.random() < NEWS_EVENT_PROBABILITY) {
    // pick 1-2 symbols at random
    const symbols = PRICES.map((p) => p.symbol);
    const count = Math.random() < 0.6 ? 1 : 2;
    for (let i = 0; i < count; i++) {
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      // skip if already active
      if (activeNewsEvents[sym]) continue;
      activeNewsEvents[sym] = {
        remainingTicks: NEWS_EVENT_DURATION_TICKS,
        volatilityMultiplier: 2 + Math.random() * 2, // 2x - 4x volatility
      };
      // small console clue
      logger.info(nowISO(), "news event:", sym, activeNewsEvents[sym]);
    }
  }
}

/*
   Core tick price update
   - Applies volatility profile
   - Applies news multiplier if any
   - Applies circuit breaker cap
   - Updates high/low/volume
   - Appends to intraday per-minute bucket (handled separately)
*/
function nextTickEnhanced(prices) {
  // We will mutate a new array referencing same objects where possible
  const out = new Array(prices.length);

  for (let i = 0; i < prices.length; i++) {
    const s = prices[i];

    // if the symbol is under circuit lock, keep unchanged
    if (isCircuitLocked(s.symbol)) {
      out[i] = { ...s };
      continue;
    }

    // base volatility from profile
    const profile = profileForSymbol(s.symbol);
    const baseVol = VOL_PROFILES[profile] ?? VOL_PROFILES.default;

    // news multiplier
    const news = activeNewsEvents[s.symbol];
    const newsMult = news ? news.volatilityMultiplier : 1;

    // short-term time-of-day multiplier (first 15 minutes more volatile)
    const now = new Date();
    const hh = now.getHours();
    const mm = now.getMinutes();
    const minutesSinceOpen = hh * 60 + mm;
    // if market just opened (9:15 - 9:30 IST), boost small volatility
    const openBoost =
      minutesSinceOpen >= 555 && minutesSinceOpen <= 570 ? 1.5 : 1;

    // compute random percent change — gaussian-ish via two randoms
    const rand = Math.random() - 0.5 + (Math.random() - 0.5);
    const pct = rand * baseVol * newsMult * openBoost; // e.g., ±1% etc.

    // compute raw new price
    const rawNewPrice = Math.max(1, Math.round(s.price + s.price * pct));

    // enforce circuit breaker cap (no more than CIRCUIT_BREAKER_PCT per tick)
    const maxDelta = Math.max(1, Math.round(s.price * CIRCUIT_BREAKER_PCT));
    let newPrice = rawNewPrice;
    const delta = newPrice - s.price;
    if (Math.abs(delta) > maxDelta) {
      // cap to maxDelta
      newPrice = s.price + Math.sign(delta) * maxDelta;
      // trigger lock if the cap was exceeded drastically
      triggerCircuitLock(s.symbol);
      logger.info(
        nowISO(),
        "circuit lock triggered on",
        s.symbol,
        "delta:",
        delta,
        "capped->",
        newPrice,
      );
    }

    // simulate volume: base + random
    const baseVolPerTick = Math.max(1, Math.round(s.price / 100)); // scaled by price
    const tickVolume = Math.round(baseVolPerTick * (1 + Math.random() * 4)); // 1x - 5x of base

    // update high / low (intraday)
    const high = Math.max(s.high ?? s.price, newPrice);
    const low = Math.min(s.low ?? s.price, newPrice);
    const volume = (s.volume ?? 0) + tickVolume;

    // create new object for this symbol
    out[i] = {
      ...s,
      price: newPrice,
      high,
      low,
      volume,
    };
  }

  // decrement news event counters and remove if finished
  for (const sym of Object.keys(activeNewsEvents)) {
    activeNewsEvents[sym].remainingTicks -= 1;
    if (activeNewsEvents[sym].remainingTicks <= 0) {
      delete activeNewsEvents[sym];
      logger.info(nowISO(), "news event ended:", sym);
    }
  }

  return out;
}

/* -------------------------
   Candle aggregator (intraday OHLC per minute)
   - Every INTRADAY_CANDLE_INTERVAL_MS we bucket the last tick for each symbol
   - Keep only last MAX_INTRADAY_POINTS candles
   ------------------------- */
function aggregateMinuteCandles() {
  const ts = Date.now();
  PRICES = PRICES.map((s) => {
    const lastIntraday = s.intraday?.length
      ? s.intraday[s.intraday.length - 1]
      : null;
    const currentPrice = s.price;

    // if there is no current open candle (first minute or after reset), create one
    if (
      !lastIntraday ||
      ts - lastIntraday.tStart >= INTRADAY_CANDLE_INTERVAL_MS
    ) {
      const newCandle = {
        tStart: ts,
        open: currentPrice,
        high: currentPrice,
        low: currentPrice,
        close: currentPrice,
        volume: 0,
      };
      const arr = (s.intraday || [])
        .concat(newCandle)
        .slice(-MAX_INTRADAY_POINTS);
      return { ...s, intraday: arr };
    } else {
      // update existing candle
      const updated = { ...lastIntraday };
      updated.close = currentPrice;
      updated.high = Math.max(updated.high, currentPrice);
      updated.low = Math.min(updated.low, currentPrice);
      // volume for the candle is already being incremented per tick via s.volume
      const arr = (s.intraday || []).slice(0, -1).concat(updated);
      return { ...s, intraday: arr };
    }
  });
}

/* -------------------------
   Save prices to disk (debounced by interval)
   - We write the PRICES array to disk so engine can resume after restart
   ------------------------- */
let processExitHandlerRegistered = false;
function startPeriodicSave() {
  if (saveIntervalHandle) return;
  saveIntervalHandle = setInterval(async () => {
    try {
      await Promise.resolve(savePrices(PRICES));
    } catch (err) {
      logger.error(nowISO(), "Error saving prices:", err);
    }
  }, STORAGE_SAVE_INTERVAL_MS);

  // register a single exit handler (guarded)
  if (!processExitHandlerRegistered) {
    const doSaveAndExit = () => {
      try {
        savePrices(PRICES);
      } catch (e) {
        // ignore
      }
    };
    process.once("exit", doSaveAndExit);
    process.once("SIGINT", () => {
      doSaveAndExit();
      process.exit(0);
    });
    process.once("SIGTERM", () => {
      doSaveAndExit();
      process.exit(0);
    });
    processExitHandlerRegistered = true;
  }
}

/* -------------------------
   Market open-only reset:
   - When market transitions closed -> open, we set:
       previousClose = last saved price (yesterday)
       todayOpen = price at open
     This runs once per market open (not on server restart)
   ------------------------- */
function handleMarketOpenReset() {
  logger.info(nowISO(), "Market opened — performing daily reset");
  const today = new Date().toDateString(); // e.g. "sat may 23 2026"
  PRICES = PRICES.map((s) => ({
    ...s,
    previousClose: s.price,
    todayOpen: s.price,
    todayOpenDate: today,
    intraday: [],
    high: s.price,
    low: s.price,
    volume: 0,
  }));
  // persist immediately
  try {
    savePrices(PRICES);
  } catch (e) {
    logger.warn(nowISO(), "Failed to persist prices on market open reset", e);
  }
}

/* -------------------------
   Engine start/stop and main loop
   ------------------------- */
let ioEmitter = null; // will be set in startPriceEngine

export function startPriceEngine(io) {
  // idempotent start: if already started, simply return
  if (tickIntervalHandle) {
    // still ensure ioEmitter is set so other callers can emit through it
    ioEmitter = io || ioEmitter;
    return;
  }

  ioEmitter = io;

  // Start periodic persistence
  startPeriodicSave();

  // Immediately broadcast current snapshot (loaded from disk or defaults)
  try {
    // ❌ Removed initial broadcast — frontend controls when to request snapshots.
    // io.emit("price:snapshot", PRICES);
  } catch (err) {
    logger.warn(nowISO(), "Failed to emit initial snapshot:", err);
  }

  // Start market status broadcaster
  marketStatusIntervalHandle = setInterval(() => {
    const openNow = isMarketOpen();

    // detect closed -> open transition
    if (!lastMarketOpenState && openNow) {
      handleMarketOpenReset();
    }
    lastMarketOpenState = openNow;

    try {
      io.emit("market:status", { open: openNow });
    } catch (err) {
      logger.warn(nowISO(), "Failed to emit market status:", err);
    }
  }, MARKET_STATUS_BROADCAST_MS);

  // Minute candle aggregator (intraday)
  candleIntervalHandle = setInterval(() => {
    if (!isMarketOpen()) return;
    // possibly spawn news events once a minute
    try {
      maybeSpawnNewsEvent();
      aggregateMinuteCandles();
    } catch (err) {
      logger.error(nowISO(), "Error in minute aggregator:", err);
    }
    // optional intraday emitter left commented (can be enabled)
    // try { io.emit("price:intraday", PRICES.map(p => ({ symbol: p.symbol, intraday: p.intraday }))); } catch {}
  }, INTRADAY_CANDLE_INTERVAL_MS);

  // MAIN TICK LOOP
  tickIntervalHandle = setInterval(() => {
    // keep last tick timestamp
    lastTickTimestamp = Date.now();

    if (!isMarketOpen()) return; // freeze when market closed

    try {
      // produce new prices for this tick
      const prevSnapshot = PRICES; // reference to old array
      const newSnapshot = nextTickEnhanced(prevSnapshot);
      PRICES = newSnapshot;

      // Build diffs (only changed symbols)
      const diffs = [];
      const candlePromises = [];

      for (let i = 0; i < PRICES.length; i++) {
        const prev = prevSnapshot[i];
        const cur = PRICES[i];
        if (!prev || cur.price === prev.price) continue;

        diffs.push({
          symbol: cur.symbol,
          price: cur.price,
          previousClose: cur.previousClose,
          todayOpen: cur.todayOpen,
          high: cur.high,
          low: cur.low,
          volume: cur.volume,
          intradayLast:
            (cur.intraday && cur.intraday[cur.intraday.length - 1]) || null,
        });

        // feed every changes price into the candle builder
        // compute per-tick volume delta
        const tickVolumeDelta = cur.volume - (prev.volume ?? 0);
        candlePromises.push(
          processTick(cur.symbol, cur.price, tickVolumeDelta),
        );
      }

      // Fire candle writes without blocking the tick loop
      Promise.allSettled(candlePromises).catch((err) =>
        logger.error(nowISO(), "candleService processTick error:", err),
      );

      if (diffs.length > 0) {
        try {
          io.emit("price:ticks", diffs);
        } catch (err) {
          logger.warn(nowISO(), "Failed to emit price ticks:", err);
        }
      }

      // Save to disk either on each tick or rely on periodic saver
      if (SAVE_ON_EACH_TICK) {
        try {
          savePrices(PRICES);
        } catch (e) {
          logger.error(nowISO(), "Error saving prices on tick:", e);
        }
      }
    } catch (err) {
      logger.error(nowISO(), "Critical error in tick loop:", err);
    }
  }, TICK_INTERVAL_MS);

  // ensure storage saver is running
  startPeriodicSave();
  logger.info(
    nowISO(),
    "Price engine started. TICK interval:",
    TICK_INTERVAL_MS,
    "ms",
  );
}

/* stop engine safely (useful for tests) */
export function stopPriceEngine() {
  if (tickIntervalHandle) {
    clearInterval(tickIntervalHandle);
    tickIntervalHandle = null;
  }
  if (saveIntervalHandle) {
    clearInterval(saveIntervalHandle);
    saveIntervalHandle = null;
  }
  if (candleIntervalHandle) {
    clearInterval(candleIntervalHandle);
    candleIntervalHandle = null;
  }
  if (marketStatusIntervalHandle) {
    clearInterval(marketStatusIntervalHandle);
    marketStatusIntervalHandle = null;
  }
  ioEmitter = null;
  activeNewsEvents = {};
  circuitLocks.clear();
  logger.warn(nowISO(), "Price engine stopped.");
}

/* get full snapshot (API endpoints can call) */
export function getSnapshot() {
  // Return a shallow copy to avoid accidental external mutation of internal array
  return PRICES.map((p) => ({ ...p }));
}

/*

It upgrades your fake market engine to a realistic, dev-friendly simulator with:

persistent prices on disk (survives server restarts)

realistic volatility groups (tech vs banks, etc.)

intraday OHLC aggregation (per-minute candles stored for the day)

per-symbol circuit-breaker (prevents extreme one-tick moves)

occasional "news events" that spike volatility for a few ticks

volume simulation

daily reset performed only when market actually opens (not on server restart)

efficient diff-only WebSocket broadcast (same as before, but with more fields)

safe, well-commented code so you can understand every part

It expects a small helper priceStorage.js in the same folder (we used the same API you were given earlier: loadPrices() & savePrices(prices)).

*/

/*
Quick explanation / TL;DR of the main improvements

Persistence: loadPrices() and savePrices() keep state across restarts. Engine resumes at last known price, not a hardcoded seed.

Volatility profiles: symbols grouped as tech, largecap, etc., with different base vol. This makes movements realistic.

News events: occasional, temporary multipliers that produce spikes (helps test big moves).

Circuit breaker: prevents unrealistic single-tick jumps and temporarily locks very volatile symbols.

Intraday candles: aggregated every minute (open/high/low/close/volume) for sparklines or mini charts.

Daily reset: handleMarketOpenReset() runs only when market actually transitions closed→open (so server restarts won't accidentally reset).

Efficient diff broadcasting: only changed symbols are emitted with rich metadata (previousClose, todayOpen, high, low, volume, intradayLast).

Safe disk writes: periodic save reduces IO; immediate save happens on market open reset. Option to save per tick if needed.
 */
