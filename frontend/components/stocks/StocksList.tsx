"use client";

import React from "react";
import { StocksListProps } from "@/types";
import StocksTableDesktop from "./StocksTableDesktop";
import { StockCardSkeleton } from "@/components/skeletons/StockCardSkeleton";
import Link from "next/link";
import StockCard from "@/components/dashboard/StockCard";
import TableSkeleton from "../skeletons/TableSkeleton";

export default function StocksList(props: StocksListProps) {
  const {
    prices,
    flash,
    bySymbol,
    marketOpen,
    tradingSymbol,
    onBuy,
    onSell,
    disableActions,
  } = props;

  return (
    <div className="w-full">
      <div className="hidden md:block">
        {/* Skeletons while waiting */}
        

        <StocksTableDesktop
          prices={prices}
          flash={flash}
          bySymbol={bySymbol}
          marketOpen={marketOpen}
          tradingSymbol={tradingSymbol}
          onBuy={onBuy}
          onSell={onSell}
        />
      </div>

      
      <div className="md:hidden grid grid-cols-2 gap-3 mb-3">

        

        {prices?.map((p) => (
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
        ))}
      </div>
    </div>
  );
}
