"use client";

import AuthGuard from "../../../hooks/authGaurd";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import { Transaction, OrderFilterValue } from "@/types";
import OrdersCard from "@/components/orders/OrdersCard";
import OrdersFilter from "@/components/orders/OrdersFilter";
import Pagination from "@/components/ui/Pagination";
import TransactionTable from "@/components/orders/TransactionTable";
import TableSkeleton from "@/components/skeletons/TableSkeleton";

function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<OrderFilterValue>("ALL");

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL as string;
  const limit = 10;
  const router = useRouter();

  const fetchTransactions = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) return router.push("/login");

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

      setTransactions(json.data || []);
      setTotalPages(json.pagination?.totalPages || 1);

    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  }, [page, filter, router]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="max-w-7xl mx-auto px-4 pb-10">

      {/* Filter Bar */}
      <OrdersFilter filter={filter} setFilter={setFilter} setPage={setPage} />

      {/* Empty State */}
      {transactions.length === 0 ? (
         <TableSkeleton rows={5} cols={4} />
      ) : (
        <>
          {/* MOBILE — Cards */}
          <div className="md:hidden space-y-4 mt-4">
            {transactions.map((tx) => (
              <OrdersCard key={String(tx.id)} order={tx} />
            ))}
          </div>

          {/* DESKTOP — Table */}
          <div className="hidden md:block">
            <TransactionTable transactions={transactions} />
          </div>
        </>
      )}

      {/* Pagination */}
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
