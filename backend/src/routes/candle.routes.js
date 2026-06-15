import { Router } from "express";
import { getCandleData } from "../controllers/candle.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const candleRouter = Router();

candleRouter.get("/:symbol", verifyAuth, getCandleData);

export default candleRouter;
