//backend/src/controllers/portfolio.controller.js
import { prisma } from "../utils/db.js";
import logger from "../utils/logger.js";
import { findLiveStock, round2 } from "../utils/stockUtils.js";

export const getPortfolio = async (req, res) => {
  try {
    const userId = req.user.id;

    const holdings = await prisma.portfolio.findMany({
      where: { userId },
      orderBy: { symbol: "asc" }
    });

    if (holdings.length === 0) {
      return res.status(200).json({
        holdings: [],
        summary: { invested: 0, current: 0, unrealized: 0, roi: 0 }
      });
    }

    // Enrich each holding with live price data from engine
    const enriched = holdings.map((h) => {
      const live = findLiveStock(h.symbol);
      const livePrice = live ? Number(live.price) : Number(h.avgPrice);
      const previousClose = live?.previousClose ?? livePrice;

      const avgPrice = Number(h.avgPrice);
      const quantity = h.quantity;

      const invested = round2(avgPrice * quantity);
      const current = round2(livePrice * quantity);
      const unrealized = round2(current - invested);
      const roi = invested > 0 ? round2((unrealized / invested) * 100) : 0;
      const dayPnl = round2((livePrice - previousClose) * quantity);

      return {
        ...h,
        avgPrice,
        livePrice,
        previousClose,
        invested,
        current,
        unrealized,
        roi,
        dayPnl,
      };
    });

    // Portfolio-level summary
    const summary = enriched.reduce(
      (acc, h) => ({
        invested: round2(acc.invested + h.invested),
        current: round2(acc.current + h.current),
        unrealized: round2(acc.unrealized + h.unrealized),
        dayPnl: round2(acc.dayPnl + h.dayPnl),
      }),
      { invested: 0, current: 0, unrealized: 0, dayPnl: 0 }
    );

    summary.roi = summary.invested > 0
      ? round2((summary.unrealized / summary.invested) * 100)
      : 0;

    return res.status(200).json({ holdings: enriched, summary });

  } catch (err) {
    logger.error("Portfolio fetch error:", err);
    return res.status(500).json({ message: err.message });
  }
};
