export default function PortfolioSummary({
  balance,
  invested,
  current,
  unrealized,
  dayPnl,
  realizedToday,
  roi,
}: {
  balance: number;
  invested: number;
  current: number;
  unrealized: number;
  dayPnl: number;
  realizedToday: number;
  roi: number;
}) {
  return (
    <div className="bg-bg-surface border border-border rounded-xl p-6 mb-8">
      <h1 className="text-2xl font-semibold mb-4">Portfolio Summary</h1>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Current Value */}
        <div className="p-4 bg-bg-elevated rounded-xl border border-border">
          <p className="text-text-secondary text-sm">Current Value</p>
          <p className="text-2xl font-semibold mt-1 text-text">₹{current.toFixed(2)}</p>
        </div>

        {/* Invested Value */}
        <div className="p-4 bg-bg-elevated rounded-xl border border-border">
          <p className="text-text-secondary text-sm">Invested</p>
          <p className="text-2xl font-semibold mt-1">₹{invested.toFixed(2)}</p>
        </div>

        {/* Balance */}
        <div className="p-4 bg-bg-elevated rounded-xl border border-border">
          <p className="text-text-secondary text-sm">Balance</p>
          <p className="text-2xl font-semibold mt-1">₹{balance}</p>
        </div>

      </div>

      {/* PNL Section */}
      <div className="grid md:grid-cols-3 gap-6 mt-6">

        <div className="p-4 bg-bg-elevated rounded-xl border border-border">
          <p className="text-text-secondary text-sm">Unrealized P&L</p>
          <p className={`text-2xl font-semibold mt-1 ${unrealized >= 0 ? "text-positive" : "text-negative"}`}>
            {unrealized >= 0 ? "+" : ""}{unrealized.toFixed(2)}
          </p>
        </div>

        <div className="p-4 bg-bg-elevated rounded-xl border border-border">
          <p className="text-text-secondary text-sm">Day P&L</p>
          <p className={`text-2xl font-semibold mt-1 ${dayPnl >= 0 ? "text-positive" : "text-negative"}`}>
            {dayPnl >= 0 ? "+" : ""}{dayPnl.toFixed(2)}
          </p>
        </div>

        <div className="p-4 bg-bg-elevated rounded-xl border border-border">
          <p className="text-text-secondary text-sm">ROI %</p>
          <p className={`text-2xl font-semibold mt-1 ${roi >= 0 ? "text-positive" : "text-negative"}`}>
            {roi.toFixed(2)}%
          </p>
        </div>

      </div>
    </div>
  );
}
