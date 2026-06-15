import { Router } from "express";
import { getCandleData } from "../controllers/candle.controller.js";
import { verifyAuth } from "../middlewares/auth.middleware.js";

console.log("CANDLE ROUTER LOADED");
const candleRouter = Router();

candleRouter.get("/:symbol", getCandleData);

export default candleRouter;
