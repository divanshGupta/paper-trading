import React from 'react'
import StockCard from '../dashboard/StockCard'
import Link from 'next/link'
import { useLivePrices } from '@/app/(main)/hooks/useLivePrices'
import { StockCardSkeleton } from '../dashboard/StockCardSkeleton';

export default function StockGrid() {
  const { prices, bySymbol, movementArrow, flash } = useLivePrices();
  const featuredStocks = ["TCS", "INFY", "RELIANCE", "HDFCBANK"];

  return (
    <div className='mb-6'>
        <h4 className='font-semibold text-xl mb-3'>Most traded stocks on Groww</h4>
        <div className="
            grid 
            grid-cols-1 
            sm:grid-cols-2 
            md:grid-cols-3 
            lg:grid-cols-4 
            gap-4 mb-3
            ">
            {/* Stock cards */}

            {/* skeleton cards */}
            {prices.length === 0 &&
              featuredStocks.map((s) => <StockCardSkeleton key={s} />)}

            {/* real cards */}

            {featuredStocks.map((sym) => {
              const p = bySymbol(sym);
              if (!p) return null;

              return (
                <StockCard
                  key={sym}
                  symbol={p.symbol}
                  name={p.name ?? sym}
                  price={p.price}
                  previousClose={p.previousClose}
                  movementArrow={movementArrow}
                  flash={flash[p.symbol]}
                />
              );
            })}
        </div>
        <Link 
        href="/" 
        className='text-blue-400 text-sm font-semibold inline-flex items-center justify-center'
        >
          {/* Wrap the text to ensure it's a solid element for Flexbox to align */}
          <span className="leading-none mr-2">See more</span> 
          <span className="text-xl">›</span>
        </Link>
    </div>
  )
}
