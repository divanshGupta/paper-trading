import { ReactNode } from "react";

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

export type Order = {
  id: number;
  symbol: string;
  quantity: number;
  type: "buy" | "sell";
};

export type AppState = {
  profile: UserProfile | null;
  holdings: Holding[];
  loading: boolean;
};



export type StockCardProps = {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  movementArrow: (symbol: string) => ReactNode;
  flash: "up" | "down" | null;
};
