"use client";

type StockCardProps = {
  symbol: string;
  price: number;
  change: number;
};

export default function StockCard({ symbol, price, change }: StockCardProps) {
  const positive = change >= 0;

  return (
    <div className="
      bg-light-surface dark:bg-dark-surface 
      shadow-card hover:shadow-card-hover 
      transition rounded-xl p-4 cursor-pointer
      border border-gray-300
    ">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-lg">{symbol}</h3>

        <span
          className={`px-2 py-1 rounded-md text-xs font-medium ${
            positive
              ? "bg-green-100 text-positive dark:bg-green-900 dark:text-green-400"
              : "bg-red-100 text-negative dark:bg-red-900 dark:text-red-400"
          }`}
        >
          {positive ? "+" : ""}
          {change}%
        </span>
      </div>

      <p className="text-xl font-semibold mt-1">₹{price}</p>
    </div>
  );
}
