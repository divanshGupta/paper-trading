export default function PortfolioInsights({ holdings }: { holdings: any[] }) {
  const sectorMap: Record<string, number> = {};

  holdings.forEach((h) => {
    const sector = h.sector ?? "Other";
    sectorMap[sector] = (sectorMap[sector] || 0) + h.value;
  });

  return (
    <div className="bg-bg-surface border border-border rounded-xl p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Allocation by Sector</h2>

      <div className="space-y-3">
        {Object.entries(sectorMap).map(([sector, value]) => (
          <div key={sector}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">{sector}</span>
              <span className="text-text">₹{value.toFixed(2)}</span>
            </div>
            <div className="w-full h-2 bg-border rounded-full">
              <div
                className="h-2 bg-brand rounded-full"
                style={{
                  width: `${((value / Object.values(sectorMap).reduce((a, b) => a + b, 0)) * 100).toFixed(2)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
