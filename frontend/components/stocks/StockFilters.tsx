import type { SectorFilter, StockFiltersProps } from "@/types";

const sectors: SectorFilter[] = [
  "All",
  "IT",
  "Banking",
  "Auto",
  "FMCG",
  "Energy",
  "Telecom",
  "Pharma",
];

export default function StockFilters({ selected, onSelect }: StockFiltersProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {sectors.map((sec) => (
        <button
          key={sec}
          onClick={() => onSelect(sec)}   // << NO TYPE ERROR NOW
          className={`px-3 py-1 rounded ${
            selected === sec ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          {sec}
        </button>
      ))}
    </div>
  );
}
