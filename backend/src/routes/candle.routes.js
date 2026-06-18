import { Router } from "express";
import { getCandleData } from "../controllers/candle.controller.js";
import { verifyAuth } from "../middlewares/auth.middleware.js";
import { getRSI } from "../controllers/rsi.controller.js";

const candleRouter = Router();

candleRouter.get("/:symbol", getCandleData);

candleRouter.get("/:symbol/rsi", getRSI);

export default candleRouter;
