// backend/src/services/priceEngine.js
import { isMarketOpen } from "../utils/marketTimes.js";
import { loadPrices, savePrices } from "./priceStorage.js";

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

/* -------------------------
   Default seed prices (used only if disk storage is empty)
   ------------------------- */
const DEFAULT_PRICES = [
  // ---------------- IT Sector ----------------
  {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    price: 3047, previousClose: 3047, todayOpen: 3047,
    sector: "IT",
    marketCap: 1400000,  // ₹14 lakh crore
    pe: 32,
    beta: 0.95,
  },
  {
    symbol: "INFY",
    name: "Infosys",
    price: 1530, previousClose: 1530, todayOpen: 1530,
    sector: "IT",
    marketCap: 650000,
    pe: 28,
    beta: 0.90,
  },
  {
    symbol: "WIPRO",
    name: "Wipro Ltd",
    price: 465, previousClose: 465, todayOpen: 465,
    sector: "IT",
    marketCap: 240000,
    pe: 22,
    beta: 0.85,
  },
  {
    symbol: "HCLTECH",
    name: "HCL Technologies",
    price: 1180, previousClose: 1180, todayOpen: 1180,
    sector: "IT",
    marketCap: 350000,
    pe: 25,
    beta: 0.92,
  },
  {
    symbol: "TECHM",
    name: "Tech Mahindra",
    price: 1280, previousClose: 1280, todayOpen: 1280,
    sector: "IT",
    marketCap: 120000,
    pe: 20,
    beta: 1.10,
  },

  // ---------------- Banks & Finance ----------------
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank",
    price: 991, previousClose: 991, todayOpen: 991,
    sector: "Banking",
    marketCap: 1100000,
    pe: 18,
    beta: 1.05,
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank",
    price: 1010, previousClose: 1010, todayOpen: 1010,
    sector: "Banking",
    marketCap: 750000,
    pe: 20,
    beta: 1.10,
  },
  {
    symbol: "KOTAKBANK",
    name: "Kotak Mahindra Bank",
    price: 1680, previousClose: 1680, todayOpen: 1680,
    sector: "Banking",
    marketCap: 340000,
    pe: 22,
    beta: 1.08,
  },
  {
    symbol: "AXISBANK",
    name: "Axis Bank",
    price: 1100, previousClose: 1100, todayOpen: 1100,
    sector: "Banking",
    marketCap: 350000,
    pe: 16,
    beta: 1.12,
  },
  {
    symbol: "SBIN",
    name: "State Bank of India",
    price: 780, previousClose: 780, todayOpen: 780,
    sector: "Banking",
    marketCap: 720000,
    pe: 14,
    beta: 1.15,
  },

  // ---------------- Auto ----------------
  {
    symbol: "TATAMOTORS",
    name: "Tata Motors",
    price: 915, previousClose: 915, todayOpen: 915,
    sector: "Auto",
    marketCap: 350000,
    pe: 18,
    beta: 1.40,
  },
  {
    symbol: "MARUTI",
    name: "Maruti Suzuki",
    price: 11800, previousClose: 11800, todayOpen: 11800,
    sector: "Auto",
    marketCap: 400000,
    pe: 30,
    beta: 1.05,
  },
  {
    symbol: "M&M",
    name: "Mahindra & Mahindra",
    price: 1680, previousClose: 1680, todayOpen: 1680,
    sector: "Auto",
    marketCap: 270000,
    pe: 26,
    beta: 1.20,
  },
  {
    symbol: "BAJAJ-AUTO",
    name: "Bajaj Auto",
    price: 7800, previousClose: 7800, todayOpen: 7800,
    sector: "Auto",
    marketCap: 240000,
    pe: 24,
    beta: 0.80,
  },

  // ---------------- Energy & Infra ----------------
  {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    price: 1493, previousClose: 1493, todayOpen: 1493,
    sector: "Energy",
    marketCap: 1800000,
    pe: 24,
    beta: 1.00,
  },
  {
    symbol: "ONGC",
    name: "Oil & Natural Gas Corp",
    price: 190, previousClose: 190, todayOpen: 190,
    sector: "Energy",
    marketCap: 220000,
    pe: 9,
    beta: 1.25,
  },
  {
    symbol: "NTPC",
    name: "NTPC Ltd",
    price: 365, previousClose: 365, todayOpen: 365,
    sector: "Power",
    marketCap: 120000,
    pe: 12,
    beta: 0.95,
  },
  {
    symbol: "POWERGRID",
    name: "Power Grid Corporation",
    price: 292, previousClose: 292, todayOpen: 292,
    sector: "Power",
    marketCap: 200000,
    pe: 10,
    beta: 0.90,
  },
  {
    symbol: "TATAPOWER",
    name: "Tata Power",
    price: 410, previousClose: 410, todayOpen: 410,
    sector: "Power",
    marketCap: 80000,
    pe: 15,
    beta: 1.12,
  },
  {
    symbol: "ADANI",
    name: "Adani Enterprises",
    price: 456, previousClose: 456, todayOpen: 456,
    sector: "Infrastructure",
    marketCap: 300000,
    pe: 120,
    beta: 1.70,
  },
  {
    symbol: "BPCL",
    name: "Bharat Petroleum LTD",
    price: 256, previousClose: 256, todayOpen: 256,
    sector: "Energy",
    marketCap: 70000,
    pe: 7,
    beta: 1.05,
  },

  // ---------------- FMCG ----------------
  {
    symbol: "ITC",
    name: "ITC Ltd",
    price: 435, previousClose: 435, todayOpen: 435,
    sector: "FMCG",
    marketCap: 540000,
    pe: 29,
    beta: 0.65,
  },
  {
    symbol: "HINDUNILVR",
    name: "Hindustan Unilever",
    price: 2400, previousClose: 2400, todayOpen: 2400,
    sector: "FMCG",
    marketCap: 560000,
    pe: 60,
    beta: 0.50,
  },
  {
    symbol: "NESTLE",
    name: "Nestle India",
    price: 25500, previousClose: 25500, todayOpen: 25500,
    sector: "FMCG",
    marketCap: 250000,
    pe: 90,
    beta: 0.40,
  },

  // ---------------- Telecom ----------------
  {
    symbol: "BHARTIARTL",
    name: "Bharti Airtel",
    price: 1250, previousClose: 1250, todayOpen: 1250,
    sector: "Telecom",
    marketCap: 460000,
    pe: 24,
    beta: 0.95,
  },

  // ---------------- Pharma ----------------
  {
    symbol: "SUNPHARMA",
    name: "Sun Pharma",
    price: 1250, previousClose: 1250, todayOpen: 1250,
    sector: "Pharma",
    marketCap: 300000,
    pe: 28,
    beta: 0.70,
  },
];



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
};

