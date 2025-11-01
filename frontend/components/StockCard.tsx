import React from "react";
import { StockData } from "../types"; // <-- Import the same shared type

// Define the component's props interface
interface StockCardProps {
  stock: StockData; // <-- Use the imported type here
}

// Apply the types to the destructured props
export default function StockCard({ stock }: StockCardProps) {
  return (
    <div className="p-4 bg-gray-800 rounded-2xl shadow-md flex flex-col items-center w-52 hover:scale-105 transition-transform">
      <h3 className="text-xl font-bold">{stock.symbol}</h3>
      <p className="text-green-400 text-lg font-mono mt-2">₹{stock.price}</p>
      <span className="text-sm text-gray-400 mt-1">{stock.time}</span>
    </div>
  );
}