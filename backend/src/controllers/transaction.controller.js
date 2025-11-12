import { prisma } from "../utils/db.js";


// GET all the orders/transactions
export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Parse query params with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type || null;

    const skip = (page - 1) * limit;

    // Optional filter (BUY, SELL, or both)
    const where = {
      userId,
      ...(type ? { type } : {}), // include only if type is passed
    };

    // Fetch paginated transactions and total count
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ error: "Failed to fetch transactions" });
  }
};


// group trades by symbol, calculate realized profit/loss
export const getRealizedPnL = async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    if (!transactions.length)
      return res.status(200).json({ realizedPnL: [] });

    const summary = {};

    for (const tx of transactions) {
      const { symbol, type, price, quantity } = tx;
      if (!summary[symbol]) {
        summary[symbol] = {
          symbol,
          buyQty: 0,
          sellQty: 0,
          totalBuyValue: 0,
          totalSellValue: 0,
          realizedPnL: 0,
        };
      }

      const s = summary[symbol];

      if (type === "BUY") {
        s.buyQty += quantity;
        s.totalBuyValue += Number(price) * quantity;
      } else if (type === "SELL") {
        s.sellQty += quantity;
        s.totalSellValue += Number(price) * quantity;

        // Approx realized PnL using FIFO-like approach
        const avgBuy = s.buyQty ? s.totalBuyValue / s.buyQty : 0;
        s.realizedPnL += (Number(price) - avgBuy) * quantity;
      }
    }

    const result = Object.values(summary).map((s) => {
      const avgBuy = s.buyQty ? s.totalBuyValue / s.buyQty : 0;
      const avgSell = s.sellQty ? s.totalSellValue / s.sellQty : 0;
      const pnlPercent =
        avgBuy > 0 ? ((s.realizedPnL / (avgBuy * s.sellQty || 1)) * 100).toFixed(2) : 0;

      return {
        symbol: s.symbol,
        avgBuy: avgBuy.toFixed(2),
        avgSell: avgSell.toFixed(2),
        buyTrades: s.buyQty,
        sellTrades: s.sellQty,
        realizedPnL: s.realizedPnL.toFixed(2),
        pnlPercent,
      };
    });

    res.status(200).json({ realizedPnL: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
