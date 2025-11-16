export function StockCardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse">
      <div className="h-5 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
      <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 mt-2 rounded"></div>
      <div className="h-8 w-24 bg-gray-300 dark:bg-gray-700 mt-4 rounded"></div>
      <div className="h-6 w-full bg-gray-300 dark:bg-gray-700 mt-4 rounded"></div>
    </div>
  );
}
