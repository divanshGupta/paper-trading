"use client";

import React from 'react'
import { OrderFilterValue } from '@/types';


// 2. Define the interface for the component props
interface OrdersFilterProps {
  // Function to reset the pagination page
  setPage: (page: number) => void;
  // The current filter value
  filter: OrderFilterValue;
  // Function to update the filter state with a strict type
  setFilter: (filter: OrderFilterValue) => void;
}

export default function OrdersFilter({ setPage, filter, setFilter }: OrdersFilterProps) {
  return (
    <div className="flex bg-bg-main justify-between items-center mb-6">
      {/* 🔽 Filter Dropdown */}
      <select
        value={filter}
        onChange={(e) => {
          // Cast the value to the strict type since we know the options match
          const newFilter = e.target.value as OrderFilterValue;

          setPage(1); // reset to first page when filter changes
          setFilter(newFilter);
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