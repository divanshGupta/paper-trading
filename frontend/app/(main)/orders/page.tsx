"use client";

import AuthGuard from "../hooks/authGaurd";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import { Transaction, OrderFilterValue } from "@/types";
import TransactionTable from "@/components/orders/TransactionTable";
import Pagination from "@/components/ui/Pagination";
import OrdersFilter from "@/components/orders/OrdersFilter";

function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<OrderFilterValue>("ALL"); // 👈 NEW
  const limit = 10;
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL!;

  const router = useRouter();

  const fetchTransactions = useCallback(async () => {
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
        `${BACKEND_URL}/api/v1/transactions/orders?${queryParams}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const json = await res.json();
      console.log("API response:", json);

      setTransactions(json.data || []);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  }, [page, filter, router]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]); // 👈 refetch when page or filter changes

  return (
    <div className="p-8 pt-10 mb-10 h-screen max-w-7xl mx-auto">

      <OrdersFilter filter={filter} setFilter={setFilter} setPage={setPage} />

      {transactions.length === 0 ? (
        <p>No {filter === "ALL" ? "" : filter.toLowerCase()} orders found.</p>
      ) : (
        
          <TransactionTable transactions={transactions}  />
      
        )}

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(newPage) => setPage(newPage)}
      />

    </div>
  );
}

const ProtectedOrdersPage = () => (
  <AuthGuard>
    <TransactionsPage />
  </AuthGuard>
);

export default ProtectedOrdersPage;