// In-memory price store (single source for all users)
export let PRICES = [
  { symbol: "TCS",       name: "Tata Consultancy Services", price: 3047 },
  { symbol: "RELIANCE",  name: "Reliance Industries",       price: 1493 },
  { symbol: "INFY",      name: "Infosys",                   price: 1530 },
  { symbol: "HDFCBANK",  name: "HDFC Bank",                 price: 991 },
  { symbol: "MARUTI",    name: "Maruti Suzuki",             price: 11800 },
  { symbol: "ADANI",     name: "Adani Enterprises",         price: 456 },
  { symbol: "BPCL",      name: "Bharat Petroleum LTD",      price: 256 },
];

// simple ±0.5% random walk
function nextTick(prices) {
  return prices.map(s => {
    const pct = (Math.random() - 0.5) / 100; // ±0.5%
    const newPrice = Math.max(1, Math.round(s.price + s.price * pct));
    return { ...s, price: newPrice };
  });
}

function isMarketOpen() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const time = hours * 60 + minutes;
  // 9:15 (555) → 15:30 (930)
  return time >= 555 && time <= 930;
}

let intervalHandle = null;

export function startPriceEngine(io) {
  if (intervalHandle) return; // idempotent

  // emit initial snapshot to everyone (use a room/broadcast)
  const emitSnapshot = () => io.emit("price:snapshot", PRICES);
  emitSnapshot();

  // ✅ broadcast market open/closed status every 60 seconds
  setInterval(() => {
    io.emit("market:status", { open: isMarketOpen() });
  }, 60000);

  intervalHandle = setInterval(() => {
    if (!isMarketOpen()) return; // freeze updates when market closed

    const prev = PRICES;
    PRICES = nextTick(PRICES);

    // compute deltas (only changed symbols)
    const diffs = PRICES
      .filter((s, i) => s.price !== prev[i].price)
      .map(s => ({ symbol: s.symbol, price: s.price }));

    if (diffs.length) {
      io.emit("price:ticks", diffs);
    }
  }, 2000);
}

export function getSnapshot() {
  return PRICES;
}
