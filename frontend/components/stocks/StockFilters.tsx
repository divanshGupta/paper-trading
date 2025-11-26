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
    <div className="hidden md:flex gap-2 flex-wrap">
      {sectors.map((sec) => (
        <button
          key={sec}
          onClick={() => onSelect(sec)}   // << NO TYPE ERROR NOW
          className={`px-4 py-2 rounded-lg ${
            selected === sec ? "bg-bg-elevated text-text border border-border" : "bg-bg-main text-text border border-border"
          }`}
        >
          {sec}
        </button>
      ))}
    </div>
  );
}
