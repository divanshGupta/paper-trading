import React from 'react'
import StockCard from '../dashboard/StockCard'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default function StockGrid() {
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
            {/* Example stock cards */}
            <StockCard symbol="TCS" price={3920} change={1.24} />  
            <StockCard symbol="INFY" price={1476} change={-0.82} />
            <StockCard symbol="RELIANCE" price={2540} change={0.45} />     
            <StockCard symbol="HDFCBANK" price={1620} change={-0.35} />
        </div>
        <Link 
        href="/" 
        className='text-blue-400 text-sm font-semibold inline-flex items-center justify-center'
        >
          {/* Wrap the text to ensure it's a solid element for Flexbox to align */}
          <span className="**leading-none**">See more</span> 
          <ChevronRight size={16} />
        </Link>
    </div>
  )
}
