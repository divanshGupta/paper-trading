"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useMarketTime } from "@/hooks/useMarketStatus";

export default function MarketStatusPopup() {
  const {
    marketOpen,
    hoursLeft,
    minsLeft,
    isOpeningSoon,
    isClosingSoon,
  } = useMarketTime();

  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("marketPopupHidden");
    if (dismissed === "1") setHidden(true);
  }, []);

  const hidePopup = () => {
    setHidden(true);
    sessionStorage.setItem("marketPopupHidden", "1");
  };

  const shouldShow =
    (!marketOpen || isOpeningSoon || isClosingSoon) && !hidden;

  let title = "";
  let message = "";
  let glow = "";

  if (!marketOpen) {
    title = "Market Closed";
    message = `Opens in ${hoursLeft}h ${minsLeft}m`;
    glow = "from-red-400/40 to-pink-500/40";
  } else if (isClosingSoon) {
    title = "Market Closing Soon";
    message = `Closes in ${hoursLeft}h ${minsLeft}m`;
    glow = "from-amber-300/40 to-yellow-500/40";
  } else if (isOpeningSoon) {
    title = "Market Opening Soon";
    message = `Opens in ${hoursLeft}h ${minsLeft}m`;
    glow = "from-green-300/40 to-emerald-500/40";
  }

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 18 }}
            className="relative p-7 rounded-3xl bg-white/10 dark:bg-black/20 shadow-2xl backdrop-blur-xl border border-white/10
                       w-[90%] max-w-sm text-center"
          >

            {/* Close Button */}
            <button
              onClick={hidePopup}
              className="absolute top-3 right-4 text-white/60 hover:text-white text-2xl"
            >
              ×
            </button>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white drop-shadow">
              {title}
            </h2>

            {/* Message */}
            <p className="text-white/80 mt-2 text-sm">{message}</p>

            {/* CTA Styles (Optional future use) */}
            {/* 
            <button className="mt-5 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-white text-sm transition">
              Learn More
            </button>
            */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
