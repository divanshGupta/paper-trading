"use client";
import React, { useEffect, useState } from "react";
import { socket } from "../lib/socket";
import StockCard from "../components/StockCard";
import { StockData } from "../types"; // <-- Import the shared type

// Define the shape of your state object (a dictionary of stocks)
// It maps a string key (like "AAPL") to a StockData object.
type StocksState = Record<string, StockData>;

export default function Home() {
  // Use the StocksState type for useState.
  // This tells TypeScript that 'stocks' is an object
  // where keys are strings and values are StockData.
  const [stocks, setStocks] = useState<StocksState>({});

  useEffect(() => {
    // By typing 'data' as 'StockData', TypeScript will
    // ensure it has 'symbol', 'price', and 'time'.
    const handleStockUpdate = (data: StockData) => {
      setStocks((prev) => ({
        ...prev,
        [data.symbol]: data,
      }));
    };

    socket.on("stock:update", handleStockUpdate);

    // Pass the *exact same function reference* to 'off'
    // to ensure the correct listener is removed.
    return () => {
    socket.off("stock:update", handleStockUpdate);
    }
      
  }, []);

  // TypeScript correctly infers 'stockList' as 'StockData[]'
  // (an array of StockData objects).
  const stockList = Object.values(stocks);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold mb-6">📈 Live Stock Ticker</h1>
      {stockList.length === 0 ? (
        <p className="text-gray-400">Waiting for updates...</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-6">
          {/* 's' is correctly inferred as StockData, which
             matches what StockCard expects. */}
          {stockList.map((s) => (
            <StockCard key={s.symbol} stock={s} />
          ))}
        </div>
      )}
    </main>
  );
}