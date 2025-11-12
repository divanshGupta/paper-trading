"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import TransactionTable from "@/components/TransactionTable";
import Pagination from "@/components/Pagination";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState("ALL"); // 👈 NEW
  const limit = 10;

  const router = useRouter();

  const fetchTransactions = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return router.push("/login");

      // Construct the query
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filter !== "ALL") queryParams.append("type", filter);

      const res = await fetch(
        `http://localhost:5500/api/v1/transactions/orders?${queryParams}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const json = await res.json();
      console.log("API response:", json);

      setTransactions(json.data || []);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, filter]); // 👈 refetch when page or filter changes

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order History</h1>

        {/* 🔽 Filter Dropdown */}
        <select
          value={filter}
          onChange={(e) => {
            setPage(1); // reset to first page when filter changes
            setFilter(e.target.value);
          }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="ALL">All Orders</option>
          <option value="BUY">Buy Orders</option>
          <option value="SELL">Sell Orders</option>
        </select>
      </div>

      {transactions.length === 0 ? (
        <p>No {filter === "ALL" ? "" : filter.toLowerCase()} orders found.</p>
      ) : (
        <TransactionTable transactions={transactions} />
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(newPage) => setPage(newPage)}
      />

      <button
        className="underline text-blue-500 mt-6"
        onClick={() => router.push("/dashboard")}
      >
        Back To Market
      </button>
    </div>
  );
}
