// ---------------------------------------------------------
// GLOBAL TYPES — Trading Simulator (Next.js + Socket + Node)
// /types/index.ts
// ---------------------------------------------------------

/* -------------------------------------
   Basic Utility Types
------------------------------------- */

export type FlashState = {
  [symbol: string]: "up" | "down" | null;
};

/* -------------------------------------
   User & Auth
------------------------------------- */

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  address: string | null;
  fatherName: string | null;
  balance: number;
};

/* -------------------------------------
   Holdings / Portfolio
------------------------------------- */

export type Holding = {
  id: number;
  symbol: string;
  quantity: number;
  avgPrice: number;
};

export type Position = {
  id: number;
  symbol: string;
  quantity: number;
  pnl: number;
};

/* -------------------------------------
   Live Price Engine Types
------------------------------------- */

export type Candle = {
  tStart: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type PricePoint = {
  time: number;
  value: number;
};

/**  
 * EXTENDED PRICE TYPE — used everywhere in frontend:
 * - Dashboard
 * - Stocks page
 * - Sorting
 * - Filters
 */
export type Price = {
  symbol: string;
  name?: string;

  // live price data
  price: number;
  previousClose: number;
  todayOpen?: number;

  // intraday OHLC and volumes
  high?: number;
  low?: number;
  volume?: number;
  intraday?: Candle[];

  // optional sparkline support
  sparkline?: PricePoint[];

  // new fields for filters & sorting
  sector?: string;
  marketCap?: number; // in crores
  pe?: number;        // P/E ratio
};

/* -------------------------------------
   API Response Types
------------------------------------- */

export interface RealizedRow {
  symbol: string;
  avgBuy: number;
  avgSell: number;
  buyQty: number;
  sellQty: number;
  realizedPnL: number;
  pnlPercent: number;
}

export interface RealizedPnLResponse {
  realizedPnL: RealizedRow[];
  realizedTotal: number;
}

export interface RealizedTodayResponse {
  realizedToday: number;
}

export type DayPnlResponse = {
  realizedToday: number;
  unrealizedPnL: number;
  dayPnL: number;
};

/* -------------------------------------
   App Global State (AppProvider)
------------------------------------- */

export interface AppState {
  profile: UserProfile | null;
  holdings: Holding[];
  realizedToday: number;
  dayPnl?: number;
  loading: boolean;
}

/* -------------------------------------
   Trading Actions (BUY / SELL)
------------------------------------- */

export type TradeAction = "buy" | "sell";

/* -------------------------------------
   Components: StockList / Table / Cards
------------------------------------- */

export type EnrichedPrice = Price & {
  change: number;
  changePercent: number;
  flash: "up" | "down" | null;


  // holding fields
  holdingQty: number;
  avgPrice: number;
  invested: number;
  liveValue: number;
  unrealized: number;
};

export type StocksListProps = {
  // prices: Price[];
  prices: EnrichedPrice[]; // now enriched
  flash: FlashState;
  bySymbol?: (sym: string) => Price | null;
  holdings?: Holding[];
  marketOpen: boolean;
  tradingSymbol: string | null;

  // callbacks
  onBuy: (symbol: string, price: number) => void;
  onSell: (symbol: string, price: number) => void;

  // hide buy/sell on /stocks page
  disableActions?: boolean;
};

/* -------------------------------------
   Stock Filters / Sorting
------------------------------------- */

// -------------------------------------
// Filters + Sorting Types
// -------------------------------------

export type SectorFilter =
  | "All"
  | "IT"
  | "Banking"
  | "Auto"
  | "FMCG"
  | "Energy"
  | "Telecom"
  | "Pharma";

export type SortKey = "symbol" | "price" | "change" | "marketCap" | "pe";

export interface StockFiltersProps {
  selected: SectorFilter;
  onSelect: (sector: SectorFilter) => void;
}

export interface StockSorterProps {
  sortKey: SortKey;
  onChange: (value: SortKey) => void;
}

/* -------------------------------------
   Stock Card Props
------------------------------------- */

export type StockCardProps = {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  flash: "up" | "down" | null;
  sparkline?: PricePoint[];
};

// Search types
export type SearchQuery = string;

// Orders Filter 
export type OrdersFilter = {
  setPage: (value: number) => void;
  setFilter: (value: string) => void;
  filter: number;
}
