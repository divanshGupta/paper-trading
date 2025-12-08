"use client";

import AuthGuard from "../hooks/authGaurd";
import { useMemo } from "react";
import { useLivePrices } from "../hooks/useLivePrices";
import { useApp } from "@/components/providers/AppProvider";
import PortfolioSummary from "@/components/portfolio/PortfolioSummary";
import PortfolioInsights from "@/components/portfolio/PortfolioInsights";
import HoldingsTable from "@/components/portfolio/HoldingsTable";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { EnrichedHolding, Holding } from "@/types";

function PortfolioPage() {
  const { state, refresh } = useApp();
  const { profile, holdings = [], loading, realizedToday } = state;
  const { bySymbol, flash } = useLivePrices();

  // WAIT for real data
  const isDataReady = profile && holdings.length > 0;

  if (!isDataReady) {
    return (
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <TableSkeleton rows={8} cols={6} />
      </div>
    );
  }

  const enrichedHoldings: EnrichedHolding[] = useMemo(() => {
    return holdings.map((h: Holding): EnrichedHolding => {
      const live = bySymbol(h.symbol);
      const price = live?.price ?? 0;
      const value = price * h.quantity;
      const invested = h.avgPrice * h.quantity;

      return {
        ...h,
        livePrice: price,
        value,
        invested,
        unrealized: value - invested,
        flash: flash[h.symbol],
        sector: live?.sector ?? null,
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

    return { invested, current, unrealized, roi, dayPnl };
  }, [enrichedHoldings, bySymbol]);

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20">
      <PortfolioSummary
        balance={profile?.balance ?? 0}
        invested={totals.invested}
        current={totals.current}
        unrealized={totals.unrealized}
        dayPnl={totals.dayPnl}
        realizedToday={realizedToday ?? 0}
        roi={totals.roi}
      />

      <PortfolioInsights holdings={enrichedHoldings} />

      <HoldingsTable
        holdings={enrichedHoldings}
        flash={flash}
        onSuccess={refresh}
      />
    </div>
  );
}

const ProtectedPortfolioPage = () => (
  <AuthGuard>
    <PortfolioPage />
  </AuthGuard>
);

export default ProtectedPortfolioPage;
