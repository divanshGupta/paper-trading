export default function TickerBar() {
  return (
    <div className="bg-light-surface dark:bg-dark-surface shadow-card rounded-xl px-4 py-3 max-w-7xl mx-auto flex gap-6 md:gap-20 overflow-x-auto whitespace-nowrap">
      <span>NIFTY 50: 22,456 ▲ 0.54%</span>
      <span>SENSEX: 74,120 ▲ 0.42%</span>
      <span>BANK NIFTY: 48,230 ▼ 0.18%</span>
    </div>
  );
}
