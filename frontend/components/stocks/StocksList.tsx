// components/stocks/StocksList.tsx
"use client";

import React from "react";
import { StocksListProps } from "@/types";
import StocksTableDesktop  from "./StocksTableDesktop";
import { StocksCardsMobile } from "./StocksCardsMobile";

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
      <div className="md:hidden">
        <StocksCardsMobile
          prices={prices}
          flash={flash}
          marketOpen={marketOpen}
          tradingSymbol={tradingSymbol}
          onBuy={onBuy}
          onSell={onSell}
        />
      </div>
    </div>
  );
}