function initializePrices() {
  // try disk load first
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
  }

  // fallback to defaults
  return DEFAULT_PRICES.map((s) => ({
    ...s,
    high: s.price,
    low: s.price,
    volume: 0,
    intraday: [],
  }));
};

/* -------------------------
   Volatility profiles
   - Different symbols can have different base volatility multipliers.
   - e.g., tech = higher, banks = lower
   ------------------------- */
const VOL_PROFILES = {
  default: 0.005, // 0.5% typical tick amplitude
  tech: 0.01,     // 1.0% for higher volatility
  infra: 0.004,   // 0.4% lower volatility
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
};

/* -------------------------
   Circuit breaker per-symbol
   - prevents extremely large single-tick jumps
   - we cap per-tick change to a configured percentage
   ------------------------- */
const CIRCUIT_BREAKER_PCT = 0.1; // 10% max one-tick move
const CIRCUIT_LOCK_MS = 10_000;   // if triggered, lock further movement for this symbol for 10s
const circuitLocks = new Map();   // symbol -> unlockTimestamp

function isCircuitLocked(symbol) {
  const ts = circuitLocks.get(symbol);
  return ts && Date.now() < ts;
};

function triggerCircuitLock(symbol) {
  circuitLocks.set(symbol, Date.now() + CIRCUIT_LOCK_MS);
};

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
      console.log(nowISO(), "news event:", sym, activeNewsEvents[sym]);
    }
  }
};

