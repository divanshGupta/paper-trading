import { Router } from "express";
import { getCandleData } from "../controllers/candle.controller.js";
import { verifyAuth } from "../middlewares/auth.middleware.js";

const candleRouter = Router();

candleRouter.get("/:symbol", getCandleData);

export default candleRouter;
