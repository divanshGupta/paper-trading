"use client";

import AuthGuard from "../../../hooks/authGaurd";
import { useMemo } from "react";
import { useLivePrices } from "../../../hooks/useLivePrices";
import { useApp } from "@/components/providers/AppProvider";
import PortfolioSummary from "@/components/portfolio/PortfolioSummary";
import PortfolioInsights from "@/components/portfolio/PortfolioInsights";
import HoldingsTable from "@/components/portfolio/HoldingsTable";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { EnrichedHolding, Holding } from "@/types";

function PortfolioPage() {
  const { state, refresh } = useApp();
  const { profile, holdings = [], realizedToday } = state;
  const { bySymbol, flash } = useLivePrices();

  const isLoading = state.loading;

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
      return acc + (live.price - live.previousClose) * h.quantity;
    }, 0);

    return { invested, current, unrealized, roi, dayPnl };
  }, [enrichedHoldings, bySymbol]);

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 pb-20 overflow-x-hidden">
        <TableSkeleton rows={8} cols={6} />
      </div>
    );
  }

  if (!isLoading && holdings.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 pb-20 text-center">
        <p className="text-xl font-semibold mt-6">No stocks in your portfolio</p>
        <p className="text-text-secondary mt-1">
          Buy your first stock to see it appear here.
        </p>
      </div>
    );
  }


  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-20 overflow-x-hidden">

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

export default function ProtectedPortfolioPage() {
  return (
    <AuthGuard>
      <PortfolioPage />
    </AuthGuard>
  );
}
