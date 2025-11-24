"use client";
import { useEffect, useState } from "react";
import { getMarketCountdownIST } from "@/utils/marketTime";

export default function MarketClock() {
  const [time, setTime] = useState(getMarketCountdownIST());

  useEffect(() => {
    const interval = setInterval(() => setTime(getMarketCountdownIST()), 60000); // every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`text-center p-3 rounded font-semibold mb-4 ${
        time.marketOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {time.marketOpen
        ? `🕒 Market closes in ${time.hoursLeft}h ${time.minsLeft}m`
        : `⏳ Market opens in ${time.hoursLeft}h ${time.minsLeft}m`}
    </div>
  );
}
