"use client";

import React from 'react';

// Define the required properties for a holding object used in this component.
// We assume it includes 'sector' for grouping and 'value' (market value of the holding).
interface InsightHolding {
  sector: string | null | undefined;
  value: number; // The current market value of the holding (Qty * Live Price)
}

// Define the component props interface
interface PortfolioInsightsProps {
    holdings: InsightHolding[];
}

export default function PortfolioInsights({ holdings }: PortfolioInsightsProps) {
  // Sector map stores the total value allocated to each sector
  const sectorMap: Record<string, number> = {};

  holdings.forEach((h) => {
    // Ensure we handle null/undefined sectors by defaulting to "Other"
    const sector = h.sector ?? "Other"; 
    sectorMap[sector] = (sectorMap[sector] || 0) + h.value;
  });

  const totalPortfolioValue = Object.values(sectorMap).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-bg-surface border border-border rounded-xl p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Allocation by Sector</h2>

      <div className="space-y-3">
        {Object.entries(sectorMap).map(([sector, value]) => {
          // Calculate the percentage of this sector's value relative to the total portfolio value
          const percentage = totalPortfolioValue > 0 
            ? (value / totalPortfolioValue) * 100 
            : 0;

          return (
            <div key={sector}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-secondary">{sector}</span>
                {/* Display value and calculated percentage */}
                <span className="text-text">
                  ₹{value.toFixed(2)} ({percentage.toFixed(2)}%)
                </span>
              </div>
              <div className="w-full h-2 bg-border rounded-full">
                <div
                  className="h-2 bg-brand rounded-full"
                  style={{
                    // Use the calculated percentage for the width
                    width: `${percentage}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {totalPortfolioValue === 0 && (
        <p className="text-center text-text-secondary py-4">
          No holdings available for sector analysis.
        </p>
      )}
    </div>
  );
}