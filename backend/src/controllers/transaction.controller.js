import { prisma } from "../utils/db.js";
import moment from "moment-timezone";

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

    // Fetch all trades sorted in FIFO order
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        symbol: true,
        type: true,
        price: true,
        quantity: true,
        createdAt: true,
      }
    });

    if (!transactions.length) {
      return res.status(200).json({
        realizedPnL: [],
        realizedTotal: 0,
      });
    }

    const fifoQueues = {}; // symbol → [{ price, qty }]
    const summary = {};    // symbol → aggregated stats

    for (const tx of transactions) {
      const symbol = tx.symbol.toUpperCase();
      const qty = tx.quantity;
      const price = Number(tx.price);

      if (!fifoQueues[symbol]) fifoQueues[symbol] = [];
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

      const record = summary[symbol];

      // BUY — add to FIFO queue
      if (tx.type === "BUY") {
        fifoQueues[symbol].push({ price, qty });
        record.buyQty += qty;
        record.totalBuyValue += qty * price;
      }

      // SELL — match using FIFO
      if (tx.type === "SELL") {
        let qtyToSell = qty;

        record.sellQty += qty;
        record.totalSellValue += qty * price;

        while (qtyToSell > 0 && fifoQueues[symbol].length > 0) {
          const lot = fifoQueues[symbol][0];
          const matched = Math.min(lot.qty, qtyToSell);

          // FIFO PnL
          record.realizedPnL += (price - lot.price) * matched;

          lot.qty -= matched;
          qtyToSell -= matched;

          if (lot.qty === 0) fifoQueues[symbol].shift();
        }
      }
    }

    // Final Response Mapping
    const realizedPnL = Object.values(summary).map((row) => {
      const avgBuy = row.buyQty ? row.totalBuyValue / row.buyQty : 0;
      const avgSell = row.sellQty ? row.totalSellValue / row.sellQty : 0;

      return {
        symbol: row.symbol,
        avgBuy: Number(avgBuy.toFixed(2)),
        avgSell: Number(avgSell.toFixed(2)),
        buyQty: row.buyQty,
        sellQty: row.sellQty,
        realizedPnL: Number(row.realizedPnL.toFixed(2)),
        pnlPercent: row.totalSellValue
          ? Number(((row.realizedPnL / row.totalSellValue) * 100).toFixed(2))
          : 0,
      };
    });

    const realizedTotal = realizedPnL.reduce(
      (acc, row) => acc + row.realizedPnL,
      0
    );

    return res.status(200).json({
      realizedPnL,
      realizedTotal,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Calculate realized PnL for TODAY's sells only (FIFO basis)

export const getRealizedToday = async (req, res) => {
  try {
    const userId = req.user.id;

    const today = moment().tz("Asia/Kolkata").startOf("day");

    const allTx = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    // Filter only today's SELLs
    const todaysSells = allTx.filter(
      (tx) =>
        tx.type === "SELL" &&
        moment(tx.createdAt).tz("Asia/Kolkata").isSame(today, "day")
    );

    if (!todaysSells.length) {
      return res.json({ realizedToday: 0 });
    }

    // FIFO queue for each symbol
    const fifo = {};

    // Load buys and deduct previous sells (before today)
    for (const tx of allTx) {
      const symbol = tx.symbol;
      const qty = tx.quantity;
      const price = Number(tx.price);

      if (!fifo[symbol]) fifo[symbol] = [];

      if (tx.type === "BUY") {
        fifo[symbol].push({ price, qty });
      }

      // Deduct non-today sells
      if (
        tx.type === "SELL" &&
        !moment(tx.createdAt).tz("Asia/Kolkata").isSame(today, "day")
      ) {
        let q = qty;
        while (q > 0 && fifo[symbol].length) {
          const lot = fifo[symbol][0];
          const matched = Math.min(lot.qty, q);
          lot.qty -= matched;
          q -= matched;
          if (lot.qty === 0) fifo[symbol].shift();
        }
      }
    }

    // Now calculate today's realized PnL
    let realizedToday = 0;

    for (const tx of todaysSells) {
      let qty = tx.quantity;
      const sellPrice = Number(tx.price);

      while (qty > 0 && fifo[tx.symbol]?.length > 0) {
        const lot = fifo[tx.symbol][0];
        const matched = Math.min(lot.qty, qty);

        realizedToday += (sellPrice - lot.price) * matched;

        lot.qty -= matched;
        qty -= matched;
        if (lot.qty === 0) fifo[tx.symbol].shift();
      }
    }

    return res.json({
      realizedToday: Number(realizedToday.toFixed(2)),
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};



