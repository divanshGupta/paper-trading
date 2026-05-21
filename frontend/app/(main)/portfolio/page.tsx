// frontend/app/(main)/portfolio/page.tsx
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

   // Single source of truth — recalculates on every price tick
  const enrichedHoldings: EnrichedHolding[] = useMemo(() => {
    return holdings.map((h: Holding): EnrichedHolding => {
      const live = bySymbol(h.symbol);

      // Always use live socket price — updates every 2s
      const livePrice = live?.price ?? Number(h.avgPrice);
      const previousClose = live?.previousClose ?? livePrice;

      const avgPrice = Number(h.avgPrice);
      const quantity = h.quantity;

      const invested = avgPrice * quantity;
      const value = livePrice * quantity;
      const unrealized = value - invested;

      // Day P&L baseline:
      // If you bought above previousClose (i.e. bought today or at higher price)
      // use avgBuyPrice as baseline, not previousClose
      // This prevents showing gains you didn't actually capture
      const dayBaseline = Math.max(avgPrice, previousClose);
      const dayPnl = (livePrice - dayBaseline) * quantity;

      return {
        ...h,
        livePrice,
        value,
        invested,
        unrealized,
        dayPnl,                      // per-holding day P&L
        flash: flash[h.symbol] ?? null,
        sector: live?.sector ?? null,
      };
    });
  }, [holdings, bySymbol, flash]); // reruns on every price tick ✅

  // Derived from enrichedHoldings — no separate bySymbol calls needed
  const totals = useMemo(() => {
    const invested = enrichedHoldings.reduce((acc, h) => acc + h.invested, 0);
    const current = enrichedHoldings.reduce((acc, h) => acc + h.value, 0);
    const unrealized = current - invested;

    // Unrealized from open positions + realized from closed trades today
    const dayPnl = enrichedHoldings.reduce((acc, h) => acc + (h.dayPnl ?? 0), 0) + (realizedToday ?? 0);

    // ROI calculated here, not hardcoded
    const roi = invested > 0 ? (unrealized / invested) * 100 : 0;

    return { invested, current, unrealized, dayPnl, roi };
  }, [enrichedHoldings, realizedToday]);

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
    <div className="bg-bg w-full max-w-7xl mx-auto px-4 pb-20 overflow-x-hidden">

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
