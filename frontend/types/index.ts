// This interface defines the "shape" of your stock data.
export interface StockData {
  symbol: string;
  price: number;
  time: string;
}