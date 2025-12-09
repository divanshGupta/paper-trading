"use client";

import { useEffect, useState } from "react";
import { getMarketStatusIST, getMarketCountdownIST } from "@/utils/marketTime";

export function useMarketTime() {
  const [state, setState] = useState({
    marketOpen: true,
    hoursLeft: 0,
    minsLeft: 0,
    isOpeningSoon: false,
    isClosingSoon: false,
  });

  const update = () => {
    const { marketOpen } = getMarketStatusIST();
    const { hoursLeft, minsLeft } = getMarketCountdownIST();

    setState({
      marketOpen,
      hoursLeft,
      minsLeft,
      isOpeningSoon: !marketOpen && hoursLeft === 0 && minsLeft <= 30,
      isClosingSoon: marketOpen && hoursLeft === 0 && minsLeft <= 20,
    });
  };

  useEffect(() => {
    update();
    const timer = setInterval(update, 60 * 1000); // update every 1 min
    return () => clearInterval(timer);
  }, []);

  return state;
}
