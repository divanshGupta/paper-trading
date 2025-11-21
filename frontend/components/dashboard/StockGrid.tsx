"use client";

import Link from "next/link";
import StockCard from "../dashboard/StockCard";
import { StockCardSkeleton } from "../dashboard/StockCardSkeleton";
import { useLivePrices } from "@/app/(main)/hooks/useLivePrices";

export default function StockGrid() {
  const { prices, bySymbol, flash } = useLivePrices();

  const featuredStocks = ["TCS", "INFY", "RELIANCE", "HDFCBANK"];

  return (
    <div className="mb-6">
      <h4 className="font-semibold text-xl mb-3">Most traded stocks</h4>

      <div
        className="
          grid 
          grid-cols-1 
          sm:grid-cols-2 
          md:grid-cols-3 
          lg:grid-cols-4 
          gap-4 mb-3
        "
      >
        {/* Skeletons while waiting */}
        {prices.length === 0 &&
          featuredStocks.map((sym) => <StockCardSkeleton key={sym} />)}

        {/* Live Stock Cards */}
        {featuredStocks.map((sym) => {
          const p = bySymbol(sym);
          if (!p) return null;

          return (
            <Link href="/stocks/[symbol]" as={`/stocks/${p.symbol}`} key={p.symbol}>
              <StockCard
                key={p.symbol}
                symbol={p.symbol}
                name={p.name || p.symbol}
                price={p.price}
                previousClose={p.previousClose || p.price}
                flash={flash[p.symbol]}
                sparkline={p.sparkline ?? []}
              />
            </Link>
          );
        })}
      </div>

      <Link
        href="/"
        className="text-blue-400 text-sm font-semibold inline-flex items-center justify-center"
      >
        <span className="mr-2">See more</span>
        <span className="text-xl">›</span>
      </Link>
    </div>
  );
}
