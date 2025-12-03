"use client";

import React from "react";
import { StocksListProps } from "@/types";
import StocksTableDesktop from "./StocksTableDesktop";
import Link from "next/link";
import StockCard from "@/components/stocks/StockCard";
import { StockCardSkeleton } from "../skeletons/StockCardSkeleton";
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
    loading = false,
  } = props;

  return (
    <div className="w-full">
      <div className="hidden md:block">
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : (
          <StocksTableDesktop
            prices={prices}
            flash={flash}
            bySymbol={bySymbol}
            marketOpen={marketOpen}
            tradingSymbol={tradingSymbol}
            onBuy={onBuy}
            onSell={onSell}
          />
        )}
      </div>

      
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