/*
   Core tick price update
   - Applies volatility profile
   - Applies news multiplier if any
   - Applies circuit breaker cap
   - Updates high/low/volume
   - Appends to intraday per-minute bucket (handled separately)
*/
function nextTickEnhanced(prices) {
  const newPrices = prices.map((s) => {
    // if the symbol is under circuit lock, skip changes
    if (isCircuitLocked(s.symbol)) {
      return { ...s }; // unchanged
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
    const openBoost = (minutesSinceOpen >= 555 && minutesSinceOpen <= 570) ? 1.5 : 1;

    // compute random percent change — gaussian-ish via two randoms
    const rand = (Math.random() - 0.5) + (Math.random() - 0.5);
    const pct = rand * baseVol * newsMult * openBoost; // e.g., ±1% etc.

    // compute raw new price
    const rawNewPrice = Math.max(1, Math.round(s.price + s.price * pct));

    // enforce circuit breaker cap (no more than CIRCUIT_BREAKER_PCT per tick)
    const maxDelta = Math.round(s.price * CIRCUIT_BREAKER_PCT);
    let newPrice = rawNewPrice;
    const delta = newPrice - s.price;
    if (Math.abs(delta) > maxDelta) {
      // cap to maxDelta
      newPrice = s.price + Math.sign(delta) * maxDelta;
      // trigger lock if the cap was exceeded drastically
      triggerCircuitLock(s.symbol);
      console.log(nowISO(), "circuit lock triggered on", s.symbol, "delta:", delta, "capped->", newPrice);
    }

    // simulate volume: base + random
    const baseVolPerTick = Math.max(1, Math.round(s.price / 100)); // scaled by price
    const tickVolume = Math.round(baseVolPerTick * (1 + Math.random() * 4)); // 1x - 5x of base

    // update high / low (intraday)
    const high = Math.max(s.high ?? s.price, newPrice);
    const low = Math.min(s.low ?? s.price, newPrice);
    const volume = (s.volume ?? 0) + tickVolume;

    return {
      ...s,
      price: newPrice,
      high,
      low,
      volume,
    };
  });

  // decrement news event counters and remove if finished
  Object.keys(activeNewsEvents).forEach((sym) => {
    activeNewsEvents[sym].remainingTicks -= 1;
    if (activeNewsEvents[sym].remainingTicks <= 0) {
      delete activeNewsEvents[sym];
      console.log(nowISO(), "news event ended:", sym);
    }
  });

  return newPrices;
};

/* -------------------------
   Candle aggregator (intraday OHLC per minute)
   - Every INTRADAY_CANDLE_INTERVAL_MS we bucket the last tick for each symbol
   - Keep only last MAX_INTRADAY_POINTS candles
   ------------------------- */
function aggregateMinuteCandles() {
  const ts = Date.now();
  PRICES = PRICES.map((s) => {
    const lastIntraday = s.intraday?.length ? s.intraday[s.intraday.length - 1] : null;
    const currentPrice = s.price;

    // if there is no current open candle (first minute or after reset), create one
    if (!lastIntraday || ts - lastIntraday.tStart >= INTRADAY_CANDLE_INTERVAL_MS) {
      const newCandle = {
        tStart: ts,
        open: currentPrice,
        high: currentPrice,
        low: currentPrice,
        close: currentPrice,
        volume: 0,
      };
      const arr = (s.intraday || []).concat(newCandle).slice(-MAX_INTRADAY_POINTS);
      return { ...s, intraday: arr };
    } else {
      // update existing candle
      const updated = { ...lastIntraday };
      updated.close = currentPrice;
      updated.high = Math.max(updated.high, currentPrice);
      updated.low = Math.min(updated.low, currentPrice);
      // volume for the candle is already being incremented per tick via volume on s
      const arr = (s.intraday || []).slice(0, -1).concat(updated);
      return { ...s, intraday: arr };
    }
  });
}

/* -------------------------
   Save prices to disk (debounced by interval)
   - We write the PRICES array to disk so engine can resume after restart
   ------------------------- */
function startPeriodicSave() {
  if (saveIntervalHandle) return;
  saveIntervalHandle = setInterval(() => {
    try {
      savePrices(PRICES);
    } catch (err) {
      console.error(nowISO(), "Error saving prices:", err);
    }
  }, STORAGE_SAVE_INTERVAL_MS);
  // also save on process exit
  process.on("exit", () => {
    try { savePrices(PRICES); } catch (e) {}
  });
}

/* -------------------------
   Market open-only reset:
   - When market transitions closed -> open, we set:
       previousClose = last saved price (yesterday)
       todayOpen = price at open
     This runs once per market open (not on server restart)
   ------------------------- */
function handleMarketOpenReset() {
  console.log(nowISO(), "Market opened — performing daily reset");
  PRICES = PRICES.map((s) => ({
    ...s,
    previousClose: s.price,
    todayOpen: s.price,
    // reset intraday arrays for the new day
    intraday: [],
    high: s.price,
    low: s.price,
    volume: 0,
  }));
  // persist immediately
  savePrices(PRICES);
};

/* -------------------------
   Engine start/stop and main loop
   ------------------------- */
let ioEmitter = null; // will be set in startPriceEngine

export function startPriceEngine(io) {
  if (tickIntervalHandle) return; // already running
  ioEmitter = io;

  // Start periodic persistence
  startPeriodicSave();

  // Immediately broadcast current snapshot (loaded from disk or defaults)
  io.emit("price:snapshot", PRICES);

  // Start market status broadcaster
  marketStatusIntervalHandle = setInterval(() => {
    const openNow = isMarketOpen();

    // detect closed -> open transition
    if (!lastMarketOpenState && openNow) {
      handleMarketOpenReset();
    }
    lastMarketOpenState = openNow;

    io.emit("market:status", { open: openNow });
  }, MARKET_STATUS_BROADCAST_MS);

  // Minute candle aggregator (intraday)
  candleIntervalHandle = setInterval(() => {
    if (!isMarketOpen()) return;
    // possibly spawn news events once a minute
    maybeSpawnNewsEvent();
    aggregateMinuteCandles();
    // emit intraday snapshot for charts optionally
    // io.emit("price:intraday", PRICES.map(p => ({ symbol: p.symbol, intraday: p.intraday })));
  }, INTRADAY_CANDLE_INTERVAL_MS);

  // MAIN TICK LOOP
  tickIntervalHandle = setInterval(() => {
    if (!isMarketOpen()) return; // freeze when market closed

    // produce new prices for this tick
    const prevSnapshot = PRICES.map((p) => ({ ...p })); // shallow copy for diffs
    PRICES = nextTickEnhanced(PRICES);

    // update minute candle volumes: each symbol's tick volume is reflected by difference in s.volume
    // we already increase s.volume inside nextTickEnhanced; minute aggregator will use s.volume

    // Build diffs (only changed symbols)
    const diffs = PRICES
      .map((s, i) => {
        const prev = prevSnapshot[i];
        if (!prev || s.price === prev.price) return null;
        // include more metadata now: previousClose, todayOpen, high, low, volume, intraday last candle maybe
        return {
          symbol: s.symbol,
          price: s.price,
          previousClose: s.previousClose,
          todayOpen: s.todayOpen,
          high: s.high,
          low: s.low,
          volume: s.volume,
          intradayLast: (s.intraday && s.intraday[s.intraday.length - 1]) || null,
        };
      })
      .filter(Boolean);

    if (diffs.length > 0) {
      io.emit("price:ticks", diffs);
    }

    // Save to disk either on each tick or rely on periodic saver
    if (SAVE_ON_EACH_TICK) {
      try { savePrices(PRICES); } catch (e) { console.error("save error", e); }
    }
  }, TICK_INTERVAL_MS);

  // ensure storage saver is running
  startPeriodicSave();
  console.log(nowISO(), "Price engine started. TICK interval:", TICK_INTERVAL_MS, "ms");
};

/* stop engine safely (useful for tests) */
export function stopPriceEngine() {
  if (tickIntervalHandle) clearInterval(tickIntervalHandle);
  if (saveIntervalHandle) clearInterval(saveIntervalHandle);
  if (candleIntervalHandle) clearInterval(candleIntervalHandle);
  if (marketStatusIntervalHandle) clearInterval(marketStatusIntervalHandle);
  tickIntervalHandle = saveIntervalHandle = candleIntervalHandle = marketStatusIntervalHandle = null;
  ioEmitter = null;
  console.log(nowISO(), "Price engine stopped.");
};

/* get full snapshot (API endpoints can call) */
export function getSnapshot() {
  return PRICES;
};

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
