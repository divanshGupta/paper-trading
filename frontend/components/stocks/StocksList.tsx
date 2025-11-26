// components/stocks/StocksList.tsx
"use client";

import React from "react";
import { StocksListProps } from "@/types";
import StocksTableDesktop  from "./StocksTableDesktop";
import { StockCardSkeleton } from "../dashboard/StockCardSkeleton";
import Link from "next/link";
import StockCard from "../dashboard/StockCard";

export default function StocksList(props: StocksListProps) {
  const {
    prices,
    flash,
    marketOpen,
    tradingSymbol,
    onBuy,
    onSell,
  } = props;

  return (
    <div className="w-full">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <StocksTableDesktop
          prices={prices}
          flash={flash}
          marketOpen={marketOpen}
          tradingSymbol={tradingSymbol}
          onBuy={onBuy}
          onSell={onSell}
        />
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden
          grid 
          grid-cols-2
          sm:grid-cols-2 
          md:grid-cols-3 
          lg:grid-cols-4 
          gap-4 mb-3
        "
      >
        {/* Skeletons while waiting */}
        {prices.length === 0 &&
            <StockCardSkeleton />}

        {/* Live Stock Cards */}
        {prices.map((p) => { 
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
    </div>
  );
}
