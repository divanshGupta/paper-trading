import { prisma } from "../utils/db.js";

export const getPortfolio = async (req, res) => {
  try {
    const userId = req.user.id;

    const holdings = await prisma.portfolio.findMany({
      where: { userId },
      orderBy: { symbol: "asc" }
    });

    return res.status(200).json({ holdings });
    
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
