export default function TickerBar() {
  return (
    <div className="w-full bg-light-surface dark:bg-dark-surface shadow-card py-3 flex gap-6 md:gap-20 overflow-x-auto whitespace-nowrap border-y border-gray-300 px-32">
        <span>NIFTY 50: 22,456 ▲ 0.54%</span>
        <span>SENSEX: 74,120 ▲ 0.42%</span>
        <span>BANK NIFTY: 48,230 ▼ 0.18%</span>
    </div>
  );
}
