"use client";

import AuthGuard from "../hooks/authGaurd";
import { useMemo } from "react";
import { useLivePrices } from "../hooks/useLivePrices";
import { useApp } from "@/components/providers/AppProvider";
import PortfolioSummary from "@/components/portfolio/PortfolioSummary";
import PortfolioInsights from "@/components/portfolio/PortfolioInsights";
import HoldingsTable from "@/components/portfolio/HoldingsTable";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { EnrichedHolding, Holding} from "@/types";

function PortfolioPage() {

  const { state, refresh } = useApp();
  const { profile, holdings = [], loading, realizedToday } = state;
  const { bySymbol, flash } = useLivePrices();

  // SUMMARIES
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
    const invested = enrichedHoldings.reduce((acc: number, h: EnrichedHolding) => acc + h.invested, 0);
    const current = enrichedHoldings.reduce((acc:number, h: EnrichedHolding) => acc + h.value, 0);
    const unrealized = current - invested;
    const roi = invested > 0 ? (unrealized / invested) * 100 : 0;
    
    const dayPnl = enrichedHoldings.reduce((acc: number, h: EnrichedHolding) => {
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
      {/* <HoldingsTable
        holdings={enrichedHoldings}
        flash={flash}
        onSuccess={refresh}
      /> */}

      {state.loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <HoldingsTable
          holdings={enrichedHoldings}
          flash={flash}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}

const ProtectedPortfolioPage = () => (
    <AuthGuard>
      <PortfolioPage />
    </AuthGuard>
);

export default ProtectedPortfolioPage;