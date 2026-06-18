import { Router } from "express";
import { getSnapshot } from "../services/priceEngine.js";
import { resetDailyPrices } from "../controllers/market.controller.js";
import { verifyAuth } from '../middlewares/auth.middleware.js';

const marketRouter = Router();

marketRouter.get("/prices", (_req, res) => {
  res.json({ prices: getSnapshot() });
});

marketRouter.post("/reset-daily", verifyAuth, resetDailyPrices);

export default marketRouter;
