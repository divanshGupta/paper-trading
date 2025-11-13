// This interface defines the "shape" of your stock data.
export interface StockData {
  symbol: string;
  price: number;
  time: string;
}

export interface NavLinkProps {
  href: string; // 'href' will be a string representing the path, e.g., '/home'
  label: string;
}