import { isMarketOpen } from "../utils/marketTimes.js";

/*
 IN-MEMORY PRICE STORE
 - This acts as our "market data feed"
 - Every stock contains:
  • price          → current LTP
  • previousClose  → yesterday's close / today's reference price
  • todayOpen      → today's open price (first tick at 9:15)
 */
export let PRICES = [
  { symbol: "TCS",      name: "Tata Consultancy Services", price: 3047, previousClose: 3047, todayOpen: 3047 },
  { symbol: "RELIANCE", name: "Reliance Industries",       price: 1493, previousClose: 1493, todayOpen: 1493 },
  { symbol: "INFY",     name: "Infosys",                   price: 1530, previousClose: 1530, todayOpen: 1530 },
  { symbol: "HDFCBANK", name: "HDFC Bank",                 price: 991,  previousClose: 991,  todayOpen: 991 },
  { symbol: "MARUTI",   name: "Maruti Suzuki",             price: 11800,previousClose: 11800,todayOpen: 11800 },
  { symbol: "ADANI",    name: "Adani Enterprises",         price: 456,  previousClose: 456,  todayOpen: 456 },
  { symbol: "BPCL",     name: "Bharat Petroleum LTD",      price: 256,  previousClose: 256,  todayOpen: 256 },
];

/*
SIMPLE PRICE RANDOM WALK
 - Every tick (2 seconds), each stock moves
   up or down by ±0.5%
 - This simulates live market fluctuations.
 */
function nextTick(prices) {
  return prices.map(s => {
    const pct = (Math.random() - 0.5) / 100; // ±0.5%
    const newPrice = Math.max(1, Math.round(s.price + s.price * pct));

    return {
      ...s,
      price: newPrice,    // update current price
      // previousClose & todayOpen stay same until market resets next day
    };
  });
}

/*
 DAILY RESET (OPTIONAL)
 - When the server starts OR a new market day begins:
 *   we set:
 *    • previousClose = opening reference
 *    • todayOpen     = opening price
 - This is important for Day P&L calculations.
 */
function resetDailyCloses() {
  PRICES = PRICES.map(s => ({
    ...s,
    previousClose: s.price,
    todayOpen: s.price,
  }));
}

let intervalHandle = null;

/*
 PRICE ENGINE - MAIN LOOP
 - Emits snapshot on startup
 - Emits price updates every 2sec (if market open)
 - Emits market open/close status every 60sec
 */
export function startPriceEngine(io) {
  if (intervalHandle) return; // ensures engine starts only once

  // Reset "previousClose" when server starts
  resetDailyCloses();

  /*
  1) INITIAL SNAPSHOT
   - Sent only once when a client connects
   - Contains: price, previousClose, todayOpen
   - Frontend uses snapshot to build initial UI
   */
  const emitSnapshot = () => io.emit("price:snapshot", PRICES);
  emitSnapshot();

  /*
   2) MARKET OPEN/CLOSE STATUS BROADCAST
   - Sent every 60 seconds
   - Frontend uses this to enable/disable BUY/SELL

   */
  setInterval(() => {
    io.emit("market:status", { open: isMarketOpen() });
  }, 60000);

  /*
  3) MAIN TICK LOOP (EVERY 2 SECONDS)
  - Runs only when market is open
  - Applies random price movement
  - Computes diff-only updates
  - Emits only price changes for efficiency
   */
  intervalHandle = setInterval(() => {
    if (!isMarketOpen()) return; // freeze prices when market is closed

    const prevSnapshot = PRICES; // old prices
    PRICES = nextTick(PRICES);   // update all prices

    /*
     GENERATE DIFF STREAM
     - Only emit stocks whose price changed
     - Reduces WebSocket load
     - Frontend updates only those components

     */
    const diffs = PRICES
      .filter((s, i) => s.price !== prevSnapshot[i].price)
      .map(s => ({
        symbol: s.symbol,
        price: s.price,
        previousClose: s.previousClose,  // include for Day P&L
        todayOpen: s.todayOpen,          // useful for charts
      }));

    if (diffs.length) {
      io.emit("price:ticks", diffs);
    }
  }, 2000);
}

/**
 4) MANUAL SNAPSHOT FETCHER
 - Some routes or API endpoints call this
 - Returns full price list
 */
export function getSnapshot() {
  return PRICES;
}

// import { isMarketOpen } from "../utils/marketTimes.js";
// // In-memory price store (single source for all users)
// export let PRICES = [
//   { symbol: "TCS",      name: "Tata Consultancy Services", price: 3047, previousClose: 3047, todayOpen: 3047 },
//   { symbol: "RELIANCE", name: "Reliance Industries",       price: 1493, previousClose: 1493, todayOpen: 1493 },
//   { symbol: "INFY",     name: "Infosys",                   price: 1530, previousClose: 1530, todayOpen: 1530 },
//   { symbol: "HDFCBANK", name: "HDFC Bank",                 price: 991,  previousClose: 991,  todayOpen: 991 },
//   { symbol: "MARUTI",   name: "Maruti Suzuki",             price: 11800,previousClose: 11800,todayOpen: 11800 },
//   { symbol: "ADANI",    name: "Adani Enterprises",         price: 456,  previousClose: 456,  todayOpen: 456 },
//   { symbol: "BPCL",     name: "Bharat Petroleum LTD",      price: 256,  previousClose: 256,  todayOpen: 256 },
// ];

// // simple ±0.5% random walk
// function nextTick(prices) {
//   return prices.map(s => {
//     const pct = (Math.random() - 0.5) / 100; // ±0.5%
//     const newPrice = Math.max(1, Math.round(s.price + s.price * pct));
//     return { ...s, price: newPrice };
//   });
// }

// let intervalHandle = null;

// export function startPriceEngine(io) {
//   if (intervalHandle) return; // idempotent

//   // emit initial snapshot to everyone (use a room/broadcast)
//   const emitSnapshot = () => io.emit("price:snapshot", PRICES);
//   emitSnapshot();

//   // ✅ broadcast market open/closed status every 60 seconds
//   setInterval(() => {
//     io.emit("market:status", { open: isMarketOpen() });
//   }, 60000);

//   intervalHandle = setInterval(() => {
//     if (!isMarketOpen()) return; // freeze updates when market closed



//     const prev = PRICES;
//     PRICES = nextTick(PRICES);

//     // compute deltas (only changed symbols)
//     const diffs = PRICES
//       .filter((s, i) => s.price !== prev[i].price)
//       .map(s => ({ 
//         symbol: s.symbol, 
//         price: s.price 
//       }));

//     if (diffs.length) {
//       io.emit("price:ticks", diffs);
//     }
//   }, 2000);
// }

// export function getSnapshot() {
//   return PRICES;
// }
