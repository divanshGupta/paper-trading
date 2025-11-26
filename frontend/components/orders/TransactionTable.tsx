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

export default function TransactionTable({ transactions }: TransactionTableProps) {
  if (!transactions.length) {
    return (
      <p className="text-center text-text-secondary py-8">
        No transactions found.
      </p>
    );
  }

  return (
    <div className="bg-bg-surface border border-border rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4">All Orders</h2>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-text-secondary border-b border-border">
            <th className="p-3 text-left">Symbol</th>
            <th className="p-3 text-left">Type</th>
            <th className="p-3 text-left">Quantity</th>
            <th className="p-3 text-left">Price</th>
            <th className="p-3 text-left">Total</th>
            <th className="p-3 text-left">Realized PnL</th>
            <th className="p-3 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr
              key={t.id}
              className="border-b border-border hover:bg-bg-elevated transition"
            >
              <td className="p-3 font-medium">{t.symbol}</td>
              <td
                className={`p-3 font-semibold ${
                  t.type === "BUY" ? "text-positive" : "text-negative"
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
