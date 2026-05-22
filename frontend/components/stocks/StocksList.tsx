// frontend/components/stocks/StocksList.tsx
"use client";

import React from "react";

import { usePriceFeed } from "../providers/PriceFeedProvider";
import useEnrichedStocks from "@/hooks/useEnrichedStocks";

import StocksTableDesktop from "./StocksTableDesktop";
import StockCard from "@/components/stocks/StockCard";
import { StockCardSkeleton } from "../skeletons/StockCardSkeleton";
import TableSkeleton from "../skeletons/TableSkeleton";
import Link from "next/link";

type Props = {
  symbols?: string[];   // optional filter
};

export default function StocksList({ symbols }: Props) {

  const { loading } = usePriceFeed();
  const enriched = useEnrichedStocks();

  const prices = symbols ? enriched.filter((s) => symbols.includes(s.symbol)) : enriched;
  
  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden md:block">
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : (
          <StocksTableDesktop symbols={symbols} />
        )}
      </div>

      {/* Mobile */}
      <div className="md:hidden grid grid-cols-2 gap-3 mb-3">
         {(loading || prices.length === 0) ? (
            <StockCardSkeleton count={6} />
          ) : (
            prices.map((p) => (
              <Link key={p.symbol} href={`/stocks/${p.symbol}`} className="block">
                <StockCard
                  symbol={p.symbol}
                  name={p.name || p.symbol}
                  price={p.price}
                  previousClose={p.previousClose ?? p.price}
                  flash={p.flash}
                  sparkline={p.sparkline ?? []}
                />
              </Link>
            ))
          )}
      </div>
    </div>
  );
}
