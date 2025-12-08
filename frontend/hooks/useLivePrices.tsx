//frontend/hooks/useLivePrices.tsx
"use client";

import { usePriceFeed } from "@/components/providers/PriceFeedProvider";

export function useLivePrices() {
  return usePriceFeed(); // passthrough
}


