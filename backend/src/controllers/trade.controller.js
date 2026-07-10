// backend/src/controllers/portfolio.controller.js
import { prisma } from "../utils/db.js";
import { getIO } from "../config/socket.js"; // safe getter (throws if socket not inited)
import { PRICES } from "../services/priceEngine.js"; // live price array from engine
import { isMarketOpen } from "../utils/marketTimes.js";
import logger from "../utils/logger.js";
import { findLiveStock, round2 } from "../utils/stockUtils.js";

// BUY stock
export const buyStock = async (req, res) => {
  try {
    logger.info(`New order request: ${JSON.stringify(req.body)}`);

    // Block trading outside market hours
    if (!isMarketOpen()) {
      return res.status(403).json({
        message: "Market is closed. Try again between 9:15 AM and 3:30 PM.",
      });
    }

    const { symbol, quantity } = req.body;
    const userId = req.user.id;

    if (!symbol || !Number.isInteger(quantity) || quantity <= 0 || quantity > 100000) {
      return res.status(400).json({ message: "Valid symbol and quantity required" });
    }

    // ✅ 1. Fetch live market price from price engine (PRICES)
    const stock = findLiveStock(symbol);
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }
    const price = Number(stock.price);
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(500).json({ message: "Invalid live price" });
    }

    // Total cost
    const totalCost = round2(price * quantity);

    // ✅ 2. Fetch user wallet balance
    const user = await prisma.user.findUnique({
      where: { supabaseId: userId },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const currentBalance = Number(user.balance);

    // Check if user has enough funds
    if (currentBalance < totalCost) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // ✅ 3. Fetch or create portfolio entry
    let holding = await prisma.portfolio.findFirst({
      where: { userId, symbol },
    });

    if (!holding) {
      holding = await prisma.portfolio.create({
        data: {
          userId,
          symbol,
          quantity,
          avgPrice: price,
        },
      });
    } else {
      const oldQty = holding.quantity;
      const oldAvg = Number(holding.avgPrice);

      const newQty = oldQty + quantity;
      const newAvgPrice = round2((oldAvg * oldQty + price * quantity) / newQty);

      await prisma.portfolio.update({
        where: { id: holding.id },
        data: {
          quantity: newQty,
          avgPrice: newAvgPrice,
        },
      });
    }

    // ✅ 4. Deduct balance
    const newBalance = round2(currentBalance - totalCost);

    await prisma.user.update({
      where: { supabaseId: userId },
      data: { balance: newBalance },
    });

    // ✅ 5. Record transaction
    await prisma.transaction.create({
      data: {
        userId,
        symbol,
        type: "BUY",
        quantity,
        price,
        total: totalCost,
      },
    });

    logger.info(`Order created successfully for user=${userId}, symbol=${symbol}`);

    // -------------------------------------------
    // 🔥 REAL-TIME SOCKET UPDATE → CRITICAL LINE
    // -------------------------------------------
    try {
      const io = getIO();
      const updatedPortfolio = await prisma.portfolio.findMany({
        where: { userId },
        orderBy: { symbol: "asc" },
      });

      const updatedUser = await prisma.user.findUnique({
        where: { supabaseId: userId },
      });

      io.to(userId).emit("portfolio:update", {
        holdings: updatedPortfolio,
        balance: updatedUser ? updatedUser.balance : newBalance,
      });
    } catch (emitErr) {
      // don't fail the request if socket isn't ready — just log
      logger.warn("Socket emit failed (buyStock):", emitErr.message || emitErr);
    }

    // -------------------------------------------

    return res.status(200).json({
      message: "Buy successful",
      price,
      totalCost,
      newBalance,
    });
  } catch (error) {
    logger.error(`Error placing order (buyStock): ${error}`);
    return res.status(500).json({ message: "Server error", error: String(error) });
  }
};

