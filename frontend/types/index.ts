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
  balance: number;
  phone?: string | null;
  dob?: string | null;
  gender?: string | null;
  address?: string | null;
  fatherName?: string | null;
};

/* -------------------------------------
   HOLDINGS / PORTFOLIO
------------------------------------- */

export type Holding = {
  id: number;
  symbol: string;
  quantity: number;
  avgPrice: number;
  livePrice?: number;
  unrealized?: number;
};


export interface EnrichedHolding extends Holding {
  livePrice: number;
  value: number;
  invested: number;
  unrealized: number;
  flash: "up" | "down" | null;
  sector?: string | null;
}

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

export interface PortfolioResponse {
  holdings: Holding[];
}

export interface ProfileResponse {
  user: UserProfile | null;
}

export interface WatchlistResponse {
  watchlist: string[];
}

export interface PortfolioUpdatePayload {
  holdings?: Holding[];
  balance?: number;
}

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
  flash?: FlashState;
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

export type Transaction = {
  id: number | string; 
  symbol: string;
  type: "BUY" | "SELL";
  quantity: number;
  // Use 'string | number' if the source data isn't guaranteed to be a number
  price: number | string; 
  total: number | string; 
  realizedPnl: number | string | null;
  createdAt: string | Date; 
}

// 1. Define a strict type for the possible order filter values
export type OrderFilterValue = "ALL" | "BUY" | "SELL";

// gainer and loser type
export type StockFilterValue = "all" | "gainers" | "losers";

export interface StockFiltersProps {
  selected: SectorFilter;
  onSelect: (value: SectorFilter) => void;
}

export interface StockSorterProps {
  sortKey: SortKey;
  onChange: (value: SortKey) => void;
}

// trade modal type
export type TradeModalProps = {
  mode: "buy" | "sell";
  symbol: string;
  holdingQty?: number;
  balance?: number;
  avgPrice?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

