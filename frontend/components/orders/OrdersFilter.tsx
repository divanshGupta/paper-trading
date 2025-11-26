"use client";

import React from 'react'

export default function OrdersFilter({ setPage, filter, setFilter }: any) {
  return (
    <div className="flex bg-bg-main justify-between items-center mb-6">
            {/* 🔽 Filter Dropdown */}
            <select
              value={filter}
              onChange={(e) => {
                setPage(1); // reset to first page when filter changes
                setFilter(e.target.value);
              }}
              className="border border-border rounded-md px-3 py-2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="ALL">All Orders</option>
              <option value="BUY">Buy Orders</option>
              <option value="SELL">Sell Orders</option>
            </select>
          </div>
  )
}
