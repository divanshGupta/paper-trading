import React from 'react'

export default function StockTable() {
  return (
    <div>
        <h4 className='text-xl font-semibold mb-3'>Top Market Movers</h4>
        <div className="flex gap-4 mb-3 overflow-x-auto">
            <button className="px-4 py-2 rounded-full border dark:border-none text-light-text hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              Top Gainers
            </button>
            <button className="px-4 py-2 rounded-full border dark:border-none text-light-text hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              Top Losers
            </button>
            <button className="px-4 py-2 rounded-full border dark:border-none text-light-text hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              Most Active
            </button>
        </div>
    </div>
  )
}
