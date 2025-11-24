import React from "react";

// --- 1. Define Types ---

interface Transaction {
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

interface TransactionTableProps {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions}: TransactionTableProps) {
  if (!transactions.length) {
    return (
      <p className="text-center text-gray-500 py-8">
        No transactions found.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg mt-4">
      <table className="min-w-full text-sm text-left text-gray-700">
        <thead className="bg-gray-100 text-gray-900">
          <tr>
            <th className="p-3">Symbol</th>
            <th className="p-3">Type</th>
            <th className="p-3">Quantity</th>
            <th className="p-3">Price</th>
            <th className="p-3">Total</th>
            <th className="p-3">Realized PnL</th>
            <th className="p-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr
              key={t.id}
              className="border-t hover:bg-gray-50 transition-all duration-150"
            >
              <td className="p-3 font-medium">{t.symbol}</td>
              <td
                className={`p-3 font-semibold ${
                  t.type === "BUY" ? "text-green-600" : "text-red-600"
                }`}
              >
                {t.type}
              </td>
              <td className="p-3">{t.quantity}</td>
              <td className="p-3">₹{Number(t.price).toFixed(2)}</td>
              <td className="p-3">₹{Number(t.total).toFixed(2)}</td>
              <td className="p-3">
                {t.realizedPnl !== null
                  ? `₹${Number(t.realizedPnl).toFixed(2)}`
                  : "-"}
              </td>
              <td className="p-3">
                {new Date(t.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
