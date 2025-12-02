// ---------------------------------------------------------
// GLOBAL TYPES — Trading Simulator (Next.js + Socket + Node)
// ---------------------------------------------------------

/* -------------------------------------
   Flash state from websocket feed
------------------------------------- */

export type FlashState = {
  [symbol: string]: "up" | "down" | null;
};

/* -------------------------------------
   AUTH / USER PROFILE
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
   HOLDINGS / PORTFOLIO
------------------------------------- */

export type Holding = {
  id: number;
  symbol: string;
  quantity: number;
  avgPrice: number;
};

/* -------------------------------------
   Live Price Engine — Base Price Type
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

export type Price = {
  symbol: string;
  name?: string;

  // Live market price
  price: number;
  previousClose: number;
  todayOpen?: number;

  // Intraday OHLC
  high?: number;
  low?: number;
  volume?: number;
  intraday?: Candle[];

  // Optional sparkline
  sparkline?: PricePoint[];

  // For filters/sorting
  sector?: string;
  marketCap?: number; // in crores
  pe?: number;
};

/* -------------------------------------
   ENRICHED PRICE (frontend)
------------------------------------- */

export type EnrichedPrice = Price & {
  change: number;
  changePercent: number;

  // portfolio related
  holdingQty: number;
  invested: number;
  liveValue: number;
  unrealized: number;
  isHolding: boolean;

  // real-time UI highlight
  flash: "up" | "down" | null;
};

/* -------------------------------------
   API RESPONSES
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
  dayPnl: number;
};

/* -------------------------------------
   APP GLOBAL STATE
------------------------------------- */

export interface AppState {
  profile: UserProfile | null;
  holdings: Holding[];
  realizedToday: number;
  dayPnl?: number;
  loading: boolean;
}

/* -------------------------------------
   Trading Actions
------------------------------------- */

export type TradeAction = "buy" | "sell";

/* -------------------------------------
   StocksList / Table Props
------------------------------------- */

export type StocksListProps = {
  prices: EnrichedPrice[];
  flash: FlashState;
  bySymbol?: (symbol: string) => Price | null;

  holdings?: Holding[];
  marketOpen: boolean;
  tradingSymbol: string | null;

  onBuy: (symbol: string, price: number) => void;
  onSell: (symbol: string, price: number) => void;

  disableActions?: boolean;

  loading?: boolean; 
};


/* -------------------------------------
   Filters + Sorting
------------------------------------- */

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

/* -------------------------------------
   Stock Components
------------------------------------- */

export type StockCardProps = {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  flash: "up" | "down" | null;
  sparkline?: PricePoint[];
};

/* -------------------------------------
   Orders Page
------------------------------------- */

export type OrdersFilter = {
  setPage: (value: number) => void;
  setFilter: (value: string) => void;
  filter: number;
};
