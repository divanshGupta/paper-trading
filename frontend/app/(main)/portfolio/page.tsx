"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLivePrices } from "../hooks/useLivePrices";
import { useApp } from "@/components/providers/AppProvider";
import SellModal from "@/components/trade/SellModal";
import PortfolioSummary from "@/components/portfolio/PortfolioSummary";
import PortfolioInsights from "@/components/portfolio/PortfolioInsights";
import HoldingsTable from "@/components/portfolio/HoldingsTable";

export default function PortfolioPage() {
  const router = useRouter();
  const { state, refresh } = useApp();
  const { profile, holdings = [], loading, realizedToday } = state;
  const { bySymbol, flash } = useLivePrices();

  const [activeSell, setActiveSell] = useState<{
    symbol: string;
    holdingQty: number;
  } | null>(null);


  // Redirect to login
  if (!loading && !profile) {
    router.replace("/login");
    return null;
  }

  // SUMMARIES
  const enrichedHoldings = useMemo(() => {
    return holdings.map((h) => {
      const live = bySymbol(h.symbol);
      const price = live?.price ?? 0;
      const value = price * h.quantity;
      const invested = h.avgPrice * h.quantity;
      const unrealized = value - invested;

      return {
        ...h,
        livePrice: price,
        value,
        invested,
        unrealized,
        flash: flash[h.symbol],
      };
    });
  }, [holdings, bySymbol, flash]);

  const totals = useMemo(() => {
    const invested = enrichedHoldings.reduce((acc, h) => acc + h.invested, 0);
    const current = enrichedHoldings.reduce((acc, h) => acc + h.value, 0);
    const unrealized = current - invested;
    const roi = invested > 0 ? (unrealized / invested) * 100 : 0;
    const dayPnl = enrichedHoldings.reduce((acc, h) => {
      const live = bySymbol(h.symbol);
      if (!live) return acc;
      const diff = live.price - live.previousClose;
      return acc + diff * h.quantity;
    }, 0);

    return {
      invested,
      current,
      unrealized,
      roi,
      dayPnl,
    };
  }, [enrichedHoldings, bySymbol]);

  if (loading) {
    return <div className="text-center p-10 text-text-secondary">Loading Portfolio…</div>;
  }

  return (
    <div className="max-w-7xl mx-auto pt-10 px-4 pb-20">

      {/* Summary */}
      <PortfolioSummary
        balance={profile?.balance ?? 0}
        invested={totals.invested}
        current={totals.current}
        unrealized={totals.unrealized}
        dayPnl={totals.dayPnl}
        realizedToday={realizedToday ?? 0}
        roi={totals.roi}
      />

      {/* Insights */}
      <PortfolioInsights holdings={enrichedHoldings} />

      {/* Holdings Table */}
      <HoldingsTable
        holdings={enrichedHoldings}
        flash={flash}
        onSuccess={refresh}

      />

      {/* Sell Modal */}
      {/* {activeSell && (
        <SellModal
          symbol={activeSell.symbol}
          holdingQty={activeSell.holdingQty}
          price={bySymbol(activeSell.symbol)?.price ?? 0}
          onClose={() => setActiveSell(null)}
          onSuccess={refresh}
        />
      )} */}
    </div>
  );
}
