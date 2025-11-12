import { Router } from "express";
import { getSnapshot } from "../services/priceEngine.js";

const marketRouter = Router();

marketRouter.get("/prices", (_req, res) => {
  res.json({ prices: getSnapshot() });
});

export default marketRouter;
