"use client";

export default function StockFilterTabs({ selected, onSelect }: any) {
  return (
    <div className="flex gap-3 mb-4">
      {["all", "gainers", "losers"].map((t) => (
        <button
          key={t}
          onClick={() => onSelect(t)}
          className={`px-4 py-2 rounded-lg text-sm font-medium
            ${selected === t
              ? "bg-bg-elevated text-text border border-border"
                : "bg-bg-main text-text border border-border"
            }
          `}
        >
          {t === "all" ? "All" : t === "gainers" ? "Top Gainers" : "Top Losers"}
        </button>
      ))}
    </div>
  );
}
