"use client";

import type { SortKey, StockSorterProps } from "@/types";

const sortKeys: { label: string; value: SortKey }[] = [
  { label: "Symbol", value: "symbol" },
  { label: "Price", value: "price" },
  { label: "Change %", value: "change" },
  { label: "Market Cap", value: "marketCap" },
  { label: "P/E Ratio", value: "pe" },
];

export default function StockSorter({ sortKey, onChange }: StockSorterProps) {
  return (
    <select
      value={sortKey}
      onChange={(e) => onChange(e.target.value as SortKey)}
      className="px-4 py-2 rounded-lg border border-border bg-bg-main"
    >
      {sortKeys.map((opt) => (
        <option
          key={opt.value}
          value={opt.value}
          className="border border-border rounded-lg"
        >
          {opt.label}
        </option>
      ))}
    </select>
  );
}
