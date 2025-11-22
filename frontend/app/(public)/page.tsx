"use client";
import React, { useEffect, useState } from "react";
// import { socket } from "@/utils/socket";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

// type StocksState = Record<string, StockData>;
export const dynamic = "force-static"; // disables HMR for this page

export default function Home() {
  // const [stocks, setStocks] = useState<StocksState>({});

  // useEffect(() => {
  //   if (typeof window === "undefined") return;

  //   if (!socket) return;

    // Handle live stock updates
  //   const handleStockUpdate = (data: StockData) => {
  //     setStocks((prev) => ({
  //       ...prev,
  //       [data.symbol]: data,
  //     }));
  //   };

  //   socket.on("stock:update", handleStockUpdate);

  //   socket.on("connect", () => {
  //     console.log("✅ Connected to socket:", socket.id);
  //   });

  //   socket.on("connect_error", (err: Error) => {
  //     console.error("❌ Socket connection error:", err.message);
  //   });

  //   // 5️⃣ Cleanup
  //   return () => {
  //     socket.off("stock:update", handleStockUpdate);
  //     socket.disconnect();
  //   };
  // }, []);

  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({data}) => {
      if (data.session?.user) {
        // auto redirect if logged in
        router.push("/dashboard")
      }
    })
  }, [])


  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold mb-6">📈 Live Stock Ticker</h1>

      <button 
        className="px-6 py-2 rounded"
        onClick={() => router.push("/login")}
      >
        Login / Signup
      </button>
      
    </main>
  );
}
