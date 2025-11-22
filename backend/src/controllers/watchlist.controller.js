// backend/src/controllers/watchlist.controller.js
import watchlistRouter from "../routes/watchlist.routes.js";
import { prisma } from "../utils/db.js";

export const getWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const items = await prisma.watchlist.findMany({
      where: { userId },
      select: { symbol: true }
    });

    return res.json({ watchlist: items.map(i => i.symbol) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const addToWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol } = req.body;

    if (!symbol)
      return res.status(400).json({ message: "Symbol required" });

    const exists = await prisma.watchlist.findFirst({
      where: { userId, symbol }
    });

    if (exists)
      return res.json({ message: "Already in watchlist" });

    await prisma.watchlist.create({
      data: { userId, symbol }
    });

    return res.json({ success: true, symbol });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const removeFromWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol } = req.body;

    await prisma.watchlist.deleteMany({
      where: { userId, symbol }
    });

    return res.json({ success: true, symbol });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const checkWatchlist = async (req, res) => {
  const userId = req.user.id;
  const symbol = req.params.symbol;

  const exists = await prisma.watchlist.findFirst({
    where: { userId, symbol }
  });

  return res.json({ inWatchlist: !!exists });
};

export const toggleWatchlist = async (req, res) => {
  const userId = req.user.id;
  const { symbol } = req.body;

  const exists = await prisma.watchlist.findFirst({
    where: { userId, symbol }
  });

  if (exists) {
    await prisma.watchlist.deleteMany({ where: { userId, symbol } });
    return res.json({ added: false });
  }

  await prisma.watchlist.create({ data: { userId, symbol } });
  return res.json({ added: true });
};






