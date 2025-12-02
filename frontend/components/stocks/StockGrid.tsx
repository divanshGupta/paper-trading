"use client";

import Link from "next/link";
import StockCard from "./StockCard";
import { StockCardSkeleton } from "../skeletons/StockCardSkeleton";
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
          grid-cols-2
          sm:grid-cols-2 
          md:grid-cols-3 
          lg:grid-cols-4 
          gap-4 mb-3
        "
      >
        {prices.length === 0 ? (
          <StockCardSkeleton count={4} />
        ) : (
          featuredStocks.map((sym) => {
            const p = bySymbol(sym);
            if (!p) return null;
            return (
              <Link href={`/stocks/${p.symbol}`} key={p.symbol}>
                <StockCard
                  symbol={p.symbol}
                  name={p.name || p.symbol}
                  price={p.price}
                  previousClose={p.previousClose ?? p.price}
                  flash={flash[p.symbol]}
                />
              </Link>
            );
          })
        )}
      </div>

      <Link
        href="/stocks"
        className="text-positive text-sm font-semibold inline-flex items-center justify-center"
      >
        <span className="mr-2">See more</span>
        <span className="text-xl">›</span>
      </Link>
    </div>
  );
}