// SELL stock
export const sellStock = async (req, res) => {
  try {
    if (!isMarketOpen()) {
      return res.status(403).json({ message: "Market is closed." });
    }

    const { symbol, quantity } = req.body;
    const userId = req.user.id;

    if (!symbol || !Number.isInteger(quantity) || quantity <= 0 || quantity > 100000) {
      return res.status(400).json({ message: "Valid symbol and quantity required" });
    }

    // 1. Live price
    const stock = findLiveStock(symbol);
    if (!stock) return res.status(404).json({ message: "Stock not found" });

    const price = Number(stock.price);
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(500).json({ message: "Invalid live price" });
    }

    // 2. Holding check
    const holding = await prisma.portfolio.findFirst({
      where: { userId, symbol },
    });

    if (!holding || holding.quantity < quantity) {
      return res.status(400).json({ message: "Not enough shares to sell" });
    }

    // 3. Realized PnL
    const avgBuyPrice = Number(holding.avgPrice);
    const realizedPnl = round2((price - avgBuyPrice) * quantity);

    // 4. Update holding
    const newQty = holding.quantity - quantity;

    if (newQty > 0) {
      await prisma.portfolio.update({
        where: { id: holding.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.portfolio.delete({ where: { id: holding.id } });
    }

    // 5. Update balance
    const user = await prisma.user.findUnique({ where: { supabaseId: userId } });
    const newBalance = round2(Number(user.balance) + price * quantity);

    await prisma.user.update({
      where: { supabaseId: userId },
      data: { balance: newBalance },
    });

    // 6. Transaction
    await prisma.transaction.create({
      data: {
        userId,
        symbol,
        type: "SELL",
        quantity,
        price,
        total: round2(price * quantity),
        realizedPnl,
      },
    });

    // -------------------------------------------------
    // 🔥 7. SOCKET REAL-TIME UPDATE (CRITICAL)
    // -------------------------------------------------
    try {
      const io = getIO();
      const updatedPortfolio = await prisma.portfolio.findMany({
        where: { userId },
        orderBy: { symbol: "asc" },
      });

      const updatedUser = await prisma.user.findUnique({
        where: { supabaseId: userId },
      });

      // adding realizedToday to the socket emit - 21-05-26
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todaySells = await prisma.transaction.findMany({
        where: {
          userId,
          type: "SELL",
          createdAt: { gte: todayStart },
        },
        select: { realizedPnl: true },
      });

      const realizedToday = todaySells.reduce(
        (acc, tx) => acc + Number(tx.realizedPnl ?? 0),
        0
      );

      io.to(userId).emit("portfolio:update", {
        holdings: updatedPortfolio,
        balance: updatedUser?.balance ?? null,
        realizedToday: Number(realizedToday.toFixed(2)),
      });

      // end of new change - 21-05-26
      
    } catch (emitErr) {
      logger.warn("Socket emit failed (sellStock):", emitErr.message || emitErr);
    }
    // -------------------------------------------------

    return res.status(200).json({
      message: "Sell successful",
      realizedPnl,
      newBalance,
    });
  } catch (error) {
    logger.error("SELL ERROR:", error);
    return res.status(500).json({ message: "Server error", error: String(error) });
  }
};

// SQUARE-OFF stock
export const squaredOffPosition = async (req, res) => {
  try {
    if (!isMarketOpen()) {
      return res.status(403).json({ message: "Market is closed." });
    }

    const { symbol } = req.body;
    const userId = req.user.id;

    if (!symbol) {
      return res.status(400).json({ message: "Valid symbol required" });
    }

    const stock = findLiveStock(symbol);
    if (!stock) return res.status(404).json({ message: "Stock not found" });

    const price = Number(stock.price);
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(500).json({ message: "Invalid live price" });
    }

    await prisma.$transaction(async (tx) => {
      const holding = await tx.portfolio.findFirst({ where: { userId, symbol } });
      if (!holding || holding.quantity <= 0) throw new Error("NO_POSITION");

      const qty = holding.quantity;
      const total = round2(qty * price);

      // Update balance
      await tx.user.update({
        where: { supabaseId: userId },
        data: { balance: { increment: total } },
      });

      // Delete holding
      await tx.portfolio.delete({ where: { id: holding.id } });

      // Record PnL
      const avgBuyPrice = Number(holding.avgPrice);
      const realizedPnl = round2((price - avgBuyPrice) * qty);

      await tx.transaction.create({
        data: {
          userId,
          symbol,
          type: "SELL",
          quantity: qty,
          price,
          total,
          realizedPnl: realizedPnl.toFixed(2),
        },
      });
    });

    // 🔥 real-time update
    try {
      const io = getIO();
      const updatedPortfolio = await prisma.portfolio.findMany({
        where: { userId },
        orderBy: { symbol: "asc" },
      });

      const updatedUser = await prisma.user.findUnique({
        where: { supabaseId: req.user.id },
      });

      // adding realizedToday to the socket emit - 21-05-26
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todaySells = await prisma.transaction.findMany({
        where: {
          userId,
          type: "SELL",
          createdAt: { gte: todayStart },
        },
        select: { realizedPnl: true },
      });

      const realizedToday = todaySells.reduce(
        (acc, tx) => acc + Number(tx.realizedPnl ?? 0),
        0
      );

      io.to(userId).emit("portfolio:update", {
        holdings: updatedPortfolio,
        balance: updatedUser?.balance ?? null,
        realizedToday: Number(realizedToday.toFixed(2)),
      });

      // end of new change - 21-05-26

    } catch (emitErr) {
      logger.warn("Socket emit failed (squaredOffPosition):", emitErr.message || emitErr);
    }

    return res.status(200).json({ message: "Square off done" });
  } catch (err) {
    if (err.message === "NO_POSITION") {
      return res.status(409).json({ message: "No position to square off" });
    }
    logger.error("Square-off error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
