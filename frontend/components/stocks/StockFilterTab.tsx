"use client";

export default function StockFilterTabs({ selected, onSelect }: any) {
  return (
    <div className="flex gap-3">
      {["all", "gainers", "losers"].map((t) => (
        <button
          key={t}
          onClick={() => onSelect(t)}
          className={`px-4 py-2 rounded-lg text-sm font-medium
            ${selected === t
              ? "bg-brand text-white dark:bg-brand-dark"
              : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }
          `}
        >
          {t === "all" ? "All" : t === "gainers" ? "Top Gainers" : "Top Losers"}
        </button>
      ))}
    </div>
  );
}
